<script lang="ts">
// id корня схемы: по нему useMatrix прокручивает страницу к схеме после расчёта
export const MATRIX_CHART_ID = 'matrix-chart'
</script>

<script setup lang="ts">
// Схема матрицы судьбы: звезда из 30 кругов на ауре с зерном и подпись под ней.
// Без points — «–» во всех кругах; подпись — только при birthDate (место под неё зарезервировано).
import type { BirthDate, MatrixPoints, PointKey } from '~/utils/matrix/types'
import type { MatrixNodeKind } from './MatrixNode.vue'
import { texts } from '~/content/texts'
import { chakras } from '~/config/chakras'
import { formatBirthDate } from '~/utils/date/birthDate'

const props = defineProps<{
  points?: MatrixPoints
  birthDate?: BirthDate
  // Имя из формы; пустое — подпись по умолчанию из texts.ts
  name?: string
}>()

// Геометрия звезды в единицах viewBox (на компьютере 1 единица = 1 px; звезда на ~10 % крупнее макета, чтобы поместились A3 и B3)
const RADIUS = 234 // от центра E до центров A, B, C, D
const HALF_SIDE = 176.5 // полусторона квадрата F-G-H-I; на его сторонах лежат A2, B2, C2, D2
// Расстояния от центра E до точек на лучах A→E, B→E, C→E и D→E
const RAY_OFFSETS = { 3: 69.5, 1: 123, 2: HALF_SIDE } as const
const OUTER_NODE_RADIUS = 31 // внешний радиус кругов A, B, C, D: поле, чтобы они не обрезались
const SIZE = 2 * (RADIUS + OUTER_NODE_RADIUS) // сторона viewBox = наибольшая ширина схемы, 530
const MID = SIZE / 2 // центр E
const EDGE_WIDTH = 1.5 // контур ромба и квадрата
const AXIS_WIDTH = 1 // оси и диагонали через центр
const LINE_WIDTH = 1 // пунктирная линия C1–D1
const LINE_DASH = '4 4' // штрих и пробел пунктира, в единицах viewBox
// Доли пути от C1 к D1 (0 — C1, 1 — D1), на которых стоят узлы MC, M, MD; меняй, чтобы сдвинуть узлы по линии
const LINE_FRACTIONS = { MC: 1 / 4, M: 1 / 2, MD: 3 / 4 } as const
// Доли расстояния от центра E до угла квадрата, на которых стоят узлы X1 (ближе к E) и X2 (ближе к углу) на диагоналях F, G, H, I; меняй, чтобы сдвинуть узлы по диагонали
const DIAGONAL_FRACTIONS = { 1: 0.68, 2: 0.83 } as const
// Зерно: частота шума feTurbulence (чем больше, тем мельче зерно) и число слоёв шума
const GRAIN_FREQUENCY = 0.8
const GRAIN_OCTAVES = 3

// Углы квадрата F-G-H-I по часовой от левого верхнего
const CORNERS: Record<'F' | 'G' | 'H' | 'I', [x: number, y: number]> = {
  F: [MID - HALF_SIDE, MID - HALF_SIDE],
  G: [MID + HALF_SIDE, MID - HALF_SIDE],
  H: [MID + HALF_SIDE, MID + HALF_SIDE],
  I: [MID - HALF_SIDE, MID + HALF_SIDE],
}

// Точка на отрезке C1→D1 по доле пути
const onLine = (fraction: number): [x: number, y: number] => [
  MID + RAY_OFFSETS[1] * (1 - fraction),
  MID + RAY_OFFSETS[1] * fraction,
]

// Точка на диагонали от центра E к углу квадрата по доле расстояния
const onDiagonal = (corner: [x: number, y: number], fraction: number): [x: number, y: number] => [
  MID + (corner[0] - MID) * fraction,
  MID + (corner[1] - MID) * fraction,
]

// Координаты точек: A слева, B сверху, C справа, D снизу; F, G, H, I — углы квадрата по часовой от левого верхнего
const positions: Record<PointKey, [x: number, y: number]> = {
  A: [MID - RADIUS, MID],
  B: [MID, MID - RADIUS],
  C: [MID + RADIUS, MID],
  D: [MID, MID + RADIUS],
  E: [MID, MID],
  F: CORNERS.F,
  G: CORNERS.G,
  H: CORNERS.H,
  I: CORNERS.I,
  A1: [MID - RAY_OFFSETS[1], MID],
  A2: [MID - RAY_OFFSETS[2], MID],
  A3: [MID - RAY_OFFSETS[3], MID],
  B1: [MID, MID - RAY_OFFSETS[1]],
  B2: [MID, MID - RAY_OFFSETS[2]],
  B3: [MID, MID - RAY_OFFSETS[3]],
  C1: [MID + RAY_OFFSETS[1], MID],
  C2: [MID + RAY_OFFSETS[2], MID],
  D1: [MID, MID + RAY_OFFSETS[1]],
  D2: [MID, MID + RAY_OFFSETS[2]],
  MC: onLine(LINE_FRACTIONS.MC),
  M: onLine(LINE_FRACTIONS.M),
  MD: onLine(LINE_FRACTIONS.MD),
  F1: onDiagonal(CORNERS.F, DIAGONAL_FRACTIONS[1]),
  F2: onDiagonal(CORNERS.F, DIAGONAL_FRACTIONS[2]),
  G1: onDiagonal(CORNERS.G, DIAGONAL_FRACTIONS[1]),
  G2: onDiagonal(CORNERS.G, DIAGONAL_FRACTIONS[2]),
  H1: onDiagonal(CORNERS.H, DIAGONAL_FRACTIONS[1]),
  H2: onDiagonal(CORNERS.H, DIAGONAL_FRACTIONS[2]),
  I1: onDiagonal(CORNERS.I, DIAGONAL_FRACTIONS[1]),
  I2: onDiagonal(CORNERS.I, DIAGONAL_FRACTIONS[2]),
}

