// Тесты каркаса главной (шаг 5): пять блоков в порядке макета.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'
import AboutPage from '~/pages/about.vue'

// Порядок блоков в макете (сверху вниз; на компьютере — слева направо по рядам)
const blockOrder = [
  'calculator-form',
  'matrix-chart',
  'health-map-card',
  'purpose-card',
  'consultation-block',
]

describe('index.vue: layout', () => {
  it('renders 5 blocks in mockup order, each once', async () => {
    const wrapper = await mountSuspended(IndexPage, { route: '/' })
    const testIds = wrapper.findAll('[data-testid]')
      .map(element => element.attributes('data-testid'))
      .filter((testId): testId is string => blockOrder.includes(testId ?? ''))

    expect(testIds).toEqual(blockOrder)
  })
})

describe('about.vue: stub', () => {
  it('renders without home page blocks', async () => {
    const wrapper = await mountSuspended(AboutPage, { route: '/about' })

    expect(wrapper.find('[data-testid="about-page"]').exists()).toBe(true)
    for (const testId of blockOrder) {
      expect(wrapper.find(`[data-testid="${testId}"]`).exists()).toBe(false)
    }
  })
})
