<template>
  <!-- Общий каркас (фон страницы — у html, см. main.css): шапка на всю ширину (закреплена сверху), содержимое — в контейнере -->
  <div class="font-sans text-ink">
    <NuxtRouteAnnouncer />
    <AppHeader />
    <!-- Контейнер: до 1152 px по центру; поля: телефон 16, компьютер 64 -->
    <div class="px-4 pb-8 lg:px-16 lg:pb-24">
      <div class="mx-auto max-w-6xl">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
