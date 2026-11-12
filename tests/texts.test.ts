// Тесты текстов (шаг 3): только структура texts.ts и подстановка данных в функции.
// Формулировки не проверяются совсем — их можно менять как угодно (слова, знаки, порядок),
// тесты от этого не падают. Сверка формулировок с макетами — ручная.
import { describe, expect, it } from 'vitest'
import { texts } from '~/content/texts'

const isNonEmptyString = (value: unknown): boolean =>
  typeof value === 'string' && value.trim() !== ''

// Значение по пути вида "form.title"
const getByPath = (path: string): unknown =>
  path.split('.').reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
    texts,
  )

// Все строковые значения объекта с путями
const collectStrings = (value: unknown, path = ''): Array<[string, unknown]> => {
  if (typeof value === 'string') return [[path, value]]
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      collectStrings(child, path ? `${path}.${key}` : key))
  }
  return []
}

// Строковые ключи, которые будут использовать компоненты
const stringPaths = [
  'header.logo',
  'header.tagline',
  'header.nav.about',
  'header.cta',
  'header.ctaShort',
  'header.backToHome',
  'form.badge',
  'form.title',
  'form.description',
  'form.tabs.personal',
  'form.tabs.couple',
  'form.nameLabel',
  'form.birthDateLabel',
  'form.submit',
  'matrix.chartLabel',
  'matrix.emptyValue',
  'healthMap.number',
  'healthMap.title',
  'healthMap.subtitle',
  'healthMap.columns.chakra',
  'healthMap.columns.physics',
  'healthMap.columns.energy',
  'healthMap.columns.emotions',
  'healthMap.total',
  'purpose.number',
  'purpose.title',
  'purpose.subtitle',
  'consultation.label',
  'consultation.title',
  'consultation.titleMobile',
  'consultation.description',
  'consultation.cta',
  'consultation.priceNote',
  'contacts.title',
  'contacts.intro',
  'contacts.closeLabel',
  'contacts.message',
  'contacts.names.telegram',
  'contacts.names.whatsapp',
  'contacts.names.vk',
  'contacts.names.instagram',
]

const cards = ['personal', 'social', 'spiritual', 'planetary'] as const
const termKeys = ['sky', 'earth', 'male', 'female', 'personal', 'social', 'spiritual', 'planetary'] as const
const chakraIds = ['sahasrara', 'ajna', 'vishuddha', 'anahata', 'manipura', 'svadhisthana', 'muladhara']

// Пары чисел: ни одно число не является подстрокой другого, чтобы совпадение не было случайным
const numberPairs: Array<[number, number]> = [[13, 8], [5, 21], [19, 4], [7, 22]]
const dates = ['14.07.1992', '01.01.2000', '31.12.1985']

describe('texts: structure', () => {
  it('has all sections', () => {
    for (const section of ['header', 'form', 'matrix', 'healthMap', 'purpose', 'consultation', 'contacts']) {
      expect(texts).toHaveProperty(section)
    }
  })

  it.each(stringPaths)('%s is a non-empty string', (path) => {
    expect(isNonEmptyString(getByPath(path))).toBe(true)
  })

  it('has no empty strings anywhere', () => {
    const bad = collectStrings(texts).filter(([, value]) => !isNonEmptyString(value)).map(([path]) => path)
    expect(bad).toEqual([])
  })
})

describe('texts: healthMap.chakras', () => {
  it('has exactly 7 chakras sahasrara..muladhara in this order', () => {
    expect(Object.keys(texts.healthMap.chakras)).toEqual(chakraIds)
  })

  it.each(chakraIds)('%s has a non-empty name and zone', (id) => {
    const chakra = texts.healthMap.chakras[id as keyof typeof texts.healthMap.chakras]
    expect(isNonEmptyString(chakra.name)).toBe(true)
    expect(isNonEmptyString(chakra.zone)).toBe(true)
  })
})

describe('texts: purpose', () => {
  it.each(termKeys)('terms.%s is a non-empty string', (key) => {
    expect(isNonEmptyString(texts.purpose.terms[key])).toBe(true)
  })

  it.each(cards)('ages.%s is a non-empty string', (card) => {
    expect(isNonEmptyString(texts.purpose.ages[card])).toBe(true)
  })

  it.each(cards)('formulas.%s is a function', (card) => {
    expect(typeof texts.purpose.formulas[card]).toBe('function')
  })
})

describe('texts: functions with data', () => {
  it.each(dates)('matrix.caption(%s) is a non-empty string containing the date', (date) => {
    const result = texts.matrix.caption(date)
    expect(isNonEmptyString(result)).toBe(true)
    expect(result).toContain(date)
  })

  it.each(dates)('matrix.caption(%s, name) contains the date and the name', (date) => {
    const result = texts.matrix.caption(date, 'Анна')
    expect(result).toContain(date)
    expect(result).toContain('Анна')
  })

  // Какие слова из purpose.terms должна содержать каждая формула
  const formulaTerms = {
    personal: ['sky', 'earth'],
    social: ['male', 'female'],
    spiritual: ['personal', 'social'],
    planetary: ['social', 'spiritual'],
  } as const satisfies Record<(typeof cards)[number], readonly [(typeof termKeys)[number], (typeof termKeys)[number]]>

  describe.each(cards)('purpose.formulas.%s', (card) => {
    it.each(numberPairs)('(%i, %i) is a non-empty string containing both numbers', (first, second) => {
      const result = texts.purpose.formulas[card](first, second)
      expect(isNonEmptyString(result)).toBe(true)
      expect(result).toContain(String(first))
      expect(result).toContain(String(second))
    })

    it('uses both words from purpose.terms (case-insensitive)', () => {
      const result = texts.purpose.formulas[card](13, 8).toLowerCase()
      for (const key of formulaTerms[card]) {
        expect(result).toContain(texts.purpose.terms[key].toLowerCase())
      }
    })
  })
})
