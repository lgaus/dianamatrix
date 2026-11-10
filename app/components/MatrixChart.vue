<script setup lang="ts">
// Заглушка схемы матрицы: только оболочка блока (фон ауры, без рамки). Содержимое — шаг 7.
</script>

<template>
  <!-- min-h — временно, уберётся на шагах 6–10 (высота из макета: телефон 402, компьютер 694) -->
  <section
    class="min-h-100.5 rounded-3xl bg-aura-base lg:min-h-173.5 lg:rounded-block"
    data-testid="matrix-chart"
  />
</template>
