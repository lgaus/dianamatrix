<template>
  <!-- Главная: только компоновка блоков. Телефон — одна колонка, компьютер (с lg) — сетка как в макете.
       Промежутки между всеми блоками по вертикали одинаковые: телефон 16, компьютер 32 -->
  <main class="flex flex-col gap-4 lg:gap-8 lg:pt-6">
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
    <ConsultationBlock />
  </main>
</template>
