<script setup lang="ts">
import { texts } from '~/content/texts'
import {
  accentTextFeedbackClass,
  inkTextFeedbackClass,
  interactiveClass,
  outerFocusClass,
  pressClass,
  tintBorderFeedbackClass,
  tintFeedbackClass,
} from '~/config/feedback'

// Шапка сайта: логотип, навигация (с md) и бургер-меню (ниже md, компонент HeaderMenu).
// Закреплена сверху; на телефоне прячется при прокрутке вниз и появляется при прокрутке вверх.
const route = useRoute()
const NuxtLink = resolveComponent('NuxtLink')

// На /about вместо арки логотипа — стрелка «назад», ссылки «Обо мне» нет,
// бургера нет: кнопка записи видна в шапке на всех ширинах
const isAboutPage = computed(() => route.name === 'about')

// Открытие меню хранится здесь: от него зависит скрытие шапки. Меню закрывается при любом переходе
const isMenuOpen = ref(false)
watch(() => route.fullPath, () => {
  isMenuOpen.value = false
})

// При открытом меню шапка не прячется; после закрытия остаётся видимой до следующей прокрутки вниз
const { isHidden, reveal } = useHideOnScroll()
const isHeaderHidden = computed(() => isHidden.value && !isMenuOpen.value)

watch(isMenuOpen, (isOpen) => {
  if (!isOpen) reveal()
})
</script>

<template>
  <!-- Фон и поля на всю ширину окна, содержимое — в контейнере как у страницы (до 1152 px; поля: телефон 16, компьютер 64).
       Высота: телефон 60 (кнопки 44 + 2×8), с md — 78 (кнопка 46 + 2×16) -->
  <!-- Сдвиг вверх только ниже md: на md+ шапка видна всегда -->
  <header
    class="sticky top-0 z-20 bg-page px-4 transition-transform duration-200 ease-out motion-reduce:transition-none lg:px-16"
    :class="{ 'max-md:-translate-y-full': isHeaderHidden }"
    data-testid="app-header"
    @focusin="reveal"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between py-2 md:py-4">
      <!-- Логотип: арка-заглушка фото (на /about — стрелка «назад» в том же боксе), имя, подпись (с md) -->
      <div class="flex items-center gap-2.5 md:gap-3">
        <!-- На главной логотип — просто название сайта: не ссылка, без фокуса и отклика.
             На /about — ссылка «назад» на главную; доступное имя — скрытый текст «На главную» + текст логотипа.
             Бокс и отступы одинаковые, поэтому при переходе шапка не сдвигается -->
        <component
          :is="isAboutPage ? NuxtLink : 'div'"
          v-bind="isAboutPage ? { to: '/' } : {}"
          class="flex items-center gap-2.5 rounded-md text-ink md:gap-3"
          :class="isAboutPage ? [interactiveClass, outerFocusClass, inkTextFeedbackClass] : []"
          data-testid="header-logo"
        >
          <span
            v-if="isAboutPage"
            class="flex size-9 shrink-0 items-center justify-center md:size-10"
            aria-hidden="true"
            data-testid="header-back-arrow"
          >
            <svg
              class="size-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 10H4M9 5l-5 5 5 5" />
            </svg>
          </span>
          <span
            v-else
            class="size-9 shrink-0 rounded-t-arch rounded-b-md bg-photo-placeholder md:size-10"
            aria-hidden="true"
          />
          <!-- Пробел в конце — часть текста: шаблон срезает пробелы по краям, а без него имя склеится («На главнуюДиана») -->
          <span
            v-if="isAboutPage"
            class="sr-only"
            data-testid="header-back-label"
          >
            {{ `${texts.header.backToHome} ` }}
          </span>
          <span class="font-display text-logo font-bold tracking-heading">
            {{ texts.header.logo }}
          </span>
        </component>
        <span class="hidden items-center gap-1 text-sm text-ink-muted md:flex">
          <!-- Разделитель-точка перед подписью -->
          <span
            class="size-0.5 rounded-full bg-current"
            aria-hidden="true"
          />
          {{ texts.header.tagline }}
        </span>
      </div>

      <!-- Навигация: на главной — с md (ниже — бургер), на /about — на всех ширинах -->
      <nav
        class="items-center gap-8"
        :class="isAboutPage ? 'flex' : 'hidden md:flex'"
      >
        <NuxtLink
          v-if="!isAboutPage"
          to="/about"
          class="rounded-sm text-nav font-medium text-ink"
          :class="[interactiveClass, outerFocusClass, inkTextFeedbackClass]"
          data-testid="header-nav-link"
        >
          {{ texts.header.nav.about }}
        </NuxtLink>
        <!-- Ниже md (только /about) — компактная: высота как у бургера; ниже xs (480 px) — короткий текст.
             Скрытый вариант — display: none, поэтому экранный диктор читает только видимый текст -->
        <!-- TODO: шаг 10 — открывает окно контактов (Telegram, WhatsApp, VK, Instagram) -->
        <button
          type="button"
          class="inline-flex h-11 items-center rounded-full border border-line bg-surface px-4 text-nav font-medium whitespace-nowrap text-accent md:h-11.5 md:px-5"
          :class="[interactiveClass, outerFocusClass, pressClass, tintFeedbackClass, tintBorderFeedbackClass, accentTextFeedbackClass]"
          data-testid="header-cta"
        >
          <span
            class="xs:hidden"
            data-testid="header-cta-short"
          >
            {{ texts.header.ctaShort }}
          </span>
          <span
            class="max-xs:hidden"
            data-testid="header-cta-full"
          >
            {{ texts.header.cta }}
          </span>
        </button>
      </nav>

      <!-- Бургер и его меню: телефон, только на главной -->
      <HeaderMenu
        v-if="!isAboutPage"
        v-model:open="isMenuOpen"
        class="md:hidden"
      />
    </div>
  </header>
</template>
