<script setup lang="ts">
import { texts } from '~/content/texts'
import {
  editBirthDateByKey,
  formatBirthDate,
  maskBirthDateEdit,
  parseBirthDate,
  parseBirthDateParts,
  toBirthDate,
  type MaskedInput,
} from '~/utils/date/birthDate'
import type { BirthDate } from '~/utils/matrix/types'
import type DatePicker from './DatePicker.vue'
import type TextField from './TextField.vue'

// Поле даты рождения: ввод по маске ДД.ММ.ГГГГ + календарь (DatePicker).
// Календарь открывается при фокусе (и по клику, если закрыт) над полем; если сверху не помещается — под полем.
// Если календарь виден не целиком (обрезан окном или под шапкой) — страница прокручивается до полного вида.
// Ширина при мыши — как у поля, от его левого края; не уже содержимого (min-w-min: строка «‹ месяц год ›»,
// название месяца не обрезается).
// Тач: ширина по содержимому (w-max: сетка 7 колонок под кнопки 40 px и строка навигации); на узком экране колонки
// сжимаются, а min-w-min не даёт обрезать месяц.
// Всегда (и при мыши) не шире окна без боковых отступов страницы (px-4 в app.vue — 2 × 4 единицы spacing): если строка
// навигации в эту ширину не помещается (крупный шрифт в настройках), DatePicker переносит месяц и год на вторую строку,
// и min-w-min не выталкивает календарь за max-width. Телефон (ниже sm): календарь шире поля — по центру поля (поле по центру экрана,
// календарь не выходит за край); с sm поле шире календаря — от левого края поля, как при мыши.
// Поле и календарь синхронны: ввод (в том числе неполный) сразу показывается в календаре, выбор в календаре — сразу в поле.
// «Подтвердить» (и Enter в поле при полной допустимой дате) фиксирует значение и закрывает календарь. Закрытие без подтверждения
// (Escape, Enter при неполной или недопустимой дате, клик вне поля и календаря, уход фокуса на другой элемент — Tab) возвращает
// зафиксированное значение: бывшее в поле при открытии, подтверждённое или напечатанное. Уход фокуса из окна (нативный список
// селекта на телефоне, переключение приложений) календарь не закрывает.
// Правка с клавиатуры при закрытом календаре (после подтверждения или закрытия) снова его открывает.
// Стрелка вниз — фокус в сетку дней.
// Клавиши цифр, точки, Backspace и Delete обрабатываются в keydown (editBirthDateByKey): в полной дате цифра заменяет
// следующую цифру, «1.» → «01.»; остальная правка (вставка, вырезание) — маской по событию input.
// Тач-устройства (pointer: coarse): поле только для чтения, без экранной клавиатуры, дата выбирается в календаре;
// с подключённой физической клавиатурой те же клавиши работают через keydown (браузер в readonly-поле текст не меняет).
// Касание поля не прокручивает страницу (onInputPointerdown).
// Событие leave — фокус ушёл из поля и календаря (родитель проверяет значение).
const props = defineProps<{
  id: string
  label: string
  error?: string
}>()

const value = defineModel<string>({ required: true })

const emit = defineEmits<{
  leave: []
}>()

const root = ref<HTMLElement>()
const field = ref<InstanceType<typeof TextField>>()
const picker = ref<InstanceType<typeof DatePicker>>()

const pickerId = computed(() => `${props.id}-calendar`)

const isOpen = ref(false)
// Где календарь относительно поля
const placement = ref<'top' | 'bottom'>('top')
// Верхняя граница дат; обновляется при каждом открытии (часы устройства)
const today = ref<BirthDate>(toBirthDate(new Date()))
// Зафиксированное значение — к нему поле возвращается при закрытии календаря без подтверждения.
// Меняется при открытии, подтверждении и вводе с клавиатуры; выбор в календаре его не меняет
let committed = value.value

// Части введённой даты — для календаря; полная допустимая дата — условие «Подтвердить»
const parts = computed(() => parseBirthDateParts(value.value, today.value))
const isConfirmable = computed(() => parseBirthDate(value.value, today.value).ok)

// Тач-устройство: основной указатель — палец
const isCoarsePointer = ref(false)
let coarseQuery: MediaQueryList | undefined
const onPointerQueryChange = (event: MediaQueryListEvent) => {
  isCoarsePointer.value = event.matches
}

onMounted(() => {
  coarseQuery = window.matchMedia('(pointer: coarse)')
  isCoarsePointer.value = coarseQuery.matches
  coarseQuery.addEventListener('change', onPointerQueryChange)
})

