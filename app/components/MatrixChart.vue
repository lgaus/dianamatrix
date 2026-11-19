<script lang="ts">
// id корня схемы: по нему useMatrix прокручивает страницу к схеме после расчёта
export const MATRIX_CHART_ID = 'matrix-chart'
</script>

<script setup lang="ts">
// Схема матрицы судьбы: звезда из 32 кругов на ауре с зерном и подпись под ней.
// Без points — «–» во всех кругах; подпись — только при birthDate (место под неё зарезервировано).
import type { BirthDate, MatrixPoints, PointKey } from '~/utils/matrix/types'
import { NODE_SIZES, type MatrixNodeKind } from './MatrixNode.vue'
import { texts } from '~/content/texts'
import { chakras } from '~/config/chakras'
import { formatBirthDate } from '~/utils/date/birthDate'

const props = defineProps<{
  points?: MatrixPoints
  birthDate?: BirthDate
  // Имя из формы; пустое — подпись по умолчанию из texts.ts
  name?: string
}>()

// Внешний радиус круга данного вида
const nodeRadius = (kind: MatrixNodeKind): number => NODE_SIZES[kind].diameter / 2

// Геометрия звезды в единицах viewBox (на компьютере 1 единица = 1 px)
const HALF_SIDE = 180 // полусторона квадрата F-G-H-I; на его сторонах лежат A2, B2, C2, D2
const CORNER_DISTANCE = HALF_SIDE * Math.SQRT2 // от центра E до углов F, G, H, I
// Зазор между краями соседних кругов троечки (X → X2 → X1), одинаковый на всех 8 лучах
const TRIPLET_GAP = 1.2
// Расстояние от E до центра узла, вплотную (с зазором gap) придвинутого к узлу from со стороны центра
const inward = (from: number, fromKind: MatrixNodeKind, kind: MatrixNodeKind, gap = TRIPLET_GAP): number =>
  from - nodeRadius(fromKind) - gap - nodeRadius(kind)
// То же, но узел ставится со стороны от центра E наружу
const outward = (from: number, fromKind: MatrixNodeKind, kind: MatrixNodeKind, gap = TRIPLET_GAP): number =>
  from + nodeRadius(fromKind) + gap + nodeRadius(kind)
// От центра E до центров A, B, C, D: X2 стоит на стороне квадрата, внешняя точка — снаружи от него с зазором троечки
const RADIUS = HALF_SIDE + nodeRadius('middle') + TRIPLET_GAP + nodeRadius('outer')
// Зазор между краями зелёных A3, B3 и их X1: заметно больше зазора троечки, но так, чтобы до E оставалось ещё больше места
const ANAHATA_GAP = 30
// Расстояния от центра E до точек на лучах A→E, B→E, C→E и D→E
const RAY_X1 = inward(HALF_SIDE, 'middle', 'inner')
const RAY_OFFSETS = {
  2: HALF_SIDE,
  1: RAY_X1,
  3: inward(RAY_X1, 'inner', 'inner', ANAHATA_GAP),
} as const
// Расстояния от центра E до узлов X2 и X1 на диагоналях F, G, H, I: троечка угол → X2 → X1 с тем же зазором
const DIAGONAL_X2 = inward(CORNER_DISTANCE, 'corner', 'middle')
const DIAGONAL_OFFSETS = { 2: DIAGONAL_X2, 1: inward(DIAGONAL_X2, 'middle', 'inner') } as const
// Код внутренней силы E – EC1 – EC2 на горизонтали между E и C1: EC1 — в INNER_FORCE_CENTER_GAP от края E,
// EC2 — в зазоре троечки от EC1; оставшееся место — между EC2 и C1
// Зазор от края E до EC1
const INNER_FORCE_CENTER_GAP = 4
const INNER_FORCE_EC1 = outward(0, 'outer', 'small', INNER_FORCE_CENTER_GAP)
const INNER_FORCE_OFFSETS = { EC1: INNER_FORCE_EC1, EC2: outward(INNER_FORCE_EC1, 'small', 'small') } as const
const OUTER_NODE_RADIUS = nodeRadius('outer') // поле вокруг A, B, C, D, чтобы они не обрезались
const SIZE = 2 * (RADIUS + OUTER_NODE_RADIUS) // сторона viewBox = наибольшая ширина схемы
const MID = SIZE / 2 // центр E
const EDGE_WIDTH = 1.5 // контур ромба и квадрата
const AXIS_WIDTH = 1 // оси и диагонали через центр
const LINE_WIDTH = 1 // пунктирная линия C1–D1
const LINE_DASH = '4 4' // штрих и пробел пунктира, в единицах viewBox
// Доли пути от C1 к D1 (0 — C1, 1 — D1), на которых стоят узлы MC, M, MD; меняй, чтобы сдвинуть узлы по линии
const LINE_FRACTIONS = { MC: 1 / 3, M: 1 / 2, MD: 4 / 6 } as const
// Иконки «деньги» (у C1) и «любовь» (у D1) снаружи пунктира: сторона в единицах viewBox и толщина линии знака «$»
const ICON_SIZE = 24
const MONEY_ICON_STROKE = 2.5
// Сдвиг центра иконки от пунктира наружу по x и по y: середина полосы между пунктиром и контуром ромба C–D
const ICON_OFFSET = (RADIUS - RAY_OFFSETS[1]) / 4
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

