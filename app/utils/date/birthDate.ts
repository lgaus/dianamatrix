// Дата рождения в форме: маска ввода ДД.ММ.ГГГГ, разбор (полный и по частям), проверка и календарная арифметика.
// Только чистые функции, без Vue и без текстов: ошибки возвращаются кодами, тексты к ним — в texts.ts (form.errors).
// Лежит во вложенной папке utils/date: Nuxt её не автоимпортирует, импорты везде явные.
import type { BirthDate } from '../matrix/types'

// Самая ранняя допустимая дата рождения
export const MIN_BIRTH_DATE: BirthDate = { day: 1, month: 1, year: 1900 }

// Цифр в полной дате ДД.ММ.ГГГГ
const DATE_DIGITS = 8

// Разделитель частей даты
const SEPARATOR = '.'

export type BirthDateError = 'required' | 'format' | 'nonexistent' | 'future' | 'tooEarly'

export type BirthDateResult =
  | { ok: true, date: BirthDate }
  | { ok: false, error: BirthDateError }

// Текст поля после правки и позиция курсора в нём
export interface MaskedInput {
  value: string
  caret: number
}

const onlyDigits = (text: string) => text.replace(/\D/g, '')

// Цифры → ДД.ММ.ГГГГ: точка ставится сразу после двух цифр дня и двух цифр месяца («12» → «12.», «1203» → «12.03.»)
function formatDigits(digits: string): string {
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, DATE_DIGITS)
  let result = day
  if (day.length === 2) result += SEPARATOR + month
  if (month.length === 2) result += SEPARATOR + year
  return result
}

// Позиция курсора после count-й цифры текста; точка сразу за ней пропускается (курсор встаёт после точки)
function caretAfterDigits(text: string, count: number): number {
  let caret = 0
  let seen = 0
  while (seen < count && caret < text.length) {
    if (/\d/.test(text[caret]!)) seen++
    caret++
  }
  if (text[caret] === SEPARATOR) caret++
  return caret
}

// Маска: из любой строки (ввод, вставка «14/07/1992», «14071992») берутся цифры, не больше 8, и расставляются точки.
// Напечатанная пользователем точка не задваивается: она отбрасывается вместе с остальными не-цифрами
export function maskBirthDateInput(raw: string): string {
  return formatDigits(onlyDigits(raw).slice(0, DATE_DIGITS))
}

// Маска после правки в поле (ввод, вставка, удаление, замена выделенного): caret — курсор в тексте до маски.
// Курсор остаётся после той же по счёту цифры, что и до маски, — добавленные и убранные точки его не сдвигают
export function maskBirthDateEdit(raw: string, caret: number): MaskedInput {
  const value = maskBirthDateInput(raw)
  const digitsBefore = Math.min(onlyDigits(raw.slice(0, caret)).length, DATE_DIGITS)
  return { value, caret: caretAfterDigits(value, digitsBefore) }
}

// Удаление точки клавишей (курсор без выделения стоит у точки): точка ставится маской автоматически,
// поэтому вместе с ней удаляется соседняя цифра — Backspace после точки удаляет цифру перед ней, Delete перед точкой — цифру после.
// null — у курсора нет точки, работает обычное удаление
export function removeAtSeparator(value: string, caret: number, direction: 'backward' | 'forward'): MaskedInput | null {
  const separatorIndex = direction === 'backward' ? caret - 1 : caret
  if (value[separatorIndex] !== SEPARATOR) return null

  const digitsBefore = onlyDigits(value.slice(0, separatorIndex)).length
  // Индекс удаляемой цифры среди всех цифр
  const removed = direction === 'backward' ? digitsBefore - 1 : digitsBefore
  const digits = onlyDigits(value)
  if (removed < 0 || removed >= digits.length) return null

  const next = formatDigits(digits.slice(0, removed) + digits.slice(removed + 1))
  return { value: next, caret: caretAfterDigits(next, removed) }
}

// Полная дата (8 цифр), курсор без выделения: цифра заменяет цифру сразу после курсора (точки пропускаются),
// остальные цифры не сдвигаются; курсор встаёт после заменённой цифры. Курсор в конце — замены нет, поле не меняется
function overwriteDigit(value: string, caret: number, digit: string): MaskedInput {
  const digitsBefore = onlyDigits(value.slice(0, caret)).length
  if (digitsBefore >= DATE_DIGITS) return { value, caret }
  const digits = onlyDigits(value)
  const next = formatDigits(digits.slice(0, digitsBefore) + digit + digits.slice(digitsBefore + 1))
  return { value: next, caret: caretAfterDigits(next, digitsBefore + 1) }
}

// Точка в конце неполной даты после одной цифры дня («1») или месяца («01.3») дополняет её нулём: «01.», «01.03.».
// Одиночный 0 не дополняется («00» — недопустимая часть): точка отбрасывается, ждём вторую цифру.
// null — правило не подходит (курсор не в конце, есть выделение, часть не из одной цифры, цифра 0): точка отбрасывается маской
function padSinglePart(value: string, start: number, end: number): MaskedInput | null {
  if (start !== end || start !== value.length) return null
  const digits = onlyDigits(value)
  if ((digits.length !== 1 && digits.length !== 3) || digits.endsWith('0')) return null
  const next = formatDigits(`${digits.slice(0, -1)}0${digits.slice(-1)}`)
  return { value: next, caret: next.length }
}

