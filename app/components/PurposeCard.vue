<script setup lang="ts">
// Карточка «Предназначение»: шапка и 4 ячейки (личное, социальное, духовное, планетарное).
// В ячейке: название (h3) и возраст (если подпись пустая — без возраста), крупное число и формула. Расшифровки аркана нет.
// Без purpose — «–» вместо чисел, в том числе в формулах; высота карточки та же.
// С phablet (550 px) — сетка 2×2, ниже — одна колонка в том же порядке.
import type { Purpose } from '~/utils/matrix/types'
import { texts } from '~/content/texts'

const props = defineProps<{
  purpose?: Purpose
}>()

const value = (key: keyof Purpose) => props.purpose?.[key] ?? texts.matrix.emptyValue

const { formulas } = texts.purpose

// Порядок ячеек и слагаемые формулы каждой
const cells = computed(() => [
  { key: 'personal', formula: formulas.personal(value('sky'), value('earth')) },
  { key: 'social', formula: formulas.social(value('male'), value('female')) },
  { key: 'spiritual', formula: formulas.spiritual(value('personal'), value('social')) },
  { key: 'planetary', formula: formulas.planetary(value('social'), value('spiritual')) },
] as const)
</script>

<template>
  <section
    class="min-w-0 rounded-card border border-line bg-surface p-4 pt-5.5 pb-6 phablet:p-7 phablet:pt-7.5 phablet:pb-8"
    data-testid="purpose-card"
  >
    <CardHeading
      :number="texts.purpose.number"
      :title="texts.purpose.title"
      :subtitle="texts.purpose.subtitle"
    />

    <div class="mt-6 grid gap-y-7.5 phablet:grid-cols-2 phablet:gap-x-7">
      <div
        v-for="cell in cells"
        :key="cell.key"
        :data-cell="cell.key"
      >
        <!-- При нехватке места возраст уходит под название -->
        <div class="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 class="font-display text-cell font-bold tracking-heading text-ink">
            {{ texts.purpose.terms[cell.key] }}
          </h3>
          <span
            v-if="texts.purpose.ages[cell.key]"
            class="text-xs text-ink-muted"
          >
            {{ texts.purpose.ages[cell.key] }}
          </span>
        </div>
        <!-- Формула рядом с числом; длинная переносится на следующую строку рядом с числом -->
        <p class="mt-1.5 flex items-baseline gap-x-2.25">
          <span
            class="shrink-0 font-display text-number text-accent"
            data-testid="purpose-number"
          >
            {{ value(cell.key) }}
          </span>
          <span
            class="min-w-0 text-xs text-ink-muted"
            data-testid="purpose-formula"
          >
            {{ cell.formula }}
          </span>
        </p>
      </div>
    </div>
  </section>
</template>
