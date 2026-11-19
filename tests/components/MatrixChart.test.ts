// Тесты схемы матрицы (шаги 7, 10): 32 круга с числами из calculatePoints, код внутренней силы EC1, EC2 между E и C1 (EC1–EC2 с зазором троечки, E–EC1 шире), «–» и пустая подпись до расчёта,
// цвета колец из chakras.ts, ярусы размеров (E = A–D) и троечки на 8 лучах с одинаковыми зазорами, A3/B3 между A1/B1 и центром, порядок C1, C2, C и D1, D2, D, узлы линии C1–D1 и диагональные узлы, без наложений кругов, подпись с датой и именем, доступное имя схемы.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MatrixChart from '~/components/MatrixChart.vue'
import { chakras } from '~/config/chakras'
import { texts } from '~/content/texts'
import { formatBirthDate } from '~/utils/date/birthDate'
import { calculatePoints } from '~/utils/matrix/formulas'
import type { BirthDate, PointKey } from '~/utils/matrix/types'

// Диагональные узлы: X1 ближе к центру, X2 между углом X и X1
const diagonalKeys: PointKey[] = ['F1', 'F2', 'G1', 'G2', 'H1', 'H2', 'I1', 'I2']
// Код внутренней силы между E и C1: EC1 у E, EC2 дальше
const innerForceKeys: PointKey[] = ['EC1', 'EC2']
const pointKeys: PointKey[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'D1', 'D2', 'M', 'MC', 'MD', ...diagonalKeys, ...innerForceKeys]
// Точки без кольца чакры: углы квадрата, C2, D2, узлы линии C1–D1, диагональные узлы и EC1, EC2
const corners: PointKey[] = ['F', 'G', 'H', 'I', 'C2', 'D2', 'M', 'MC', 'MD', ...diagonalKeys, ...innerForceKeys]

const DATE: BirthDate = { day: 14, month: 7, year: 1992 }
// Эталон из макета и PLAN.md для 14.07.1992
const expected: Record<PointKey, number> = {
  A: 14, B: 7, C: 21, D: 6, E: 12, F: 21, G: 10, H: 9, I: 20,
  A1: 8, A2: 22, A3: 20, B1: 19, B2: 8, B3: 4, C1: 6, C2: 9, D1: 18, D2: 6, M: 6, MC: 12, MD: 6,
  F1: 6, F2: 9, G1: 22, G2: 5, H1: 21, H2: 3, I1: 5, I2: 7,
  EC1: 6, EC2: 18,
}

const node = (wrapper: VueWrapper, key: PointKey) => wrapper.get(`[data-point="${key}"]`)
const value = (wrapper: VueWrapper, key: PointKey) => node(wrapper, key).get('text').text()
const center = (wrapper: VueWrapper, key: PointKey): [number, number] => {
  const circle = node(wrapper, key).get('circle')
  return [Number(circle.attributes('cx')), Number(circle.attributes('cy'))]
}
const distanceFromE = (wrapper: VueWrapper, key: PointKey) => {
  const [x, y] = center(wrapper, key)
  const [ex, ey] = center(wrapper, 'E')
  return Math.hypot(x - ex, y - ey)
}
// Внешний радиус круга с кольцом: обводка рисуется по середине контура
const outerRadius = (wrapper: VueWrapper, key: PointKey) => {
  const circle = node(wrapper, key).get('circle')
  return Number(circle.attributes('r')) + Number(circle.attributes('stroke-width')) / 2
}
// Зазор между краями двух кругов
const edgeGap = (wrapper: VueWrapper, first: PointKey, second: PointKey) => {
  const [x1, y1] = center(wrapper, first)
  const [x2, y2] = center(wrapper, second)
  return Math.hypot(x1 - x2, y1 - y2) - outerRadius(wrapper, first) - outerRadius(wrapper, second)
}
// Троечки на 8 лучах: внешняя точка (A–D или угол квадрата), X2, X1
const rays = ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'I'] as const
const triplet = (ray: typeof rays[number]) => [ray, `${ray}2`, `${ray}1`] as PointKey[]
const caption = (wrapper: VueWrapper) => wrapper.get('[data-testid="matrix-chart"] p').text()

