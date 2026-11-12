// Тесты схемы матрицы (шаг 7): 30 кругов с числами из calculatePoints, «–» и пустая подпись до расчёта,
// цвета колец из chakras.ts, A3/B3 между A1/B1 и центром, порядок C1, C2, C и D1, D2, D, узлы линии C1–D1 и диагональные узлы, без наложений кругов, подпись с датой и именем, доступное имя схемы.
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
const pointKeys: PointKey[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'D1', 'D2', 'M', 'MC', 'MD', ...diagonalKeys]
// Точки без кольца чакры: углы квадрата, C2, D2, узлы линии C1–D1 и диагональные узлы
const corners: PointKey[] = ['F', 'G', 'H', 'I', 'C2', 'D2', 'M', 'MC', 'MD', ...diagonalKeys]

const DATE: BirthDate = { day: 14, month: 7, year: 1992 }
// Эталон из макета и PLAN.md для 14.07.1992
const expected: Record<PointKey, number> = {
  A: 14, B: 7, C: 21, D: 6, E: 12, F: 21, G: 10, H: 9, I: 20,
  A1: 8, A2: 22, A3: 20, B1: 19, B2: 8, B3: 4, C1: 6, C2: 9, D1: 18, D2: 6, M: 6, MC: 12, MD: 6,
  F1: 6, F2: 9, G1: 22, G2: 5, H1: 21, H2: 3, I1: 5, I2: 7,
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
const caption = (wrapper: VueWrapper) => wrapper.get('[data-testid="matrix-chart"] p').text()

describe('MatrixChart: data', () => {
  it('renders 30 nodes, one per point', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const points = wrapper.findAll('[data-point]').map(element => element.attributes('data-point'))
    expect(points.sort()).toEqual([...pointKeys].sort())
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

  it('corners F, G, H, I and points C2, D2, M, MC, MD and diagonal nodes have no chakra ring', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const key of corners) {
      const classes = node(wrapper, key).get('circle').classes()
      expect(classes.some(name => name.startsWith('stroke-chakra-'))).toBe(false)
    }
  })

  it('A3, B3, C1, D1 are small nodes: same outer size as M, smaller than A1 and A2, chakra ring kept', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    const outerRadius = (key: PointKey) => {
      const circle = node(wrapper, key).get('circle')
      return Number(circle.attributes('r')) + Number(circle.attributes('stroke-width')) / 2
    }
    for (const key of ['A3', 'B3', 'C1', 'D1'] as const) {
      expect(outerRadius(key), key).toBe(outerRadius('M'))
      expect(outerRadius(key), key).toBeLessThan(outerRadius('A1'))
      expect(node(wrapper, key).get('circle').classes().some(name => name.startsWith('stroke-chakra-')), key).toBe(true)
    }
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
