// Тесты главной: каркас (шаг 5) — пять блоков в порядке макета; связка (шаг 11) — до расчёта «–» и без подписи,
// после даты и «Рассчитать» числа в схеме, карте здоровья и предназначении совпадают с контрольными.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { texts } from '~/content/texts'
import { controlCases } from '../helpers/controlCases'
import IndexPage from '~/pages/index.vue'
import AboutPage from '~/pages/about.vue'
import type { HealthRow } from '~/utils/matrix/types'

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

const control = controlCases['14.07.1992']!
const empty = texts.matrix.emptyValue
const columns: Array<keyof HealthRow> = ['physics', 'energy', 'emotions']

describe('index.vue: wiring', () => {
  beforeEach(() => {
    // Фиксированное «сегодня» (подменяется только Date): дата рождения не позже него
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 10, 12, 0))
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const mountPage = () => mountSuspended(IndexPage, { route: '/', attachTo: document.body })

  it('before calculation: every value is the empty value, no caption', async () => {
    const wrapper = await mountPage()
    const chartNodes = wrapper.findAll('[data-testid="matrix-chart"] text')
    const purposeNumbers = wrapper.findAll('[data-testid="purpose-number"]')
    const healthCells = wrapper.findAll('[data-testid="health-map-card"] td')

    expect(chartNodes.length).toBeGreaterThan(0)
    expect(purposeNumbers.length).toBeGreaterThan(0)
    expect(healthCells.length).toBeGreaterThan(0)
    for (const cell of [...chartNodes, ...purposeNumbers, ...healthCells]) expect(cell.text()).toBe(empty)
    expect(wrapper.get('[data-testid="matrix-chart"] p').text()).toBe('')
    wrapper.unmount()
  })

  it('after date and submit: caption shown, purpose and health total match the control values', async () => {
    const wrapper = await mountPage()
    await wrapper.get('#calculator-birth-date').setValue('14.07.1992')
    await wrapper.get('form').trigger('submit')
    await nextTick()

    expect(wrapper.get('[data-testid="matrix-chart"] p').text()).not.toBe('')
    expect(wrapper.get('[data-cell="personal"] [data-testid="purpose-number"]').text()).toBe(String(control.purpose.personal))
    const total = wrapper.findAll('[data-testid="health-map-card"] tfoot td').map(cell => cell.text())
    expect(total).toEqual(columns.map(column => String(control.health.total[column])))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    wrapper.unmount()
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
