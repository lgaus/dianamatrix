// Тесты схемы матрицы (шаг 7): 17 кругов с числами из calculatePoints, «–» и пустая подпись до расчёта,
// цвета колец из chakras.ts, A3/B3 между A1/B1 и центром, подпись с датой и именем, доступное имя схемы.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MatrixChart from '~/components/MatrixChart.vue'
import { chakras } from '~/config/chakras'
import { texts } from '~/content/texts'
import { formatBirthDate } from '~/utils/date/birthDate'
import { calculatePoints } from '~/utils/matrix/formulas'
import type { BirthDate, PointKey } from '~/utils/matrix/types'

const pointKeys: PointKey[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'D1']
const corners: PointKey[] = ['F', 'G', 'H', 'I']

const DATE: BirthDate = { day: 14, month: 7, year: 1992 }
// Эталон из макета и PLAN.md для 14.07.1992
const expected: Record<PointKey, number> = {
  A: 14, B: 7, C: 21, D: 6, E: 12, F: 21, G: 10, H: 9, I: 20,
  A1: 8, A2: 22, A3: 20, B1: 19, B2: 8, B3: 4, C1: 6, D1: 18,
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
  it('renders 17 nodes, one per point', async () => {
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

  it('corners F, G, H, I have no chakra ring', async () => {
    const wrapper = await mountSuspended(MatrixChart)
    for (const key of corners) {
      const classes = node(wrapper, key).get('circle').classes()
      expect(classes.some(name => name.startsWith('stroke-chakra-'))).toBe(false)
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
