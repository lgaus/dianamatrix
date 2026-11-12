<script setup lang="ts">
import { texts } from '~/content/texts'
import { accentFillFeedbackClass, interactiveClass, outerFocusClass, pressClass } from '~/config/feedback'

// Блок «Личный разбор»: арка-фото (пока заглушка), надзаголовок, заголовок, строка о Диане, кнопка записи и цена.
// Кнопка открывает окно контактов (ContactDialog), фокус после закрытия возвращается на неё.
const { open: openContactDialog } = useContactDialog()
</script>

<template>
  <!-- Ниже xs (480 px) — телефонный вид: всё в столбик, содержимое по центру и не шире 420 px.
       С xs — вид компьютера: фото слева, текст справа по центру фото; до lg — уменьшенный (меньше поля и фото).
       Вариант текста для другой ширины — display: none, поэтому экранный диктор читает только видимый -->
  <section
    class="rounded-3xl border border-line bg-surface p-6 md:p-8 lg:rounded-block lg:p-12"
    data-testid="consultation-block"
  >
    <!-- С xs: сетка 2 колонки; строки 1fr сверху и снизу центрируют текст по высоте фото -->
    <div class="grid max-xs:mx-auto max-xs:max-w-105 xs:grid-cols-[2fr_3fr] xs:grid-rows-[1fr_auto_auto_auto_auto_1fr] xs:gap-x-6 md:grid-cols-[auto_1fr] md:gap-x-10 lg:gap-x-14">
      <!-- Надзаголовок: на телефоне — над фото, с xs — над заголовком -->
      <p class="text-caption-sm font-semibold tracking-label text-accent uppercase xs:col-start-2 xs:row-start-2">
        {{ texts.consultation.label }}
      </p>
      <!-- Заглушка фото: верх — полукруг, низ — скругление. Пропорции 340:420 на всех ширинах; размер задаёт ширина,
           её предел — предел высоты: телефон не выше 257 px (208 px шириной), с xs — не выше 296 px (240 px). По центру столбца -->
      <div
        class="mt-3 aspect-[340/420] w-full max-w-52 justify-self-center rounded-t-photo rounded-b-card bg-photo-placeholder xs:col-start-1 xs:row-span-full xs:mt-0 xs:max-w-60 xs:self-center md:w-60 lg:rounded-b-3xl"
        aria-hidden="true"
        data-testid="consultation-photo"
      />
      <h2 class="mt-4 font-display text-title-xs font-bold tracking-heading wrap-break-word text-ink xs:col-start-2 xs:row-start-3 xs:mt-3 xs:text-xl">
        <span
          class="xs:hidden"
          data-testid="consultation-title-short"
        >
          {{ texts.consultation.titleMobile }}
        </span>
        <span
          class="max-xs:hidden"
          data-testid="consultation-title-full"
        >
          {{ texts.consultation.title }}
        </span>
      </h2>
      <p class="mt-2 text-base text-ink-muted xs:col-start-2 xs:row-start-4 xs:text-cell">
        {{ texts.consultation.description }}
      </p>
      <!-- Кнопка и цена в строку; если не помещаются (крупный шрифт) — цена переносится под кнопку -->
      <div class="mt-4 flex flex-wrap items-center gap-x-4.5 gap-y-2 xs:col-start-2 xs:row-start-5 xs:mt-5">
        <button
          type="button"
          class="min-h-13 rounded-field bg-accent px-6 py-2 text-base font-semibold text-surface max-xs:w-full xs:min-h-12"
          :class="[interactiveClass, outerFocusClass, pressClass, accentFillFeedbackClass]"
          data-testid="consultation-cta"
          @click="openContactDialog($event.currentTarget)"
        >
          {{ texts.consultation.cta }}
        </button>
        <span
          class="text-base text-ink-muted max-xs:hidden"
          data-testid="consultation-price"
        >
          {{ texts.consultation.priceNote }}
        </span>
      </div>
    </div>
  </section>
</template>
