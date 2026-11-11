<script setup lang="ts">
import { texts } from '~/content/texts'
import {
  accentFillFeedbackClass,
  disabledFillClass,
  innerFocusClass,
  interactiveClass,
  outerFocusClass,
  pressClass,
  tintFeedbackClass,
} from '~/config/feedback'
import type { BirthDate } from '~/utils/matrix/types'
import type { CalendarSelectOption } from './CalendarSelect.vue'
import {
  addDays,
  type BirthDateParts,
  clampDate,
  compareDates,
  daysInMonth,
  formatBirthDate,
  getMonthWeeks,
  isSameDate,
  MAX_MONTH_WEEKS,
  MIN_BIRTH_DATE,
} from '~/utils/date/birthDate'

// Календарь выбора даты рождения (панель DateField).
// parts — части даты из текста поля (в том числе неполного): календарь следует за ними во время ввода —
// введённый месяц и год показываются, введённый день выделяется в показанном месяце; при недопустимой части выделения нет.
// Выбор в календаре (день, а при выбранном дне — и смена месяца или года) сразу сообщается родителю событием select (полная дата).
// Смена месяца сохраняет выбранный день: если его нет в месяце — последний день месяца; вне 1900…max — ближайшая допустимая дата.
// «Подтвердить» (confirm) доступна, только когда confirmable.
// Доступны дни с MIN_BIRTH_DATE по max (сегодня). Год и месяц выбираются селектами, стрелки — соседние месяцы.
// Клавиатура в сетке дней: стрелки — на день / неделю (с переходом через месяц), Enter или пробел — выбрать день.
// Недоступные элементы — aria-disabled, а не disabled: нажатие по disabled-кнопке не доходит до обработчиков панели,
// фокус уходит из поля и календарь закрывается
const props = defineProps<{
  id: string
  max: BirthDate
  parts: BirthDateParts
  confirmable: boolean
}>()

const emit = defineEmits<{
  select: [date: BirthDate]
  confirm: []
}>()

const calendarTexts = texts.form.calendar

interface MonthView {
  year: number
  month: number
}

// Порядковый номер месяца для сравнения месяцев
const monthIndex = ({ year, month }: MonthView) => year * 12 + month - 1

// Месяц в пределах MIN_BIRTH_DATE…max
const clampView = (target: MonthView): MonthView => {
  if (monthIndex(target) > monthIndex(props.max)) return { year: props.max.year, month: props.max.month }
  if (monthIndex(target) < monthIndex(MIN_BIRTH_DATE)) return { year: MIN_BIRTH_DATE.year, month: MIN_BIRTH_DATE.month }
  return target
}

const isOutOfRange = (date: BirthDate) =>
  compareDates(date, MIN_BIRTH_DATE) < 0 || compareDates(date, props.max) > 0

// Показываемый месяц: введённые месяц и год, иначе текущий (max)
const view = ref<MonthView>(clampView({
  year: props.parts.year ?? props.max.year,
  month: props.parts.month ?? props.max.month,
}))

// Выбранный день в показанном месяце (выделен): день введён, введённые месяц и год совпадают с показанными, дата допустима
const selected = computed<BirthDate | null>(() => {
  const { day, month, year, invalid } = props.parts
  if (invalid || day === null) return null
  if ((month !== null && month !== view.value.month) || (year !== null && year !== view.value.year)) return null
  const date: BirthDate = { day, month: view.value.month, year: view.value.year }
  if (day > daysInMonth(date.year, date.month) || isOutOfRange(date)) return null
  return date
})

// Дата в месяце target с номером дня day (не дальше конца месяца), в пределах диапазона
const dayInView = (target: MonthView, day: number): BirthDate =>
  clampDate({ ...target, day: Math.min(day, daysInMonth(target.year, target.month)) }, MIN_BIRTH_DATE, props.max)

// День, на котором фокус клавиатуры в сетке (единственная кнопка дня с tabindex 0); всегда в показанном месяце
const active = ref<BirthDate>(selected.value ?? dayInView(view.value, props.max.day))

// Ввод в поле: календарь переходит на введённые месяц и год, фокусный день — выделенный
watch(() => props.parts, (parts) => {
  const target = clampView({ year: parts.year ?? view.value.year, month: parts.month ?? view.value.month })
  if (monthIndex(target) !== monthIndex(view.value)) {
    view.value = target
    active.value = dayInView(target, active.value.day)
  }
  if (selected.value) active.value = selected.value
})

const weeks = computed(() => getMonthWeeks(view.value.year, view.value.month))

// Пустые строки после последней недели: сетка всегда на MAX_MONTH_WEEKS недель — высота календаря не меняется
// при смене месяца («Подтвердить» не прыгает)
const fillerWeeks = computed(() => MAX_MONTH_WEEKS - weeks.value.length)

// Годы — от текущего к 1900
const years = computed(() =>
  Array.from({ length: props.max.year - MIN_BIRTH_DATE.year + 1 }, (_, index) => props.max.year - index))