// Клавиши удаления и их направление
const deleteDirections: Record<string, 'backward' | 'forward'> = {
  Backspace: 'backward',
  Delete: 'forward',
}

// Правка поля клавишей: start…end — выделение (курсор, если равны). Результат — как у браузера с маской после правки,
// плюс особые случаи: замена цифры в полной дате (overwriteDigit), «1.» → «01.» (padSinglePart),
// удаление точки вместе с соседней цифрой (removeAtSeparator).
// null — клавиша не правит дату этой функцией (остальные клавиши; точка, когда дополнять нечего)
export function editBirthDateByKey(value: string, start: number, end: number, key: string): MaskedInput | null {
  const isCollapsed = start === end

  if (/^\d$/.test(key)) {
    if (isCollapsed && onlyDigits(value).length === DATE_DIGITS) return overwriteDigit(value, start, key)
    return maskBirthDateEdit(value.slice(0, start) + key + value.slice(end), start + 1)
  }

  if (key === SEPARATOR) return padSinglePart(value, start, end)

  const direction = deleteDirections[key]
  if (!direction) return null
  if (!isCollapsed) return maskBirthDateEdit(value.slice(0, start) + value.slice(end), start)
  const atSeparator = removeAtSeparator(value, start, direction)
  if (atSeparator) return atSeparator
  // Удаляемый символ; у края поля удалять нечего — поле не меняется
  const removed = direction === 'backward' ? start - 1 : start
  if (removed < 0 || removed >= value.length) return { value, caret: start }
  return maskBirthDateEdit(value.slice(0, removed) + value.slice(removed + 1), removed)
}

// Части даты из текста поля (в том числе неполного) — для синхронизации с календарём во время ввода.
// Число — часть введена полностью (день и месяц — 2 цифры, год — 4) и допустима сама по себе;
// null — часть не введена или введена не до конца. invalid — хотя бы одна введённая часть недопустима (день 35, месяц 13, год вне 1900…today)
export interface BirthDateParts {
  day: number | null
  month: number | null
  year: number | null
  invalid: boolean
}

export function parseBirthDateParts(text: string, today: BirthDate): BirthDateParts {
  const digits = onlyDigits(text).slice(0, DATE_DIGITS)
  const parts: BirthDateParts = { day: null, month: null, year: null, invalid: false }

  const take = (from: number, length: number, min: number, max: number): number | null => {
    const chunk = digits.slice(from, from + length)
    if (chunk.length < length) return null
    const number = Number(chunk)
    if (number < min || number > max) {
      parts.invalid = true
      return null
    }
    return number
  }

  parts.day = take(0, 2, 1, 31)
  parts.month = take(2, 2, 1, 12)
  parts.year = take(4, 4, MIN_BIRTH_DATE.year, today.year)
  return parts
}

// Дата в виде ДД.ММ.ГГГГ
export function formatBirthDate({ day, month, year }: BirthDate): string {
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${String(year).padStart(4, '0')}`
}

// Date → BirthDate (по местному времени устройства; toBirthDate(new Date()) — сегодня)
export function toBirthDate(value: Date): BirthDate {
  return { day: value.getDate(), month: value.getMonth() + 1, year: value.getFullYear() }
}

// Дней в месяце (месяц 1–12)
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Сравнение дат: < 0 — a раньше b, 0 — равны, > 0 — a позже b
export function compareDates(a: BirthDate, b: BirthDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day
}

export function isSameDate(a: BirthDate | null | undefined, b: BirthDate | null | undefined): boolean {
  return !!a && !!b && compareDates(a, b) === 0
}

// Ограничение даты диапазоном [min, max]
export function clampDate(date: BirthDate, min: BirthDate, max: BirthDate): BirthDate {
  if (compareDates(date, min) < 0) return min
  if (compareDates(date, max) > 0) return max
  return date
}

// Сдвиг даты на days дней (может переходить через месяц и год)
export function addDays(date: BirthDate, days: number): BirthDate {
  const shifted = new Date(date.year, date.month - 1, date.day + days)
  // Годы 0–99 Date трактует как 1900–1999; в диапазоне формы (от 1900) этого не бывает
  return toBirthDate(shifted)
}

// Разбор и проверка введённой строки; today — сегодняшняя дата (верхняя граница)
export function parseBirthDate(text: string, today: BirthDate): BirthDateResult {
  const value = text.trim()
  if (value === '') return { ok: false, error: 'required' }

  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)
  if (!match) return { ok: false, error: 'format' }

  const date: BirthDate = { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) }
  if (date.year < MIN_BIRTH_DATE.year) return { ok: false, error: 'tooEarly' }
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > daysInMonth(date.year, date.month)) {
    return { ok: false, error: 'nonexistent' }
  }
  if (compareDates(date, today) > 0) return { ok: false, error: 'future' }
  return { ok: true, date }
}

// Наибольшее число недель (строк) в сетке месяца: 31 день, 1-е число — воскресенье
export const MAX_MONTH_WEEKS = 6

// Сетка месяца для календаря: недели с понедельника, пустые клетки до 1-го и после последнего дня — null
export function getMonthWeeks(year: number, month: number): Array<Array<number | null>> {
  // getDay(): 0 — воскресенье; сдвиг, чтобы понедельник был 0
  const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: Array<Array<number | null>> = []
  for (let start = 0; start < cells.length; start += 7) weeks.push(cells.slice(start, start + 7))
  return weeks
}
