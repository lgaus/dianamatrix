<script setup lang="ts">
// Шапка карточки результата: кружок с номером, заголовок (h2) и подзаголовок.
// Общая для «Карты здоровья» и «Предназначения».
defineProps<{
  number: string
  title: string
  subtitle: string
}>()
</script>

<template>
  <div class="flex items-center gap-3.5">
    <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-semibold text-ink">
      {{ number }}
    </span>
    <!-- min-w-0 и перенос внутри слова: при крупном шрифте длинное слово заголовка не шире карточки -->
    <div class="min-w-0">
      <h2 class="font-display text-xl font-bold tracking-heading wrap-break-word text-ink">
        {{ title }}
      </h2>
      <p class="mt-0.5 text-sm text-ink-muted">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>