describe('MatrixChart: data', () => {
  it('renders 32 nodes, one per point', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const points = wrapper.findAll('[data-point]').map(element => element.attributes('data-point'))
    expect(points.sort()).toEqual([...pointKeys].sort())
  })

  it('EC1, EC2 lie between E and C1 in order E, EC1, EC2, C1 and show computed values', async () => {
    const points = calculatePoints({ day: 7, month: 5, year: 1992 })
    const wrapper = await mountSuspended(MatrixChart, { props: { points } })
    const [ex, ey] = center(wrapper, 'E')
    const [c1x] = center(wrapper, 'C1')
    let previousX = ex
    for (const key of innerForceKeys) {
      const [x, y] = center(wrapper, key)
      expect(y, key).toBe(ey)
      expect(x, key).toBeGreaterThan(previousX)
      expect(x, key).toBeLessThan(c1x)
      previousX = x
    }
    // Эталон со шпаргалки пользователя: E – EC1 – EC2 = 12-6-18
    expect(innerForceKeys.map(key => value(wrapper, key))).toEqual(['6', '18'])
  })

  it('shows numbers from calculatePoints for 14.07.1992 (mockup values)', async () => {
    const points = calculatePoints(DATE)
    const wrapper = await mountSuspended(MatrixChart, { props: { points, birthDate: DATE } })
    for (const key of pointKeys) {
      expect(value(wrapper, key)).toBe(String(expected[key]))
    }
  })

  it('shows numbers from props for another date (11.02.1999)', async () => {
    const birthDate = { day: 11, month: 2, year: 1999 }
    const points = calculatePoints(birthDate)
    const wrapper = await mountSuspended(MatrixChart, { props: { points, birthDate } })
    for (const key of pointKeys) {
      expect(value(wrapper, key)).toBe(String(points[key]))
    }
  })

  it('without data shows the empty value in every node and no caption text', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const key of pointKeys) {
      expect(value(wrapper, key)).toBe(texts.matrix.emptyValue)
    }
    // Абзац подписи остаётся (резервирует место), но пустой
    expect(caption(wrapper)).toBe('')
  })
})

