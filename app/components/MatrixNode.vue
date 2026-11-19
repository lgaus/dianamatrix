<script lang="ts">
// Тип и размеры круга вынесены из <script setup>: MatrixChart расставляет узлы по их радиусам
export type MatrixNodeKind = 'outer' | 'corner' | 'middle' | 'inner' | 'small'

// Тонкое кольцо цвета линий: углы квадрата и узлы без чакры (C2, D2, M, MC, MD, EC1, EC2, диагональные X1, X2)
const NEUTRAL_STROKE = 1.5

// Размеры в единицах viewBox (масштабируются вместе со схемой):
// diameter — внешний диаметр круга с кольцом, stroke — толщина кольца чакры, fontSize — размер числа.
// Ярусы: главные пять (E, A–D) → углы F–I → вторые точки троечек X2 → третьи точки троечек X1
export const NODE_SIZES: Record<MatrixNodeKind, { diameter: number, stroke: number, fontSize: number }> = {
  outer: { diameter: 70, stroke: 4, fontSize: 26 }, // главные пять: центр E и A, B, C, D — одного размера
  corner: { diameter: 58, stroke: NEUTRAL_STROKE, fontSize: 22 }, // F, G, H, I: крупнее X2, мельче главных
  middle: { diameter: 50, stroke: 3, fontSize: 20 }, // вторые точки троечек: A2, B2, C2, D2, F2, G2, H2, I2
  inner: { diameter: 30, stroke: 2, fontSize: 14 }, // третьи точки троечек A1, B1, C1, D1, F1, G1, H1, I1 и зелёные A3, B3
  small: { diameter: 30, stroke: NEUTRAL_STROKE, fontSize: 14 }, // M, MC, MD на пунктире C1–D1 и EC1, EC2 (код внутренней силы) между E и C1
}
</script>

<script setup lang="ts">
// Один круг схемы матрицы: белый круг с цветным кольцом и числом в центре. Рисуется внутри <svg> MatrixChart.
import type { ArcanaNumber } from '~/utils/matrix/types'
import { texts } from '~/content/texts'

const props = defineProps<{
  // Число аркана; нет — до расчёта, вместо числа «–»
  value?: ArcanaNumber
  // Центр круга в единицах viewBox схемы
  cx: number
  cy: number
  kind: MatrixNodeKind
  // Класс цвета кольца из chakras.ts; нет — тонкое кольцо цвета линий (углы квадрата, C2, D2, M, MC, MD, EC1, EC2, диагональные X1, X2)
  ringClass?: string
}>()

// dominant-baseline="central" ставит цифры Nunito чуть выше центра круга (до 1 px у E); сдвиг вниз в долях шрифта
const DIGIT_SHIFT = '0.04em'

// Кольцо чакры — толщина из NODE_SIZES; без чакры и у углов квадрата — тонкое кольцо цвета линий, внешний диаметр тот же
const size = computed(() => {
  const base = NODE_SIZES[props.kind]
  return props.kind === 'corner' || !props.ringClass ? { ...base, stroke: NEUTRAL_STROKE } : base
})
// Обводка рисуется по середине контура, поэтому радиус контура меньше внешнего на половину толщины кольца
const radius = computed(() => size.value.diameter / 2 - size.value.stroke / 2)
// Углы квадрата всегда с тонким кольцом цвета линий; остальные — кольцо чакры, а без неё — тоже цвета линий
const ring = computed(() => (props.kind === 'corner' ? 'stroke-matrix-line' : (props.ringClass ?? 'stroke-matrix-line')))
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
    <!-- Все числа — среднего начертания -->
    <text
      :x="cx"
      :y="cy"
      :dy="DIGIT_SHIFT"
      :font-size="size.fontSize"
      text-anchor="middle"
      dominant-baseline="central"
      class="fill-ink font-medium"
    >{{ value ?? texts.matrix.emptyValue }}</text>
  </g>
</template>
