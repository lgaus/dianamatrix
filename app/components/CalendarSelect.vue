<script setup lang="ts">
import { interactiveClass, outerFocusClass, tintFeedbackClass } from '~/config/feedback'

// Селект календаря (месяц, год). Нативная стрелка убрана (appearance-none): своя стрелка-шеврон — вспомогательная,
// поэтому мельче текста и цвета вторичного текста (ink-muted).
// Отступы симметричные: текст в 9 px от левого края (рамка 1 + pl-2), стрелка — в 9 px от правого (right-2.25:
// обёртка без рамки); шеврон рисуется во всю ширину своей иконки 10 × 6, без внутренних полей.
// Справа у текста место под стрелку: рамка 1 + pr-6.5 = 9 + 10 стрелка + 8 зазор (текст не прижат к стрелке).
// Ширина не меньше самого длинного варианта: select — flex-элемент (min-w-0 flex-1), а не width: 100% —
// у select с процентной шириной нулевой вклад в min-content, и календарь (min-w-min) обрезал бы название.
// Рамка фокуса — только при фокусе с клавиатуры. Chromium считает :focus-visible у select и после нажатия
// мышью или пальцем, поэтому нажатие указателем помечает селект (data-pointer), и рамка скрыта до нажатия клавиши
// или ухода фокуса на другой элемент (blur не вызывается — навигация клавиатурой не ломается).
// Уход фокуса из окна (на телефоне нативный список выбора, переключение приложений) пометку не снимает: после
// возврата фокус снова на селекте, и рамка не должна появиться. Различие — document.hasFocus() во время blur.
// Атрибуты и обработчики (value, aria-label, @change, data-testid) — на <select>, class — на обёртку.
defineOptions({ inheritAttrs: false })

export interface CalendarSelectOption {
  value: number
  label: string
  disabled?: boolean
}

defineProps<{
  options: ReadonlyArray<CalendarSelectOption>
}>()

const isPointerFocus = ref(false)

const onBlur = () => {
  if (document.hasFocus()) isPointerFocus.value = false
}
</script>

<template>
  <div
    class="relative flex"
    :class="$attrs.class"
  >
    <select
      class="h-8 min-w-0 flex-1 cursor-pointer appearance-none rounded-tab border border-line-input bg-surface pr-6.5 pl-2 text-sm font-medium text-ink pointer-coarse:h-10 data-pointer:focus-visible:outline-none"
      :class="[interactiveClass, outerFocusClass, tintFeedbackClass]"
      :data-pointer="isPointerFocus || undefined"
      v-bind="{ ...$attrs, class: undefined }"
      @pointerdown="isPointerFocus = true"
      @keydown="isPointerFocus = false"
      @blur="onBlur"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <svg
      class="pointer-events-none absolute top-1/2 right-2.25 h-1.5 w-2.5 -translate-y-1/2 text-ink-muted"
      viewBox="0 0 10 6"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M1 1l4 4 4-4" />
    </svg>
  </div>
</template>
