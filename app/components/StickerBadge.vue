<script setup lang="ts">
// Наклейка над заголовком формы: жёлтая пилюля со звездой, слегка наклонена. Текст — в слоте.
</script>

<template>
  <!-- w-fit: пилюля по ширине текста; наклон не меняет место в потоке -->
  <span
    class="flex h-7.25 w-fit -rotate-3 items-center gap-2 rounded-full bg-cream px-3.5 text-badge-sm font-semibold whitespace-nowrap text-ink lg:h-8.5 lg:gap-2.25 lg:px-4 lg:text-sm"
    data-testid="sticker-badge"
  >
    <!-- Четырёхлучевая звезда -->
    <svg
      class="size-2.5 shrink-0 lg:size-3"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z" />
    </svg>
    <slot />
  </span>
</template>
