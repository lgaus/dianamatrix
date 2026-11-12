/// <reference types="node" />
// Тесты тестовых формул (шаг 4): контрольные значения для 14.07.1992 и 11.02.1999,
// reduce на границах, диапазон 1..22 на множестве дат, конфиг чакр, чистота formulas.ts.
// Эталоны — данные, посчитанные вручную по правилам PLAN.md, а не тексты.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { chakras } from '~/config/chakras'
import { controlCases } from './helpers/controlCases'
import { calculateHealth, calculatePoints, calculatePurpose, reduce } from '~/utils/matrix/formulas'
import type { BirthDate, ChakraId, PointKey } from '~/utils/matrix/types'

// В окружении nuxt import.meta.url не указывает на файл, поэтому путь — от корня проекта
const readProjectFile = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

// Порядок чакр сверху вниз, как в ChakraId
const chakraOrder = [
  'sahasrara', 'ajna', 'vishuddha', 'anahata', 'manipura', 'svadhisthana', 'muladhara',
] as const satisfies readonly ChakraId[]

// Проверка на этапе типов: chakraOrder покрывает все ChakraId
type MissingChakraIds = Exclude<ChakraId, (typeof chakraOrder)[number]>
const allChakraIdsCovered: MissingChakraIds extends never ? true : false = true

const pointKeys = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
  'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'D1', 'D2', 'M', 'MC', 'MD',
  'F1', 'F2', 'G1', 'G2', 'H1', 'H2', 'I1', 'I2',
] as const satisfies readonly PointKey[]

type MissingPointKeys = Exclude<PointKey, (typeof pointKeys)[number]>
const allPointKeysCovered: MissingPointKeys extends never ? true : false = true

// Все значения расчёта одной датой: точки, карта здоровья, предназначение
const calculateAll = (date: BirthDate) => {
  const points = calculatePoints(date)
  return { points, health: calculateHealth(points, chakras), purpose: calculatePurpose(points) }
}

const collectValues = ({ points, health, purpose }: ReturnType<typeof calculateAll>): number[] => [
  ...Object.values(points),
  ...Object.values(health).flatMap((row) => [row.physics, row.energy, row.emotions]),
  ...Object.values(purpose),
]

const isArcana = (value: number): boolean => Number.isInteger(value) && value >= 1 && value <= 22

describe('reduce', () => {
  it.each([
    [1, 1],
    [22, 22],
    [23, 5],
    [99, 18],
    [199, 19],
    [999, 9],
  ])('reduce(%i) = %i', (input, expected) => {
    expect(reduce(input)).toBe(expected)
  })
})

describe.each(Object.entries(controlCases))('control date %s', (_, control) => {
  const result = calculateAll(control.date)

  it('calculates all points', () => {
    expect(Object.keys(result.points).sort()).toEqual([...pointKeys].sort())
    expect(result.points).toEqual(control.points)
  })

  it('calculates the full health map', () => {
    expect(Object.keys(result.health)).toEqual([...chakraOrder, 'total'])
    expect(result.health).toEqual(control.health)
  })

  it('calculates purpose', () => {
    expect(result.purpose).toEqual(control.purpose)
  })
})

