// ТЕСТОВЫЕ ФОРМУЛЫ, заменить на методику Дианы.
// Правила — PLAN.md, шаг 4. Только чистые функции.
import type { ArcanaNumber, BirthDate, Chakra, ChakraId, HealthMap, HealthRow, MatrixPoints, Purpose } from './types'

const digitSum = (n: number): number =>
  [...String(n)].reduce((sum, digit) => sum + Number(digit), 0)

// Пока n > 22 — заменить на сумму цифр.
// Вход ≥ 1 (дата корректна), поэтому результат всегда 1–22
export function reduce(n: number): ArcanaNumber {
  while (n > 22) n = digitSum(n)
  return n as ArcanaNumber
}

export function calculatePoints({ day, month, year }: BirthDate): MatrixPoints {
  const A = reduce(day)
  const B = reduce(month)
  const C = reduce(digitSum(year))
  const D = reduce(A + B + C)
  const E = reduce(A + B + C + D)
  const A1 = reduce(A + E)
  const B1 = reduce(B + E)
  return {
    A, B, C, D, E,
    F: reduce(A + B),
    G: reduce(B + C),
    H: reduce(C + D),
    I: reduce(D + A),
    A1,
    A2: reduce(A + A1),
    A3: reduce(A1 + E),
    B1,
    B2: reduce(B + B1),
    B3: reduce(B1 + E),
    C1: reduce(C + E),
    D1: reduce(D + E),
  }
}

// Эмоции = reduce(Физика + Энергия); «Итого» = reduce(сумма столбца)
export function calculateHealth(points: MatrixPoints, chakras: readonly Chakra[]): HealthMap {
  const rows = chakras.map(({ id, points: [physicsKey, energyKey] }): [ChakraId, HealthRow] => {
    const physics = points[physicsKey]
    const energy = points[energyKey]
    return [id, { physics, energy, emotions: reduce(physics + energy) }]
  })
  const columnTotal = (column: keyof HealthRow): ArcanaNumber =>
    reduce(rows.reduce((sum, [, row]) => sum + row[column], 0))
  const total: HealthRow = {
    physics: columnTotal('physics'),
    energy: columnTotal('energy'),
    emotions: columnTotal('emotions'),
  }
  // Object.fromEntries теряет ключи; что в chakras есть все 7 чакр, проверяет автотест
  return { ...Object.fromEntries(rows), total } as HealthMap
}

export function calculatePurpose({ A, B, C, D, F, G, H, I }: MatrixPoints): Purpose {
  const sky = reduce(B + D)
  const earth = reduce(A + C)
  const personal = reduce(sky + earth)
  const male = reduce(F + H)
  const female = reduce(G + I)
  const social = reduce(male + female)
  const spiritual = reduce(personal + social)
  const planetary = reduce(social + spiritual)
  return { sky, earth, personal, male, female, social, spiritual, planetary }
}