describe('MatrixChart: rings and geometry', () => {
  it('ring colors come from chakras.ts', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const chakra of chakras) {
      for (const key of chakra.points) {
        expect(node(wrapper, key).get('circle').classes()).toContain(chakra.ringClass)
      }
    }
  })

  it('corners F, G, H, I and points C2, D2, M, MC, MD, EC1, EC2 and diagonal nodes have no chakra ring', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const key of corners) {
      const classes = node(wrapper, key).get('circle').classes()
      expect(classes.some(name => name.startsWith('stroke-chakra-'))).toBe(false)
    }
  })

  it('size tiers: E and A-D equal and largest, then corners F-I, then all X2, then all X1 and A3, B3', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const radius = (key: PointKey) => outerRadius(wrapper, key)
    const tiers: PointKey[][] = [
      ['E', 'A', 'B', 'C', 'D'],
      ['F', 'G', 'H', 'I'],
      rays.map(ray => `${ray}2` as PointKey),
      [...rays.map(ray => `${ray}1` as PointKey), 'A3', 'B3'],
    ]
    for (const [index, tier] of tiers.entries()) {
      // Внутри яруса все круги одного размера
      for (const key of tier) expect(radius(key), key).toBe(radius(tier[0]!))
      if (index > 0) expect(radius(tier[0]!), tier[0]).toBeLessThan(radius(tiers[index - 1]![0]!))
    }
    // M, MC, MD не крупнее третьих точек троечек
    for (const key of ['M', 'MC', 'MD'] as const) expect(radius(key), key).toBeLessThanOrEqual(radius('A1'))
  })

  it('A3, B3, C1, D1 keep the chakra ring', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const key of ['A3', 'B3', 'C1', 'D1'] as const) {
      expect(node(wrapper, key).get('circle').classes().some(name => name.startsWith('stroke-chakra-')), key).toBe(true)
    }
  })

  it('triplets on all 8 rays have the same small edge gaps; A3, B3 sit a bit farther from the triplet and do not touch E', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const gaps = rays.flatMap((ray) => {
      const [outer, second, third] = triplet(ray)
      return [edgeGap(wrapper, outer!, second!), edgeGap(wrapper, second!, third!)]
    })
    for (const gap of gaps) {
      expect(gap).toBeGreaterThan(0)
      expect(gap).toBeCloseTo(gaps[0]!, 6)
    }
    for (const ray of ['A', 'B'] as const) {
      const anahata = `${ray}3` as PointKey
      const anahataGap = edgeGap(wrapper, anahata, `${ray}1` as PointKey)
      expect(anahataGap, ray).toBeGreaterThan(gaps[0]!)
      expect(edgeGap(wrapper, anahata, 'E'), ray).toBeGreaterThan(gaps[0]!)
    }
  })

  it('inner force: EC1–EC2 gap equals the triplet gap, E–EC1 gap is larger, EC2 clear of C1', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const tripletGap = edgeGap(wrapper, 'A', 'A2')
    const between = edgeGap(wrapper, 'EC1', 'EC2')
    expect(between).toBeCloseTo(tripletGap, 6)
    expect(edgeGap(wrapper, 'E', 'EC1')).toBeGreaterThan(between)
    expect(edgeGap(wrapper, 'EC2', 'C1')).toBeGreaterThanOrEqual(0)
  })

  it('A3 and B3 lie between A1/B1 and the center E', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const ray of ['A', 'B'] as const) {
      const order = [`${ray}3`, `${ray}1`, `${ray}2`, ray] as PointKey[]
      const distances = order.map(key => distanceFromE(wrapper, key))
      expect(distances).toEqual([...distances].sort((a, b) => a - b))
      expect(distances[0]).toBeGreaterThan(0)
    }
  })

  it('C and D rays go C1, C2, C and D1, D2, D by growing distance from E', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const ray of ['C', 'D'] as const) {
      const distances = [`${ray}1`, `${ray}2`, ray].map(key => distanceFromE(wrapper, key as PointKey))
      expect(distances).toEqual([...distances].sort((a, b) => a - b))
      expect(new Set(distances).size).toBe(3)
      expect(distances[0]).toBeGreaterThan(0)
    }
  })

  it('M, MC, MD lie on the segment C1-D1 in order C1, MC, M, MD, D1 with a dashed line under them', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const order: PointKey[] = ['C1', 'MC', 'M', 'MD', 'D1']
    const [c1, d1] = [center(wrapper, 'C1'), center(wrapper, 'D1')]
    const distancesFromC1 = order.map((key) => {
      const [x, y] = center(wrapper, key)
      return Math.hypot(x - c1[0], y - c1[1])
    })
    expect(distancesFromC1).toEqual([...distancesFromC1].sort((a, b) => a - b))
    expect(new Set(distancesFromC1).size).toBe(order.length)
    // Узлы лежат на прямой C1-D1: векторное произведение равно нулю
    for (const key of ['MC', 'M', 'MD'] as const) {
      const [x, y] = center(wrapper, key)
      const cross = (d1[0] - c1[0]) * (y - c1[1]) - (d1[1] - c1[1]) * (x - c1[0])
      expect(Math.abs(cross)).toBeLessThan(1e-6)
    }
    const line = wrapper.get('[data-testid="matrix-dashed-line"]')
    expect(line.attributes('stroke-dasharray')).toBeTruthy()
    expect([Number(line.attributes('x1')), Number(line.attributes('y1'))]).toEqual(c1)
    expect([Number(line.attributes('x2')), Number(line.attributes('y2'))]).toEqual(d1)
    // Линия идёт в разметке раньше узлов — значит, рисуется под ними
    const html = wrapper.html()
    expect(html.indexOf('matrix-dashed-line')).toBeLessThan(html.indexOf('data-point='))
  })

  it('diagonal nodes go corner, X2, X1, E by shrinking distance from E', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const corner of ['F', 'G', 'H', 'I'] as const) {
      const keys = [corner, `${corner}2`, `${corner}1`] as PointKey[]
      const distances = keys.map(key => distanceFromE(wrapper, key))
      expect(distances).toEqual([...distances].sort((a, b) => b - a))
      expect(new Set(distances).size).toBe(keys.length)
      expect(distances[2]).toBeGreaterThan(0)
      // Узлы лежат на диагонали угла: векторное произведение с направлением E → угол равно нулю
      const [ex, ey] = center(wrapper, 'E')
      const [cx, cy] = center(wrapper, corner)
      for (const key of keys) {
        const [x, y] = center(wrapper, key)
        expect(Math.abs((cx - ex) * (y - ey) - (cy - ey) * (x - ex))).toBeLessThan(1e-6)
      }
    }
  })

  it('no two circles overlap (outer radius = r + stroke / 2)', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const circles = pointKeys.map((key) => {
      const circle = node(wrapper, key).get('circle')
      const outer = Number(circle.attributes('r')) + Number(circle.attributes('stroke-width')) / 2
      return { key, outer, center: center(wrapper, key) }
    })
    for (const [index, first] of circles.entries()) {
      for (const second of circles.slice(index + 1)) {
        const distance = Math.hypot(first.center[0] - second.center[0], first.center[1] - second.center[1])
        expect(distance, `${first.key} and ${second.key}`).toBeGreaterThanOrEqual(first.outer + second.outer)
      }
    }
  })
})

