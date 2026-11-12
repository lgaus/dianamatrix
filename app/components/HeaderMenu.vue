<script setup lang="ts">
import { texts } from '~/content/texts'
import {
  accentTextFeedbackClass,
  innerFocusClass,
  interactiveClass,
  outerFocusClass,
  pressClass,
  tintBorderFeedbackClass,
  tintFeedbackClass,
  tintPressedClass,
} from '~/config/feedback'

// Бургер и выпадающее меню шапки (телефон, только главная).
// Открытием управляет родитель (v-model:open): шапка не прячется при открытом меню и закрывает его при переходе.
const isOpen = defineModel<boolean>('open', { required: true })

const menuId = 'app-header-menu'

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

// Кнопка записи в меню: меню закрывается, открывается окно контактов. Кнопка записи после этого скрыта
// вместе с меню, поэтому после закрытия окна фокус возвращается на бургер
const burgerButton = useTemplateRef<HTMLButtonElement>('burgerButton')
const { open: openContactDialog } = useContactDialog()
const openContacts = () => {
  close()
  openContactDialog(burgerButton.value)
}

// Анимация панели: проявление + небольшой сдвиг сверху от кнопки (origin — правый верх), 150 мс в обе стороны.
// При исчезновении панель не принимает нажатия (pointer-events-none), чтобы клик не попал в уходящее меню.
// duration-0 при reduced motion нужен Transition: он ждёт конца перехода по transition-duration, и без него
// невидимая панель ещё 150 мс оставалась бы в разметке
const transition = {
  enterActiveClass: 'transition duration-150 ease-out motion-reduce:transition-none motion-reduce:duration-0',
  enterFromClass: 'opacity-0 -translate-y-1 scale-95',
  leaveActiveClass: 'pointer-events-none transition duration-150 ease-in motion-reduce:transition-none motion-reduce:duration-0',
  leaveToClass: 'opacity-0 -translate-y-1 scale-95',
}
</script>

<template>
  <!-- Панель — под кнопкой с зазором, по её правому краю -->
  <div class="relative">
    <!-- Открытое меню: иконка «×», кнопка в состоянии «нажата» (подкрашенный фон, затемнённая рамка) -->
    <button
      ref="burgerButton"
      type="button"
      class="flex size-11 items-center justify-center rounded-xl border text-ink"
      :class="[
        interactiveClass,
        outerFocusClass,
        pressClass,
        tintFeedbackClass,
        tintBorderFeedbackClass,
        isOpen ? tintPressedClass : 'border-line bg-surface',
      ]"
      :aria-label="texts.header.menuLabel"
      :aria-expanded="isOpen"
      :aria-controls="menuId"
      data-testid="header-menu-button"
      @click="toggle"
    >
      <svg
        class="size-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        aria-hidden="true"
        :data-icon="isOpen ? 'close' : 'menu'"
        data-testid="header-menu-icon"
      >
        <path
          v-if="isOpen"
          d="M3 3l10 10M13 3L3 13"
        />
        <path
          v-else
          d="M1 4h14M1 8h14M1 12h14"
        />
      </svg>
    </button>

    <!-- Выпадающее меню (доводка поведения — шаг 12) -->
    <Transition v-bind="transition">
      <nav
        v-show="isOpen"
        :id="menuId"
        class="absolute top-full right-0 z-10 mt-2 flex w-max origin-top-right flex-col rounded-card border border-line bg-surface p-2 shadow-menu"
        data-testid="header-menu"
      >
        <NuxtLink
          to="/about"
          class="rounded-xl px-4 py-3 text-nav font-medium text-ink"
          :class="[interactiveClass, innerFocusClass, tintFeedbackClass]"
          @click="close"
        >
          {{ texts.header.nav.about }}
        </NuxtLink>
        <button
          type="button"
          class="rounded-xl px-4 py-3 text-left text-nav font-medium text-accent"
          :class="[interactiveClass, innerFocusClass, pressClass, tintFeedbackClass, accentTextFeedbackClass]"
          data-testid="header-menu-cta"
          @click="openContacts"
        >
          {{ texts.header.cta }}
        </button>
      </nav>
    </Transition>
  </div>
</template>