const dateOf = (day: number): BirthDate => ({ day, month: view.value.month, year: view.value.year })

// Месяц после текущего недоступен (весь в будущем)
const isMonthDisabled = (year: number, month: number) => monthIndex({ year, month }) > monthIndex(props.max)

// Переход на другой месяц (стрелки, селекты). Если день выбран (введён в поле или выбран в календаре) —
// он сохраняется в новом месяце и новая дата сразу уходит в поле; иначе меняется только показанный месяц
const setView = (year: number, month: number) => {
  const target = clampView({ year, month })
  const { day, invalid } = props.parts
  if (day !== null && !invalid) {
    const date = dayInView(target, day)
    view.value = { year: date.year, month: date.month }
    active.value = date
    emit('select', date)
    return
  }
  view.value = target
  active.value = dayInView(target, active.value.day)
}

const shiftMonth = (step: number) => {
  const index = monthIndex(view.value) + step
  setView(Math.floor(index / 12), (index % 12) + 1)
}

const isPrevDisabled = computed(() => monthIndex(view.value) <= monthIndex(MIN_BIRTH_DATE))
const isNextDisabled = computed(() => monthIndex(view.value) >= monthIndex(props.max))

const onPrev = () => {
  if (!isPrevDisabled.value) shiftMonth(-1)
}

const onNext = () => {
  if (!isNextDisabled.value) shiftMonth(1)
}

const onYearChange = (event: Event) => {
  setView(Number((event.target as HTMLSelectElement).value), view.value.month)
}

const onMonthChange = (event: Event) => {
  setView(view.value.year, Number((event.target as HTMLSelectElement).value))
}

const selectDay = (day: number) => {
  const date = dateOf(day)
  if (isOutOfRange(date)) return
  active.value = date
  emit('select', date)
}

const onConfirm = () => {
  if (props.confirmable) emit('confirm')
}

const grid = ref<HTMLTableElement>()

const focusActiveDay = async () => {
  await nextTick()
  grid.value?.querySelector<HTMLButtonElement>(`[data-day="${active.value.day}"]`)?.focus()
}

// Шаг стрелок в днях
const arrowSteps: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

// Стрелки только переводят фокус (выбор — Enter или пробелом)
const onDayKeydown = (event: KeyboardEvent) => {
  const step = arrowSteps[event.key]
  if (step === undefined) return
  event.preventDefault()
  const next = clampDate(addDays(active.value, step), MIN_BIRTH_DATE, props.max)
  active.value = next
  view.value = { year: next.year, month: next.month }
  focusActiveDay()
}

const dayClass = (day: number) => {
  const date = dateOf(day)
  if (isOutOfRange(date)) return 'cursor-default text-line-input'
  if (isSameDate(date, selected.value)) {
    return [pressClass, accentFillFeedbackClass, 'bg-accent font-semibold text-surface']
  }
  return [pressClass, tintFeedbackClass, 'text-ink']
}

// Кнопки «предыдущий / следующий месяц»: у недоступной нет отклика
const navButtonClass = (disabled: boolean) =>
  disabled ? 'cursor-default text-line-input' : [pressClass, tintFeedbackClass, 'text-ink']

// Варианты селектов: месяцы (будущие в текущем году недоступны) и годы
const monthOptions = computed<CalendarSelectOption[]>(() => calendarTexts.months.map((label, index) => ({
  value: index + 1,
  label,
  disabled: isMonthDisabled(view.value.year, index + 1),
})))

const yearOptions = computed<CalendarSelectOption[]>(() => years.value.map(year => ({ value: year, label: String(year) })))

// «Подтвердить» без полной допустимой даты — неактивна (как «Рассчитать»)
const confirmClass = computed(() => props.confirmable
  ? [pressClass, accentFillFeedbackClass, 'bg-accent text-surface']
  : disabledFillClass)

// Навигация переносится, если в одну строку не помещается в максимальную ширину календаря (крупный шрифт в настройках)
const panel = ref<HTMLElement>()
const nav = ref<HTMLElement>()
const { isWrapped: isNavWrapped } = useRowWrap(nav, panel)

defineExpose({
  // Перевод фокуса в сетку дней (стрелка вниз из поля)
  focusGrid: focusActiveDay,
})
</script>

