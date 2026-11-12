<script setup lang="ts">
import { texts } from '~/content/texts'
import { contacts } from '~/config/contacts'
import { innerFocusClass, interactiveClass, outerFocusClass, pressClass, tintFeedbackClass } from '~/config/feedback'

// Окно контактов (одно на сайт, в app.vue). Нативный <dialog> через showModal(): верхний слой над шапкой,
// фокус не выходит из окна, страница под ним неактивна, Esc и «назад» на Android закрывают его сами (событие close).
const { isOpen, returnFocusTarget, close } = useContactDialog()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = 'contact-dialog-title'
const introId = useId()

watch(isOpen, (open) => {
  const element = dialog.value
  if (!element) return
  if (open && !element.open) element.showModal()
  else if (!open && element.open) element.close()
})

// Любое закрытие (×, Esc, «назад», нажатие вне окна): синхронизировать состояние и вернуть фокус на кнопку,
// которой открыли. Своё возвращение, а не встроенное: из меню бургера кнопка записи к этому моменту скрыта,
// а Safari не ставит фокус на кнопку при нажатии и встроенное возвращение отправило бы фокус в начало страницы
const onClose = () => {
  isOpen.value = false
  const target = returnFocusTarget.value
  returnFocusTarget.value = null
  if (target instanceof HTMLElement) target.focus({ preventScroll: true })
}

// Нажатие вне окна (на затемнение): цель события — сам <dialog>, всё содержимое — во внутренней обёртке.
// Нажатие должно и начаться на затемнении: иначе выделение текста, отпущенное за окном, закрыло бы его
let isBackdropPress = false
const onPointerdown = (event: PointerEvent) => {
  isBackdropPress = event.target === event.currentTarget
}
const onClick = (event: MouseEvent) => {
  if (isBackdropPress && event.target === event.currentTarget) close()
  isBackdropPress = false
}
</script>

<template>
  <!-- По центру экрана с полями 16 px (стили браузера для dialog сбрасывает preflight, поэтому m-auto);
       выше экрана — прокрутка внутри окна.
       Появление и исчезновение — 150 мс: проявление + небольшое увеличение, затемнение проявляется отдельно
       (starting: — начальное состояние при открытии; overlay и display — чтобы окно не пропадало до конца анимации) -->
  <dialog
    ref="dialog"
    class="m-auto max-h-[calc(100%-(--spacing(8)))] w-[calc(100%-(--spacing(8)))] max-w-sm scale-95 overflow-y-auto overscroll-contain rounded-card border border-line bg-surface text-ink opacity-0 shadow-menu transition-[opacity,scale,overlay,display] transition-discrete duration-150 ease-out backdrop:bg-ink/backdrop backdrop:opacity-0 backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-150 backdrop:ease-out open:scale-100 open:opacity-100 open:backdrop:opacity-100 starting:open:scale-95 starting:open:opacity-0 starting:open:backdrop:opacity-0 motion-reduce:transition-none motion-reduce:backdrop:transition-none"
    :aria-labelledby="titleId"
    :aria-describedby="introId"
    data-testid="contact-dialog"
    @close="onClose"
    @pointerdown="onPointerdown"
    @click="onClick"
  >
    <div class="p-6">
      <div class="flex items-center justify-between gap-4">
        <h2
          :id="titleId"
          class="min-w-0 font-display text-xl font-bold tracking-heading wrap-break-word text-ink"
        >
          {{ texts.contacts.title }}
        </h2>
        <!-- «×» — та же иконка, что у открытого бургера -->
        <button
          type="button"
          class="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-ink"
          :class="[interactiveClass, outerFocusClass, pressClass, tintFeedbackClass]"
          :aria-label="texts.contacts.closeLabel"
          data-testid="contact-dialog-close"
          @click="close"
        >
          <svg
            class="size-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>
      <p
        :id="introId"
        class="mt-1 text-sm text-ink-muted"
      >
        {{ texts.contacts.intro }}
      </p>

      <!-- Строки как в меню бургера; значок мессенджера — по краю текста заголовка.
           Ссылки — в новой вкладке, окно остаётся открытым -->
      <ul class="-mx-3 mt-4 flex flex-col">
        <li
          v-for="contact in contacts"
          :key="contact.id"
        >
          <a
            :href="contact.href(texts.contacts.message)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-ink"
            :class="[interactiveClass, innerFocusClass, tintFeedbackClass]"
            :data-contact="contact.id"
            data-testid="contact-link"
          >
            <!-- Одноцветные значки мессенджеров (упрощённые, нарисованы вручную) -->
            <svg
              class="size-6 shrink-0 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <template v-if="contact.id === 'telegram'">
                <path d="M21.5 3.5 2.5 11 9 13.5l8.5 7 4-17Z" />
                <path d="M9 13.5 21.5 3.5M9 13.5V19l3-3.2" />
              </template>
              <template v-else-if="contact.id === 'whatsapp'">
                <path d="M7.9 19.4A8.5 8.5 0 1 0 4.6 16.1L3.5 20.5Z" />
                <path d="M9 8.6c0 3.6 2.8 6.4 6.4 6.4l.9-1.6-2.1-1.1-1 .9a4.4 4.4 0 0 1-2.4-2.4l.9-1-1.1-2.1Z" />
              </template>
              <template v-else-if="contact.id === 'vk'">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <path d="M7 8.5c.3 4.5 2.4 7 5.6 7v-7M12.6 12c1.6 0 3-1.5 3.5-3.5M12.6 12c1.6 0 3.2 1.5 3.9 3.5" />
              </template>
              <template v-else>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17" cy="7" r=".5" fill="currentColor" />
              </template>
            </svg>
            <span class="min-w-0 wrap-break-word">
              <span class="block text-nav font-medium">{{ texts.contacts.names[contact.id] }}</span>
              <span class="block text-sm text-ink-muted">{{ contact.handle }}</span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  </dialog>
</template>