describe('all values are arcana numbers 1..22', () => {
  // Обязательные даты + края месяцев и годов в диапазоне 1900..2099
  const namedDates: BirthDate[] = [
    { day: 1, month: 1, year: 1900 },
    { day: 31, month: 12, year: 2099 },
    { day: 29, month: 2, year: 2000 },
    { day: 22, month: 11, year: 1988 },
    { day: 9, month: 9, year: 1999 },
  ]
  const years = [1900, 1909, 1949, 1988, 1999, 2000, 2019, 2049, 2089, 2099]
  const dayMonthPairs: [number, number][] = [[1, 1], [22, 2], [28, 2], [31, 3], [23, 7], [30, 9], [19, 10], [31, 12]]
  const generatedDates = years.flatMap((year) => dayMonthPairs.map(([day, month]) => ({ day, month, year })))
  const dates = [...namedDates, ...generatedDates]

  it('covers several dozen dates', () => {
    expect(dates.length).toBeGreaterThanOrEqual(40)
  })

  const formatDate = ({ day, month, year }: BirthDate): string =>
    `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`

  it.each(dates.map((date) => [formatDate(date), date] as const))(
    '%s',
    (_, date) => {
      const values = collectValues(calculateAll(date))
      expect(values).toHaveLength(30 + 8 * 3 + 8)
      expect(values.filter((value) => !isArcana(value))).toEqual([])
    },
  )

  it('holds for every calendar date 1900..2099', () => {
    const invalid: string[] = []
    const current = new Date(Date.UTC(1900, 0, 1))
    const end = Date.UTC(2099, 11, 31)
    while (current.getTime() <= end) {
      const date = { day: current.getUTCDate(), month: current.getUTCMonth() + 1, year: current.getUTCFullYear() }
      if (!collectValues(calculateAll(date)).every(isArcana)) invalid.push(`${date.day}.${date.month}.${date.year}`)
      current.setUTCDate(current.getUTCDate() + 1)
    }
    expect(invalid).toEqual([])
  })
})

describe('chakras config', () => {
  it('has 7 chakras in ChakraId order', () => {
    expect(allChakraIdsCovered).toBe(true)
    expect(chakras.map(({ id }) => id)).toEqual([...chakraOrder])
  })

  it.each(chakras.map((chakra) => [chakra.id, chakra] as const))('%s has a ring class and valid points', (_, chakra) => {
    expect(typeof chakra.ringClass).toBe('string')
    expect(chakra.ringClass.startsWith('stroke-chakra-')).toBe(true)
    expect(chakra.ringClass.length).toBeGreaterThan('stroke-chakra-'.length)
    expect(chakra.points).toHaveLength(2)
    expect(allPointKeysCovered).toBe(true)
    for (const key of chakra.points) expect(pointKeys).toContain(key)
  })

  it('ring classes refer to existing theme tokens', () => {
    const theme = readProjectFile('app/assets/css/theme.css')
    for (const { ringClass } of chakras) {
      const token = `--color-${ringClass.slice('stroke-'.length)}`
      expect(theme).toContain(`${token}:`)
    }
  })

  // Цвета и точки по решению issue #11 (макет)
  it('maps chakras to colors and points as decided', () => {
    expect(chakras.map(({ id, ringClass, points }) => [id, ringClass, [...points]])).toEqual([
      ['sahasrara', 'stroke-chakra-violet', ['A', 'B']],
      ['ajna', 'stroke-chakra-blue', ['A2', 'B2']],
      ['vishuddha', 'stroke-chakra-cyan', ['A1', 'B1']],
      ['anahata', 'stroke-chakra-green', ['A3', 'B3']],
      ['manipura', 'stroke-chakra-yellow', ['E', 'E']],
      ['svadhisthana', 'stroke-chakra-orange', ['C1', 'D1']],
      ['muladhara', 'stroke-chakra-red', ['C', 'D']],
    ])
  })
})

describe('formulas.ts purity', () => {
  const source = readProjectFile('app/utils/matrix/formulas.ts')

  it('starts with the test-formulas marker comment', () => {
    expect(source.trimStart().startsWith('//')).toBe(true)
  })

  it('imports only types from ./types', () => {
    const staticImports = [...source.matchAll(/^\s*import\b[\s\S]*?(?:from\s*)?['"][^'"]*['"]/gm)].map((m) => m[0].trim())
    expect(staticImports.length).toBeGreaterThan(0)
    for (const statement of staticImports) {
      expect(statement).toMatch(/^import\s+type\s+\{[^}]*\}\s+from\s+'\.\/types'$/)
    }
  })

  it('has no re-exports, dynamic imports or require', () => {
    expect(source).not.toMatch(/\bexport\s+(?:\*|\{[^}]*\})\s+from\b/)
    expect(source).not.toMatch(/\bimport\s*\(/)
    expect(source).not.toMatch(/\brequire\s*\(/)
  })
})
