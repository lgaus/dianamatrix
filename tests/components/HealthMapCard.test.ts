// Тесты карты здоровья (шаг 8): таблица 7 чакр × физика, энергия, эмоции + «Итого»,
// числа из calculateHealth, «–» без данных, порядок и цвета колец из chakras.ts, разметка таблицы для чтения экрана.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import HealthMapCard from '~/components/HealthMapCard.vue'
import { chakras } from '~/config/chakras'
import { texts } from '~/content/texts'
import { calculateHealth, calculatePoints } from '~/utils/matrix/formulas'
import type { BirthDate, HealthMap, HealthRow } from '~/utils/matrix/types'

const columns: Array<keyof HealthRow> = ['physics', 'energy', 'emotions']

const healthFor = (date: BirthDate) => calculateHealth(calculatePoints(date), chakras)
const bodyRows = (wrapper: VueWrapper) => wrapper.findAll('tbody tr')
const cells = (row: ReturnType<VueWrapper['get']>) => row.findAll('td').map(cell => cell.text())
// Ожидаемые числа: строки чакр по порядку chakras.ts, затем «Итого»
const expectedRows = (health: HealthMap) =>
  [...chakras.map(chakra => health[chakra.id]), health.total].map(row => columns.map(column => String(row[column])))
const renderedRows = (wrapper: VueWrapper) => [...bodyRows(wrapper), wrapper.get('tfoot tr')].map(cells)

describe('HealthMapCard: structure', () => {
  it('is a table with a caption, 4 column headers and a row header per chakra and total', async () => {
    const wrapper = await mountSuspended(HealthMapCard)
    expect(wrapper.find('table caption').text()).not.toBe('')
    expect(wrapper.findAll('thead th[scope="col"]')).toHaveLength(4)
    expect(bodyRows(wrapper)).toHaveLength(chakras.length)
    for (const row of bodyRows(wrapper)) {
      expect(row.findAll('th[scope="row"]')).toHaveLength(1)
      expect(row.findAll('td')).toHaveLength(columns.length)
    }
    const total = wrapper.get('tfoot tr')
    expect(total.findAll('th[scope="row"]')).toHaveLength(1)
    expect(total.findAll('td')).toHaveLength(columns.length)
  })

  it('lists chakras in chakras.ts order with ring colors from chakras.ts, rings hidden from screen readers', async () => {
    const wrapper = await mountSuspended(HealthMapCard)
    const rows = bodyRows(wrapper)
    chakras.forEach((chakra, index) => {
      const row = rows[index]!
      expect(row.attributes('data-chakra')).toBe(chakra.id)
      expect(row.get('th').text()).toContain(texts.healthMap.chakras[chakra.id].name)
      expect(row.get('circle').classes()).toContain(chakra.ringClass)
      expect(row.get('svg').attributes('aria-hidden')).toBe('true')
    })
  })
})

describe('HealthMapCard: data', () => {
  it('shows numbers from calculateHealth for 14.07.1992 (mockup values)', async () => {
    const health = healthFor({ day: 14, month: 7, year: 1992 })
    const wrapper = await mountSuspended(HealthMapCard, { props: { health } })
    expect(renderedRows(wrapper)).toEqual(expectedRows(health))
    // Эталон из макета и PLAN.md: первая строка и «Итого»
    expect(renderedRows(wrapper)[0]).toEqual(['14', '7', '21'])
    expect(renderedRows(wrapper)[chakras.length]).toEqual(['4', '11', '6'])
  })

  it('shows numbers from props for another date (11.02.1999)', async () => {
    const health = healthFor({ day: 11, month: 2, year: 1999 })
    const wrapper = await mountSuspended(HealthMapCard, { props: { health } })
    expect(renderedRows(wrapper)).toEqual(expectedRows(health))
  })

  it('without data shows the empty value in every number cell, total included', async () => {
    const wrapper = await mountSuspended(HealthMapCard)
    const values = wrapper.findAll('td').map(cell => cell.text())
    expect(values).toHaveLength((chakras.length + 1) * columns.length)
    expect(values.every(value => value === texts.matrix.emptyValue)).toBe(true)
  })
})