// Правка с клавиатуры: новое значение сразу в поле (курсор — на своём месте) и фиксируется;
// если календарь закрыт и значение изменилось — календарь открывается (при закрытом календаре committed = значение до правки).
// Зависимость от порядка обработчиков (путь через input): v-model в TextField записывает в модель сырой текст
// своим слушателем input, и маска здесь должна записаться после него. Так и есть: слушатель v-model ставит директива
// (хук created), а Vue вызывает его до установки обработчиков из атрибутов (@input отсюда). Если v-model в TextField
// заменить (v-model.lazy, свой обработчик после @input), сырой текст перезапишет маску
const applyTyped = (input: HTMLInputElement, { value: text, caret }: MaskedInput) => {
  if (input.value !== text) input.value = text
  input.setSelectionRange(caret, caret)
  // open() — до записи: он фиксирует value.value, а модель отдаёт новое значение только после обновления родителя
  if (!isOpen.value && text !== committed) open()
  value.value = text
  committed = text
}

// Маска при правке, не обработанной в keydown (вставка, вырезание, ввод без keydown): точки ставятся сами, лишнее отбрасывается
const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  applyTyped(input, maskBirthDateEdit(input.value, input.selectionStart ?? input.value.length))
}

const open = async () => {
  if (isOpen.value) return
  today.value = toBirthDate(new Date())
  committed = value.value
  placement.value = 'top'
  isOpen.value = true

  // Над полем не помещается (верх календаря выше окна) — открываем под полем.
  // offsetTop — без учёта анимации появления (scale)
  await nextTick()
  const panel = picker.value?.$el as HTMLElement | undefined
  const anchor = panel?.offsetParent
  if (!panel || !anchor || anchor.getBoundingClientRect().top + panel.offsetTop >= 0) return
  placement.value = 'bottom'
}

// После появления календаря (конец анимации — размер без scale) он должен быть виден целиком: страница прокручивается
// минимально (block: 'nearest'), только если он обрезан окном или заходит под закреплённую шапку; иначе не прокручивается.
// Границы — scroll-padding у html (main.css): сверху высота шапки, снизу зазор. Проверка после анимации ловит и прокрутку,
// которую браузер телефона делает сам при фокусе поля касанием (календарь над полем уезжал под шапку).
// Плавно; при prefers-reduced-motion — сразу
const revealPanel = (panel: Element) => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  panel.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
}

// Закрытие без подтверждения: поле возвращается к зафиксированному значению
const cancel = () => {
  if (!isOpen.value) return
  value.value = committed
  isOpen.value = false
}

// Возврат фокуса в поле без повторного открытия календаря и без прокрутки страницы (поле рядом с календарём или
// уже видно)
let isRefocusing = false
const refocusInput = () => {
  isRefocusing = true
  field.value?.focus({ preventScroll: true })
  isRefocusing = false
}

const onFocus = () => {
  if (!isRefocusing) open()
}

// Касание поля на тач-устройстве: отмена pointerdown убирает нативный фокус касанием, при котором браузер телефона
// прокручивает страницу к полю (даже readonly без клавиатуры) — а прокрутка прячет шапку. Фокус ставится вручную без
// прокрутки, календарь открывается как при фокусе. Обрезанный календарь по-прежнему докручивается в revealPanel.
// Мышь (в том числе подключённая к тач-устройству) — без изменений
const onInputPointerdown = (event: PointerEvent) => {
  if (!isCoarsePointer.value || event.pointerType === 'mouse') return
  event.preventDefault()
  field.value?.focus({ preventScroll: true })
  open()
}

// Выбор в календаре — сразу в поле (зафиксируется подтверждением)
const onSelect = (date: BirthDate) => {
  value.value = formatBirthDate(date)
}

// Подтверждение: значение фиксируется, календарь закрывается. false — подтверждать нечего (закрыт или дата не полная)
const commit = (): boolean => {
  if (!isOpen.value || !isConfirmable.value) return false
  committed = value.value
  isOpen.value = false
  return true
}

// «Подтвердить» и Enter в поле: фокус остаётся (возвращается) в поле
const onConfirm = () => {
  if (commit()) refocusInput()
}

const onEscape = (event: KeyboardEvent) => {
  if (!isOpen.value) return
  event.preventDefault()
  if (root.value?.contains(document.activeElement) && document.activeElement !== field.value?.input) refocusInput()
  cancel()
}

