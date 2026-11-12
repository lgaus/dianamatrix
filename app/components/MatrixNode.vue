<script setup lang="ts">
// Один круг схемы матрицы: белый круг с цветным кольцом и числом в центре. Рисуется внутри <svg> MatrixChart.
import type { ArcanaNumber } from '~/utils/matrix/types'
import { texts } from '~/content/texts'

export type MatrixNodeKind = 'outer' | 'middle' | 'center' | 'corner' | 'small'

const props = defineProps<{
  // Число аркана; нет — до расчёта, вместо числа «–»
  value?: ArcanaNumber
  // Центр круга в единицах viewBox схемы
  cx: number
  cy: number
  kind: MatrixNodeKind
  // Класс цвета кольца из chakras.ts; нет — тонкое кольцо цвета линий (углы квадрата, C2, D2, мелкие узлы без чакры)
  ringClass?: string
}>()

// Размеры из макета в единицах viewBox (масштабируются вместе со схемой):
// diameter — внешний диаметр круга с кольцом, stroke — толщина кольца, fontSize — размер числа
const SIZES: Record<MatrixNodeKind, { diameter: number, stroke: number, fontSize: number }> = {
  outer: { diameter: 62, stroke: 4, fontSize: 24 }, // A, B, C, D
  center: { diameter: 80, stroke: 4, fontSize: 32 }, // E
  middle: { diameter: 48, stroke: 4, fontSize: 18 }, // точки на лучах
  corner: { diameter: 48, stroke: 1.5, fontSize: 20 }, // F, G, H, I, C2, D2
  small: { diameter: 30, stroke: 1.5, fontSize: 14 }, // A3, B3, C1, D1, M, MC, MD, X1, X2: мелкие, чтобы не задевать соседей
}
// Мелкий узел с кольцом чакры (A3, B3, C1, D1): кольцо толще тонкого, чтобы цвет читался; внешний диаметр тот же, число не теснится
const SMALL_COLORED_STROKE = 2.5

// dominant-baseline="central" ставит цифры Nunito чуть выше центра круга (до 1 px у E); сдвиг вниз в долях шрифта
const DIGIT_SHIFT = '0.04em'

// Мелкий узел с цветом чакры — кольцо толще; у остальных толщина из SIZES
const size = computed(() => {
  const base = SIZES[props.kind]
  return props.kind === 'small' && props.ringClass ? { ...base, stroke: SMALL_COLORED_STROKE } : base
})
// Обводка рисуется по середине контура, поэтому радиус контура меньше внешнего на половину толщины кольца
const radius = computed(() => size.value.diameter / 2 - size.value.stroke / 2)
// Углы квадрата всегда с тонким кольцом цвета линий; остальные — кольцо чакры, а без неё (мелкие узлы без чакры) — тоже цвета линий
const ring = computed(() => (props.kind === 'corner' ? 'stroke-matrix-line' : (props.ringClass ?? 'stroke-matrix-line')))
// Крупные круги (внешние и центр) — полужирное число, остальные — среднее
const weight = computed(() => (props.kind === 'outer' || props.kind === 'center' ? 'font-semibold' : 'font-medium'))
</script>

<template>
  <g>
    <circle
      :cx="cx"
      :cy="cy"
      :r="radius"
      :stroke-width="size.stroke"
      class="fill-surface"
      :class="ring"
    />
    <text
      :x="cx"
      :y="cy"
      :dy="DIGIT_SHIFT"
      :font-size="size.fontSize"
      text-anchor="middle"
      dominant-baseline="central"
      class="fill-ink"
      :class="weight"
    >{{ value ?? texts.matrix.emptyValue }}</text>
  </g>
</template>