// Иконки «деньги» (у C1) и «любовь» (у D1) снаружи пунктира C1–D1: только структура и геометрия
describe('MatrixChart: decorative icons', () => {
  type Box = { x0: number, y0: number, x1: number, y1: number }
  const iconIds = ['love', 'money'] as const
  const icon = (wrapper: VueWrapper, id: typeof iconIds[number]) => wrapper.get(`[data-testid="matrix-icon-${id}"]`)
  const box = (wrapper: VueWrapper, id: typeof iconIds[number]): Box => {
    const element = icon(wrapper, id)
    const x = Number(element.attributes('x'))
    const y = Number(element.attributes('y'))
    return { x0: x, y0: y, x1: x + Number(element.attributes('width')), y1: y + Number(element.attributes('height')) }
  }
  const middle = (b: Box): [number, number] => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]
  // Система координат линии C1 → D1: s — вдоль линии от C1, d — от линии наружу (от центра E)
  const frame = (wrapper: VueWrapper) => {
    const [c1x, c1y] = center(wrapper, 'C1')
    const [d1x, d1y] = center(wrapper, 'D1')
    const [ex, ey] = center(wrapper, 'E')
    const length = Math.hypot(d1x - c1x, d1y - c1y)
    const u = [(d1x - c1x) / length, (d1y - c1y) / length] as const
    // Наружу: единичный вектор от E к середине отрезка C1–D1
    const mx = (c1x + d1x) / 2 - ex
    const my = (c1y + d1y) / 2 - ey
    const norm = Math.hypot(mx, my)
    const n = [mx / norm, my / norm] as const
    const project = ([x, y]: [number, number]) => ({
      s: (x - c1x) * u[0] + (y - c1y) * u[1],
      d: (x - c1x) * n[0] + (y - c1y) * n[1],
    })
    return { project, length }
  }
  // Расстояние от прямоугольника до круга и до отрезка
  const gapToCircle = (b: Box, [cx, cy]: [number, number], radius: number) =>
    Math.hypot(Math.max(b.x0 - cx, 0, cx - b.x1), Math.max(b.y0 - cy, 0, cy - b.y1)) - radius
  // Прямой квадрат и линия под 45°: зазор = расстояние от центра до линии − (сторона / 2)·√2
  const gapToDiagonal = (b: Box, distanceFromLine: number) => distanceFromLine - ((b.x1 - b.x0) / 2) * Math.SQRT2
  const propsVariants = [{}, { points: calculatePoints(DATE), birthDate: DATE }]

  it('both icons render with and without data, decorative and non-interactive', async () => {
    for (const props of propsVariants) {
      const wrapper = await mountSuspended(MatrixChart, { props })
      for (const id of iconIds) {
        const element = icon(wrapper, id)
        expect(element.element.tagName.toLowerCase()).toBe('svg')
        expect(element.attributes('aria-hidden')).toBe('true')
        expect(element.attributes('data-point')).toBeUndefined()
      }
      expect(wrapper.findAll('[data-testid^="matrix-icon-"]')).toHaveLength(2)
    }
  })

  it('icons are drawn after the dashed line and use the matrix line color token', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const html = wrapper.html()
    for (const id of iconIds) {
      expect(html.indexOf('matrix-dashed-line')).toBeLessThan(html.indexOf(`matrix-icon-${id}`))
    }
    expect(icon(wrapper, 'love').classes()).toContain('fill-matrix-line')
    expect(icon(wrapper, 'money').classes()).toContain('stroke-matrix-line')
  })

  it('icon centers lie on the outer side of C1-D1, between the line and the rhombus edge C-D', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const { project } = frame(wrapper)
    const edge = project(center(wrapper, 'C')).d
    expect(edge).toBeGreaterThan(0)
    for (const id of iconIds) {
      const { d } = project(middle(box(wrapper, id)))
      expect(d, id).toBeGreaterThan(0)
      expect(d, id).toBeLessThan(edge)
    }
  })

  it('heart projects between MD and D1, money between C1 and MC', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const { project } = frame(wrapper)
    const s = (key: PointKey) => project(center(wrapper, key)).s
    const love = project(middle(box(wrapper, 'love'))).s
    const money = project(middle(box(wrapper, 'money'))).s
    expect(love).toBeGreaterThan(s('MD'))
    expect(love).toBeLessThan(s('D1'))
    expect(money).toBeGreaterThan(s('C1'))
    expect(money).toBeLessThan(s('MC'))
  })

  it('icon boxes do not intersect any node circle and keep clear of the dashed line', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const { project } = frame(wrapper)
    for (const id of iconIds) {
      const b = box(wrapper, id)
      for (const key of pointKeys) {
        expect(gapToCircle(b, center(wrapper, key), outerRadius(wrapper, key)), `${id} and ${key}`).toBeGreaterThan(0)
      }
      expect(gapToDiagonal(b, project(middle(b)).d), `${id} and dashed line`).toBeGreaterThan(0)
    }
  })

  it('icons are mirror images of each other across the diagonal y = x of the chart', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const [lx, ly] = middle(box(wrapper, 'love'))
    const [mx, my] = middle(box(wrapper, 'money'))
    expect(lx).toBeCloseTo(my, 6)
    expect(ly).toBeCloseTo(mx, 6)
    expect(Number(icon(wrapper, 'love').attributes('width'))).toBe(Number(icon(wrapper, 'money').attributes('width')))
  })
})

