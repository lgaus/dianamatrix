// Типы данных матрицы.

// Номер аркана: от 1 до 22
export type ArcanaNumber =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22

// Id чакр сверху вниз
export type ChakraId =
  | 'sahasrara'
  | 'ajna'
  | 'vishuddha'
  | 'anahata'
  | 'manipura'
  | 'svadhisthana'
  | 'muladhara'

// Дата рождения; формулы считают её корректной (проверка — в форме)
export interface BirthDate {
  day: number
  month: number
  year: number
}

// Данные формы для расчёта: имя (без пробелов по краям; нет — undefined) и дата рождения
export interface MatrixInput {
  name: string | undefined
  birthDate: BirthDate
}

// Имена точек матрицы
export type PointKey =
  | 'A' | 'B' | 'C' | 'D' | 'E'
  | 'F' | 'G' | 'H' | 'I'
  | 'A1' | 'A2' | 'A3'
  | 'B1' | 'B2' | 'B3'
  | 'C1' | 'D1'

export type MatrixPoints = Record<PointKey, ArcanaNumber>

// Строка карты здоровья
export interface HealthRow {
  physics: ArcanaNumber
  energy: ArcanaNumber
  emotions: ArcanaNumber
}

// Карта здоровья: строка на каждую чакру + «Итого»
export type HealthMap = Record<ChakraId | 'total', HealthRow>

export interface Purpose {
  sky: ArcanaNumber
  earth: ArcanaNumber
  personal: ArcanaNumber
  male: ArcanaNumber
  female: ArcanaNumber
  social: ArcanaNumber
  spiritual: ArcanaNumber
  planetary: ArcanaNumber
}

// Описание чакры для app/config/chakras.ts
export interface Chakra {
  id: ChakraId
  // Полный класс Tailwind для обводки кольца узла (цвет из темы)
  ringClass: string
  // Из каких точек берутся Физика и Энергия
  points: readonly [physics: PointKey, energy: PointKey]
}