const kinds: Record<PointKey, MatrixNodeKind> = {
  A: 'outer', B: 'outer', C: 'outer', D: 'outer',
  E: 'center',
  F: 'corner', G: 'corner', H: 'corner', I: 'corner', C2: 'corner', D2: 'corner',
  A1: 'middle', A2: 'middle', B1: 'middle', B2: 'middle',
  A3: 'small', B3: 'small', C1: 'small', D1: 'small',
  M: 'small', MC: 'small', MD: 'small',
  F1: 'small', F2: 'small', G1: 'small', G2: 'small', H1: 'small', H2: 'small', I1: 'small', I2: 'small',
}

// Цвет кольца точки — из чакры, к которой она относится (у F, G, H, I, C2, D2, M, MC, MD и диагональных узлов X1, X2 чакры нет; A3, B3, C1, D1 мелкие, но с цветом чакры)
const ringClasses: Partial<Record<PointKey, string>> = Object.fromEntries(
  chakras.flatMap(chakra => chakra.points.map(point => [point, chakra.ringClass])),
)

const nodes = (Object.keys(positions) as PointKey[]).map(key => ({
  key,
  x: positions[key][0],
  y: positions[key][1],
  kind: kinds[key],
  ringClass: ringClasses[key],
}))

const toPoints = (keys: PointKey[]): string => keys.map(key => positions[key].join(',')).join(' ')
// Контуры: ромб A-B-C-D и квадрат F-G-H-I
const outlines = [toPoints(['A', 'B', 'C', 'D']), toPoints(['F', 'G', 'H', 'I'])]
// Оси и диагонали через центр
const axes: Array<[PointKey, PointKey]> = [['A', 'C'], ['B', 'D'], ['F', 'H'], ['G', 'I']]

const caption = computed(() =>
  props.birthDate ? texts.matrix.caption(formatBirthDate(props.birthDate), props.name) : '')

const grainId = useId()
</script>

<template>
  <!--
    Аура: пятна aura-1 (слева сверху, ярче всех), aura-3 (справа сверху), aura-2 (справа снизу) на фоне aura-base.
    Размеры пятен в процентах блока — на телефоне те же пропорции. isolate: зерно смешивается только с аурой
  -->
  <section
    :id="MATRIX_CHART_ID"
    class="relative isolate flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-aura-base bg-[radial-gradient(55%_52%_at_20%_27%,var(--color-aura-1),transparent),radial-gradient(45%_43%_at_82%_19%,var(--color-aura-3),transparent),radial-gradient(48%_46%_at_82%_79%,var(--color-aura-2),transparent)] px-5 pt-6.5 pb-3 lg:rounded-block lg:py-8"
    data-testid="matrix-chart"
  >
    <!-- Зерно поверх ауры, под схемой -->
    <svg
      class="pointer-events-none absolute inset-0 size-full opacity-grain [mix-blend-mode:var(--grain-blend-mode)]"
      aria-hidden="true"
    >
      <filter :id="grainId">
        <feTurbulence
          type="fractalNoise"
          :baseFrequency="GRAIN_FREQUENCY"
          :numOctaves="GRAIN_OCTAVES"
          stitchTiles="stitch"
        />
      </filter>
      <rect
        width="100%"
        height="100%"
        :filter="`url(#${grainId})`"
      />
    </svg>

    <!-- Ширина схемы — ширина блока без отступов, но не больше SIZE; высота по пропорции viewBox -->
    <svg
      :viewBox="`0 0 ${SIZE} ${SIZE}`"
      :width="SIZE"
      :height="SIZE"
      class="relative h-auto max-w-full"
      role="img"
      :aria-label="texts.matrix.chartLabel"
    >
      <polygon
        v-for="outline in outlines"
        :key="outline"
        :points="outline"
        :stroke-width="EDGE_WIDTH"
        class="fill-none stroke-matrix-line/matrix-edge"
      />
      <line
        v-for="[from, to] in axes"
        :key="from + to"
        :x1="positions[from][0]"
        :y1="positions[from][1]"
        :x2="positions[to][0]"
        :y2="positions[to][1]"
        :stroke-width="AXIS_WIDTH"
        class="stroke-matrix-line/matrix-axis"
      />
      <!-- Пунктир C1–D1 рисуется до узлов, поэтому остаётся под ними -->
      <line
        :x1="positions.C1[0]"
        :y1="positions.C1[1]"
        :x2="positions.D1[0]"
        :y2="positions.D1[1]"
        :stroke-width="LINE_WIDTH"
        :stroke-dasharray="LINE_DASH"
        class="stroke-matrix-line/matrix-edge"
        data-testid="matrix-dashed-line"
      />
      <MatrixNode
        v-for="node in nodes"
        :key="node.key"
        :data-point="node.key"
        :cx="node.x"
        :cy="node.y"
        :kind="node.kind"
        :ring-class="node.ringClass"
        :value="points?.[node.key]"
      />
    </svg>

    <!-- Подпись: до расчёта пустая, но строка зарезервирована (min-h-lh), чтобы блок не прыгал -->
    <p class="relative mt-5.5 min-h-lh text-center text-caption-sm wrap-anywhere text-ink-muted sm:mt-9 sm:text-sm">
      {{ caption }}
    </p>
  </section>
</template>