<template>
  <div
    :id="id"
    ref="panel"
    role="dialog"
    :aria-label="calendarTexts.label"
    class="rounded-card border border-line bg-surface px-2 py-3 shadow-menu lg:px-3"
    data-testid="date-picker"
  >
    <!-- Внутренние отступы: сверху и снизу 12 px; по бокам 8 px (с lg — 12): на узком телефоне (320) боковые 12
         не дали бы строке навигации с длинным названием месяца поместиться в ширину экрана -->
    <!-- Навигация в одну строку: предыдущий месяц, месяц, год, следующий месяц (порядок Tab тот же).
         Месяц не обрезается: календарь не уже этой строки (min-w-min в DateField).
         Если строка не помещается в максимальную ширину календаря (крупный шрифт в настройках) — перенос (data-wrapped):
         сетка из двух строк, в первой стрелки по краям, во второй месяц (вся оставшаяся ширина) и год. Расстановка —
         только раскладкой сетки, порядок в разметке и Tab не меняется. Колонка месяца не уже его названия
         (minmax(min-content, …)) — календарь не уже второй строки. Предыдущий месяц — в первую свободную ячейку (1, 1) -->
    <div
      ref="nav"
      class="group/nav flex items-center gap-1 data-wrapped:grid data-wrapped:grid-cols-[minmax(min-content,1fr)_auto]"
      :data-wrapped="isNavWrapped || undefined"
      data-testid="date-picker-nav"
    >
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-tab pointer-coarse:size-10"
        :class="[interactiveClass, outerFocusClass, navButtonClass(isPrevDisabled)]"
        :aria-label="calendarTexts.prevMonth"
        :aria-disabled="isPrevDisabled || undefined"
        data-testid="date-picker-prev"
        @click="onPrev"
      >
        <svg
          class="size-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10 3L5 8l5 5" />
        </svg>
      </button>
      <CalendarSelect
        class="min-w-0 flex-1 group-data-wrapped/nav:col-start-1 group-data-wrapped/nav:row-start-2"
        :options="monthOptions"
        :aria-label="calendarTexts.month"
        :value="view.month"
        data-testid="date-picker-month"
        @change="onMonthChange"
      />
      <CalendarSelect
        class="shrink-0 group-data-wrapped/nav:col-start-2 group-data-wrapped/nav:row-start-2"
        :options="yearOptions"
        :aria-label="calendarTexts.year"
        :value="view.year"
        data-testid="date-picker-year"
        @change="onYearChange"
      />
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-tab pointer-coarse:size-10 group-data-wrapped/nav:col-start-2 group-data-wrapped/nav:row-start-1 group-data-wrapped/nav:justify-self-end"
        :class="[interactiveClass, outerFocusClass, navButtonClass(isNextDisabled)]"
        :aria-label="calendarTexts.nextMonth"
        :aria-disabled="isNextDisabled || undefined"
        data-testid="date-picker-next"
        @click="onNext"
      >
        <svg
          class="size-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 3l5 5-5 5" />
        </svg>
      </button>
    </div>

    <!-- Сетка дней, неделя с понедельника; подписи дней недели — в той же таблице, над своими колонками.
         Тач — плотнее: ширина колонки задана у подписей (w-11 — кнопка дня 40 px + 4 px), таблица — по содержимому
         (w-auto: не растягивается на всю панель, на широкой панели по центру; на узкой колонки сжимаются до ширины панели) -->
    <table
      ref="grid"
      class="mt-2 w-full table-fixed border-collapse pointer-coarse:mx-auto pointer-coarse:w-auto"
      data-testid="date-picker-grid"
    >
      <thead>
        <tr>
          <th
            v-for="weekday in calendarTexts.weekdays"
            :key="weekday"
            scope="col"
            class="h-5 text-xs font-semibold text-ink-muted pointer-coarse:w-11"
          >
            {{ weekday }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(week, weekIndex) in weeks"
          :key="weekIndex"
        >
          <td
            v-for="(day, dayIndex) in week"
            :key="dayIndex"
            class="p-0"
          >
            <!-- Доступное имя — полная дата ДД.ММ.ГГГГ: одно число дня без месяца и года непонятно.
                 Кнопка 32 × 32 px; на таче 40 × 32 px (шаг строк 32), в узкой колонке — во всю её ширину (соседние кнопки не перекрываются) -->
            <button
              v-if="day"
              type="button"
              class="mx-auto flex size-8 items-center justify-center rounded-tab text-sm pointer-coarse:w-full pointer-coarse:max-w-10"
              :class="[interactiveClass, innerFocusClass, dayClass(day)]"
              :aria-label="formatBirthDate(dateOf(day))"
              :aria-pressed="isSameDate(dateOf(day), selected)"
              :aria-disabled="isOutOfRange(dateOf(day)) || undefined"
              :tabindex="isSameDate(dateOf(day), active) ? 0 : -1"
              :data-day="day"
              @click="selectDay(day)"
              @keydown="onDayKeydown"
            >
              {{ day }}
            </button>
          </td>
        </tr>
        <!-- Пустые строки до шести недель: высота — как у строки с днями (кнопка дня h-8), без кнопок и дней
             соседних месяцев, скрыты от диктора -->
        <tr
          v-for="filler in fillerWeeks"
          :key="`filler-${filler}`"
          aria-hidden="true"
          data-testid="date-picker-filler-week"
        >
          <td
            colspan="7"
            class="h-8 p-0"
          />
        </tr>
      </tbody>
    </table>

    <button
      type="button"
      class="mt-2 h-10 w-full rounded-field text-base font-semibold"
      :class="[interactiveClass, outerFocusClass, confirmClass]"
      :aria-disabled="!confirmable || undefined"
      data-testid="date-picker-confirm"
      @click="onConfirm"
    >
      {{ calendarTexts.confirm }}
    </button>
  </div>
</template>