describe('MatrixChart: caption and accessibility', () => {
  it('caption contains the formatted date and the name', async () => {
    const wrapper = await mountSuspended(MatrixChart, {
      props: { points: calculatePoints(DATE), birthDate: DATE, name: 'Анна' },
    })
    expect(caption(wrapper)).toBe(texts.matrix.caption(formatBirthDate(DATE), 'Анна'))
    expect(caption(wrapper)).toContain('Анна')
    expect(caption(wrapper)).toContain('14.07.1992')
  })

  it('caption without a name uses the default text', async () => {
    const wrapper = await mountSuspended(MatrixChart, { props: { points: calculatePoints(DATE), birthDate: DATE } })
    expect(caption(wrapper)).toBe(texts.matrix.caption(formatBirthDate(DATE)))
  })

  it('chart is one image with an accessible name, with and without data', async () => {
    for (const props of [{}, { points: calculatePoints(DATE), birthDate: DATE }]) {
      const wrapper = await mountSuspended(MatrixChart, { props })
      const svg = wrapper.get('svg[role="img"]')
      expect(svg.attributes('aria-label')).toBe(texts.matrix.chartLabel)
      // Зерно — декоративное
      expect(wrapper.findAll('svg').filter(element => element.attributes('role') !== 'img')
        .every(element => element.attributes('aria-hidden') === 'true')).toBe(true)
    }
  })
})
