<script setup lang="ts">
import { texts } from '~/content/texts'
import { accentFillFeedbackClass, disabledFillClass, interactiveClass, outerFocusClass, pressClass } from '~/config/feedback'
import type { BirthDate } from '~/utils/matrix/types'
import { type BirthDateError, MIN_BIRTH_DATE, parseBirthDate, toBirthDate } from '~/utils/date/birthDate'
import type DateField from './DateField.vue'
import { type FormTab, formTabId } from './FormTabs.vue'

// Форма расчёта: наклейка, заголовок, описание (компьютер), табы режима, имя, дата рождения, кнопка «Рассчитать».
// При правильной дате отправляет submit с именем (без пробелов по краям; пустое — undefined) и датой.
// «Рассчитать» неактивна, пока в поле нет полной допустимой даты (имя не влияет); нажатие неактивной — отправка с ошибкой:
// показывается ошибка даты, фокус — в поле даты.
// Ошибка даты показывается после ухода с заполненного поля с ошибкой или после отправки и исчезает, как только дата исправлена.
export interface CalculatorFormData {
  name: string | undefined
  birthDate: BirthDate
}

const emit = defineEmits<{
  submit: [data: CalculatorFormData]
}>()

// Наибольшая длина имени
const NAME_MAX_LENGTH = 50

type Mode = 'personal' | 'couple'

// «Для пары» — только визуально, до шага 14
const tabs: ReadonlyArray<FormTab<Mode>> = [
  { id: 'personal', label: texts.form.tabs.personal },
  { id: 'couple', label: texts.form.tabs.couple, disabled: true, note: texts.form.soon },
]

const mode = ref<Mode>('personal')
const name = ref('')
const birthDate = ref('')

const dateField = ref<InstanceType<typeof DateField>>()

// Показывать ли ошибку даты (включается, только когда ошибка есть: уход с заполненного поля, отправка)
const isDateErrorShown = ref(false)

const validateDate = () => parseBirthDate(birthDate.value, toBirthDate(new Date()))

// Текст ошибки по коду (граница «не раньше» — из MIN_BIRTH_DATE)
const errorText = (code: BirthDateError): string => {
  const message = texts.form.errors[code]
  return typeof message === 'function' ? message(MIN_BIRTH_DATE.year) : message
}

const dateError = computed(() => {
  if (!isDateErrorShown.value) return undefined
  const result = validateDate()
  return result.ok ? undefined : errorText(result.error)
})

// Полная допустимая дата введена — «Рассчитать» активна
const isReady = computed(() => validateDate().ok)

// Исправленная дата убирает ошибку; следующая — только после нового ухода с поля или отправки
watch(birthDate, () => {
  if (isDateErrorShown.value && validateDate().ok) isDateErrorShown.value = false
})

// Уход с пустого поля ошибку не показывает (её показывает только отправка)
const onDateLeave = () => {
  if (birthDate.value !== '' && !validateDate().ok) isDateErrorShown.value = true
}

const onSubmit = () => {
  const result = validateDate()
  if (!result.ok) {
    isDateErrorShown.value = true
    // Фокус в первое поле с ошибкой (имя необязательное, ошибок у него нет)
    dateField.value?.focus()
    return
  }
  emit('submit', { name: name.value.trim() || undefined, birthDate: result.date })
}

// Неактивная «Рассчитать» — aria-disabled, а не disabled: кнопка остаётся в порядке Tab и экранный диктор
// называет её недоступной (disabled убирает её из порядка Tab). Нажатие (и Enter в поле — неявная отправка
// формы тоже идёт через click по кнопке) отправляет форму, onSubmit показывает ошибку.
// Нажатие при открытом календаре с выбранной полной датой — подтверждение даты. Нужен pointerdown: он раньше,
// чем календарь закроется нажатием вне него (слушатель на document) и откатит выбор; click затем отправляет форму.
// Только основная кнопка (левая кнопка мыши, касание, перо): правый клик дату не подтверждает
const onSubmitPointerdown = (event: PointerEvent) => {
  if (event.button === 0) dateField.value?.confirm()
}

const submitClass = computed(() => isReady.value
  ? [pressClass, accentFillFeedbackClass, 'bg-accent text-surface']
  : disabledFillClass)

const formPanelId = 'calculator-form-fields'
const tabsIdPrefix = 'calculator-mode'
</script>

<template>
  <section
    class="rounded-3xl border border-line bg-surface px-5 py-6 lg:rounded-block lg:p-11"
    data-testid="calculator-form"
  >
    <StickerBadge>{{ texts.form.badge }}</StickerBadge>
    <h1 class="mt-4.5 font-display text-title-sm font-bold tracking-heading text-ink lg:mt-7.5 lg:text-title">
      {{ texts.form.title }}
    </h1>
    <p class="hidden leading-6.25 text-ink-muted lg:mt-7.25 lg:block">
      {{ texts.form.description }}
    </p>

    <form
      class="mt-4.5 lg:mt-6.75"
      novalidate
      data-testid="calculator-form-element"
      @submit.prevent="onSubmit"
    >
      <FormTabs
        v-model="mode"
        :tabs="tabs"
        :id-prefix="tabsIdPrefix"
        :controls="formPanelId"
      />
      <div
        :id="formPanelId"
        role="tabpanel"
        :aria-labelledby="formTabId(tabsIdPrefix, mode)"
      >
        <TextField
          id="calculator-name"
          v-model="name"
          class="mt-4 lg:mt-6.5"
          :label="texts.form.nameLabel"
          :placeholder="texts.form.namePlaceholder"
          :maxlength="NAME_MAX_LENGTH"
          type="text"
          autocomplete="given-name"
          data-testid="calculator-name"
        />
        <DateField
          id="calculator-birth-date"
          ref="dateField"
          v-model="birthDate"
          class="mt-4"
          :label="texts.form.birthDateLabel"
          :error="dateError"
          data-testid="calculator-birth-date"
          @leave="onDateLeave"
        />
        <button
          type="submit"
          class="mt-4.5 h-13 w-full rounded-field text-base font-semibold lg:mt-6.5 lg:h-14 lg:text-field"
          :class="[interactiveClass, outerFocusClass, submitClass]"
          :aria-disabled="!isReady || undefined"
          data-testid="calculator-submit"
          @pointerdown="onSubmitPointerdown"
        >
          {{ texts.form.submit }}
        </button>
      </div>
    </form>
  </section>
</template>