const onInputKeydown = (event: KeyboardEvent) => {
  // Цифры, точка, Backspace, Delete (без сочетаний и не во время набора IME) — правка вручную
  if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
    const input = event.target as HTMLInputElement
    const start = input.selectionStart ?? input.value.length
    const result = editBirthDateByKey(input.value, start, input.selectionEnd ?? start, event.key)
    if (result) {
      event.preventDefault()
      applyTyped(input, result)
      return
    }
  }

  if (!isOpen.value) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    picker.value?.focusGrid()
  }
  // Enter: полная допустимая дата — подтверждение без отправки формы; иначе форма отправляется (по умолчанию),
  // календарь закрывается без подтверждения
  if (event.key === 'Enter') {
    if (isConfirmable.value) {
      event.preventDefault()
      onConfirm()
    }
    else {
      cancel()
    }
  }
}

// Фокус ушёл за пределы поля и календаря (Tab, клик по другому элементу или пустому месту)
// Уход фокуса «в никуда» (relatedTarget null) при открытом календаре календарь не закрывает: так браузер сообщает
// о нативном списке выбора селекта на телефоне и о переключении окна или приложения — после возврата пользователь
// продолжает в календаре (выбранные месяц и год сохраняются). Клик по пустому месту закрывает календарь раньше —
// в onDocumentPointerdown, и к этому событию он уже закрыт (leave отправляется как обычно)
const onFocusout = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null
  if (next && root.value?.contains(next)) return
  if (!next && isOpen.value) return
  cancel()
  emit('leave')
}

// Нажатие внутри календаря не уводит фокус из поля (в том числе по недоступному дню и стрелке);
// исключение — селекты года и месяца: им фокус нужен, чтобы открыться
const onPanelMousedown = (event: MouseEvent) => {
  if (!(event.target as Element).closest('select')) event.preventDefault()
}

// Клик вне поля и календаря закрывает календарь без подтверждения; слушатель — только пока календарь открыт
const onDocumentPointerdown = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) cancel()
}

watch(isOpen, (isOpenNow) => {
  if (isOpenNow) document.addEventListener('pointerdown', onDocumentPointerdown)
  else document.removeEventListener('pointerdown', onDocumentPointerdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerdown)
  coarseQuery?.removeEventListener('change', onPointerQueryChange)
})

// Появление и исчезновение календаря: проявление и лёгкое увеличение от поля, 150 мс; без анимации при reduced motion.
// duration-0 нужен Transition: он ждёт конца перехода по transition-duration (как у меню шапки)
const transition = {
  enterActiveClass: 'transition duration-150 ease-out motion-reduce:transition-none motion-reduce:duration-0',
  enterFromClass: 'opacity-0 scale-95',
  leaveActiveClass: 'pointer-events-none transition duration-150 ease-in motion-reduce:transition-none motion-reduce:duration-0',
  leaveToClass: 'opacity-0 scale-95',
}

defineExpose({
  // Фокус извне (отправка формы с ошибкой, в том числе нажатие неактивной «Рассчитать»): без открытия календаря,
  // чтобы он не закрыл текст ошибки и соседние поля
  focus: refocusInput,
  // Подтверждение извне (нажатие «Рассчитать» при открытом календаре): фокус не трогает. false — подтверждать нечего
  confirm: commit,
})
</script>

<template>
  <div
    ref="root"
    @focusout="onFocusout"
    @keydown.esc="onEscape"
  >
    <TextField
      :id="id"
      ref="field"
      v-model="value"
      :label="label"
      :error="error"
      reserve-error-space
      type="text"
      :inputmode="isCoarsePointer ? 'none' : 'numeric'"
      :readonly="isCoarsePointer || undefined"
      autocomplete="off"
      :placeholder="texts.form.birthDatePlaceholder"
      role="combobox"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? pickerId : undefined"
      @focus="onFocus"
      @click="open"
      @pointerdown="onInputPointerdown"
      @input="onInput"
      @keydown="onInputKeydown"
    >
      <!-- Календарь — в разметке перед полем: Tab из поля уходит к следующему элементу формы, Shift+Tab — в календарь -->
      <Transition
        v-bind="transition"
        @after-enter="revealPanel"
      >
        <DatePicker
          v-if="isOpen"
          :id="pickerId"
          ref="picker"
          :max="today"
          :parts="parts"
          :confirmable="isConfirmable"
          class="absolute inset-x-0 z-30 min-w-min max-w-[calc(100vw-var(--spacing)*8)] pointer-coarse:w-max pointer-coarse:max-sm:left-1/2 pointer-coarse:max-sm:-translate-x-1/2"
          :class="placement === 'top' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'"
          @select="onSelect"
          @confirm="onConfirm"
          @mousedown="onPanelMousedown"
        />
      </Transition>
    </TextField>
  </div>
</template>
