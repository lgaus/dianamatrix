<template>
  <!-- Главная: только компоновка блоков. Телефон — одна колонка, компьютер (с lg) — сетка как в макете -->
  <main class="lg:pt-6">
    <div class="flex flex-col gap-4 lg:gap-8">
      <!-- Ряд 1: форма | матрица (460:660, одинаковая высота) -->
      <div class="grid gap-4 lg:grid-cols-[460fr_660fr] lg:gap-8">
        <CalculatorForm />
        <MatrixChart />
      </div>
      <!-- Ряд 2: карта здоровья | предназначение (прижато к верху) -->
      <div class="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <HealthMapCard />
        <PurposeCard />
      </div>
    </div>
    <ConsultationBlock class="mt-8 lg:mt-16" />
  </main>
</template>
