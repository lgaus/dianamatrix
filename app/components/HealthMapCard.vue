<script setup lang="ts">
// Карточка «Карта здоровья»: шапка (номер, заголовок, подзаголовок) и таблица 7 чакр × физика, энергия, эмоции + «Итого».
// Без health — «–» во всех ячейках с числами; высота строк та же, карточка не прыгает.
// С phablet (550 px) — вид компьютера: зона под названием чакры, текст 15 px, отступы 28 px, таблица на всю ширину, числа у правого края; ниже — телефон без зон.
import type { HealthMap, HealthRow } from '~/utils/matrix/types'
import { texts } from '~/content/texts'
import { chakras } from '~/config/chakras'

defineProps<{
  health?: HealthMap
}>()

const columns: ReadonlyArray<keyof HealthRow> = ['physics', 'energy', 'emotions']

// Кольцо-маркер чакры: внешний диаметр 14, толщина 3 (обводка по середине контура — радиус меньше на половину толщины)
const MARKER_SIZE = 14
const MARKER_STROKE = 3
</script>

<template>
  <section
    class="min-w-0 rounded-card border border-line bg-surface p-4 pt-5.5 phablet:p-7 phablet:pt-7.5"
    data-testid="health-map-card"
  >
    <div class="flex items-center gap-3.5">
      <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-semibold text-ink">
        {{ texts.healthMap.number }}
      </span>
      <div>
        <h2 class="font-display text-xl font-bold tracking-heading text-ink">
          {{ texts.healthMap.title }}
        </h2>
        <p class="mt-0.5 text-sm text-ink-muted">
          {{ texts.healthMap.subtitle }}
        </p>
      </div>
    </div>

    <!-- При крупном шрифте таблица шире карточки — прокручивается внутри обёртки, страница нет -->
    <div class="mt-5 overflow-x-auto">
      <!-- max-phablet:min-w-71 (только телефонный вид): ширина таблицы, при которой столбцы с числами ещё ~52 px; уже — заголовки слипаются, поэтому прокрутка внутри обёртки -->
      <table class="w-full text-sm leading-normal text-ink max-phablet:min-w-71 phablet:text-cell">
        <caption class="sr-only">
          {{ texts.healthMap.title }}
        </caption>
        <thead class="text-xs text-ink-muted">
          <tr>
            <th
              scope="col"
              class="pb-2.5 pl-1.5 text-left font-medium phablet:pb-3"
            >
              {{ texts.healthMap.columns.chakra }}
            </th>
            <th
              v-for="column in columns"
              :key="column"
              scope="col"
              class="w-15.25 pb-2.5 font-medium phablet:w-16.5 phablet:pb-3"
            >
              {{ texts.healthMap.columns[column] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="chakra in chakras"
            :key="chakra.id"
            :data-chakra="chakra.id"
          >
            <th
              scope="row"
              class="py-2.75 pl-2 text-left font-medium phablet:py-3 phablet:pl-3.5"
            >
              <span class="flex items-center gap-2.5">
                <svg
                  :width="MARKER_SIZE"
                  :height="MARKER_SIZE"
                  class="shrink-0"
                  aria-hidden="true"
                >
                  <circle
                    :cx="MARKER_SIZE / 2"
                    :cy="MARKER_SIZE / 2"
                    :r="(MARKER_SIZE - MARKER_STROKE) / 2"
                    :stroke-width="MARKER_STROKE"
                    class="fill-none"
                    :class="chakra.ringClass"
                  />
                </svg>
                <span>
                  {{ texts.healthMap.chakras[chakra.id].name }}
                  <span class="hidden text-caption-sm font-normal text-ink-muted phablet:block">
                    {{ texts.healthMap.chakras[chakra.id].zone }}
                  </span>
                </span>
              </span>
            </th>
            <td
              v-for="column in columns"
              :key="column"
              class="text-center font-medium"
            >
              {{ health?.[chakra.id][column] ?? texts.matrix.emptyValue }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t border-line">
            <th
              scope="row"
              class="pt-3 pb-4.5 pl-2 text-left font-semibold phablet:pb-3.5 phablet:pl-3.5"
            >
              {{ texts.healthMap.total }}
            </th>
            <td
              v-for="column in columns"
              :key="column"
              class="pt-3 pb-4.5 text-center font-bold text-accent phablet:pb-3.5"
            >
              {{ health?.total[column] ?? texts.matrix.emptyValue }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>