// Точка на диагонали от центра E к углу квадрата на расстоянии distance от E
const onDiagonal = (corner: [x: number, y: number], distance: number): [x: number, y: number] => [
  MID + (corner[0] - MID) * distance / CORNER_DISTANCE,
  MID + (corner[1] - MID) * distance / CORNER_DISTANCE,
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
  F1: onDiagonal(CORNERS.F, DIAGONAL_OFFSETS[1]),
  F2: onDiagonal(CORNERS.F, DIAGONAL_OFFSETS[2]),
  G1: onDiagonal(CORNERS.G, DIAGONAL_OFFSETS[1]),
  G2: onDiagonal(CORNERS.G, DIAGONAL_OFFSETS[2]),
  H1: onDiagonal(CORNERS.H, DIAGONAL_OFFSETS[1]),
  H2: onDiagonal(CORNERS.H, DIAGONAL_OFFSETS[2]),
  I1: onDiagonal(CORNERS.I, DIAGONAL_OFFSETS[1]),
  I2: onDiagonal(CORNERS.I, DIAGONAL_OFFSETS[2]),
  EC1: [MID + INNER_FORCE_OFFSETS.EC1, MID],
  EC2: [MID + INNER_FORCE_OFFSETS.EC2, MID],
}

const kinds: Record<PointKey, MatrixNodeKind> = {
  A: 'outer', B: 'outer', C: 'outer', D: 'outer',
  E: 'outer',
  F: 'corner', G: 'corner', H: 'corner', I: 'corner',
  A2: 'middle', B2: 'middle', C2: 'middle', D2: 'middle', F2: 'middle', G2: 'middle', H2: 'middle', I2: 'middle',
  A1: 'inner', B1: 'inner', C1: 'inner', D1: 'inner', F1: 'inner', G1: 'inner', H1: 'inner', I1: 'inner',
  A3: 'inner', B3: 'inner',
  M: 'small', MC: 'small', MD: 'small',
  EC1: 'small', EC2: 'small',
}

// Цвет кольца точки — из чакры, к которой она относится (у F, G, H, I, C2, D2, M, MC, MD, EC1, EC2 и диагональных узлов X1, X2 чакры нет)
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

// Левый верхний угол иконки, центр которой — напротив доли fraction пути C1→D1, в середине полосы снаружи пунктира
const iconCorner = (fraction: number): [x: number, y: number] => {
  const [x, y] = onLine(fraction)
  return [x + ICON_OFFSET - ICON_SIZE / 2, y + ICON_OFFSET - ICON_SIZE / 2]
}
// Деньги — посередине между C1 и MC, любовь — зеркально, посередине между MD и D1
const moneyIcon = iconCorner(LINE_FRACTIONS.MC / 2)
const loveIcon = iconCorner((LINE_FRACTIONS.MD + 1) / 2)

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
      <!-- Декоративные иконки снаружи пунктира: «$» у C1, сердце у D1 -->
      <svg
        :x="moneyIcon[0]"
        :y="moneyIcon[1]"
        :width="ICON_SIZE"
        :height="ICON_SIZE"
        viewBox="0 0 24 24"
        fill="none"
        :stroke-width="MONEY_ICON_STROKE"
        stroke-linecap="round"
        class="stroke-matrix-line"
        aria-hidden="true"
        data-testid="matrix-icon-money"
      >
        <path d="M16.5 7.5c-.6-1.5-2.3-2.5-4.5-2.5-2.5 0-4.5 1.4-4.5 3.4 0 4.6 9 2.6 9 7.2 0 2-2 3.4-4.5 3.4-2.2 0-3.9-1-4.5-2.5M12 2.5v19" />
      </svg>
      <svg
        :x="loveIcon[0]"
        :y="loveIcon[1]"
        :width="ICON_SIZE"
        :height="ICON_SIZE"
        viewBox="0 0 24 24"
        class="fill-matrix-line"
        aria-hidden="true"
        data-testid="matrix-icon-love"
      >
        <path d="M12 19.7 4.2 12a4.8 4.8 0 0 1 7.8-5.6 4.8 4.8 0 0 1 7.8 5.6Z" />
      </svg>
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
