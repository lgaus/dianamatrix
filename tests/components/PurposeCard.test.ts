// Тесты карточки «Предназначение» (шаг 9): шапка, 4 ячейки по порядку, числа из calculatePurpose,
// формулы со слагаемыми, «–» без данных, названия ячеек — заголовки h3, расшифровок аркана нет.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import PurposeCard from '~/components/PurposeCard.vue'
import { texts } from '~/content/texts'
import { arcana } from '~/content/arcana'
import { calculatePoints, calculatePurpose } from '~/utils/matrix/formulas'
import type { BirthDate, Purpose } from '~/utils/matrix/types'

const cards = ['personal', 'social', 'spiritual', 'planetary'] as const
// Слагаемые формулы каждой ячейки
const operands = {
  personal: ['sky', 'earth'],
  social: ['male', 'female'],
  spiritual: ['personal', 'social'],
  planetary: ['social', 'spiritual'],
} as const satisfies Record<(typeof cards)[number], readonly [keyof Purpose, keyof Purpose]>

const purposeFor = (date: BirthDate) => calculatePurpose(calculatePoints(date))
const cells = (wrapper: VueWrapper) => wrapper.findAll('[data-cell]')
const numbers = (wrapper: VueWrapper) => wrapper.findAll('[data-testid="purpose-number"]').map(cell => cell.text())

describe('PurposeCard: structure', () => {
  it('has the card header with its number and an h2 title', async () => {
    const wrapper = await mountSuspended(PurposeCard)
    expect(wrapper.text()).toContain(texts.purpose.number)
    expect(wrapper.get('h2').text()).toBe(texts.purpose.title)
  })

  it('renders 4 cells in order personal, social, spiritual, planetary with an h3 title, age, number and formula', async () => {
    const wrapper = await mountSuspended(PurposeCard)
    expect(cells(wrapper).map(cell => cell.attributes('data-cell'))).toEqual([...cards])
    cells(wrapper).forEach((cell, index) => {
      const card = cards[index]!
      expect(cell.get('h3').text()).toBe(texts.purpose.terms[card])
      expect(cell.text()).toContain(texts.purpose.ages[card])
      // Пустая подпись возраста — без элемента возраста (только h3 в шапке ячейки)
      expect(cell.findAll('h3 ~ span')).toHaveLength(texts.purpose.ages[card] ? 1 : 0)
      expect(cell.findAll('[data-testid="purpose-number"]')).toHaveLength(1)
      expect(cell.findAll('[data-testid="purpose-formula"]')).toHaveLength(1)
    })
  })
})

describe('PurposeCard: data', () => {
  it('shows numbers from calculatePurpose for 14.07.1992 (mockup values)', async () => {
    const purpose = purposeFor({ day: 14, month: 7, year: 1992 })
    const wrapper = await mountSuspended(PurposeCard, { props: { purpose } })
    expect(numbers(wrapper)).toEqual(['21', '6', '9', '15'])
  })

  it.each([
    { day: 14, month: 7, year: 1992 },
    { day: 11, month: 2, year: 1999 },
  ])('shows numbers and formulas with their operands from props (%o)', async (date) => {
    const purpose = purposeFor(date)
    const wrapper = await mountSuspended(PurposeCard, { props: { purpose } })
    expect(numbers(wrapper)).toEqual(cards.map(card => String(purpose[card])))
    cells(wrapper).forEach((cell, index) => {
      const card = cards[index]!
      const [first, second] = operands[card]
      expect(cell.get('[data-testid="purpose-formula"]').text())
        .toBe(texts.purpose.formulas[card](purpose[first], purpose[second]))
    })
  })

  it('has no arcana descriptions', async () => {
    const purpose = purposeFor({ day: 14, month: 7, year: 1992 })
    const wrapper = await mountSuspended(PurposeCard, { props: { purpose } })
    for (const card of cards) {
      expect(wrapper.text()).not.toContain(arcana[purpose[card]].description)
    }
  })

  it('without data shows the empty value in every number and in both formula operands', async () => {
    const wrapper = await mountSuspended(PurposeCard)
    const empty = texts.matrix.emptyValue
    expect(numbers(wrapper)).toEqual(cards.map(() => empty))
    cells(wrapper).forEach((cell, index) => {
      expect(cell.get('[data-testid="purpose-formula"]').text())
        .toBe(texts.purpose.formulas[cards[index]!](empty, empty))
    })
  })
})
