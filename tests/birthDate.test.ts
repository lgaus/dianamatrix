// Тесты даты рождения формы (шаг 6): маска ввода ДД.ММ.ГГГГ, разбор и коды ошибок, границы диапазона
// (01.01.1900 … сегодня), 29 февраля, календарная арифметика для календаря.
// Тексты ошибок здесь не проверяются — только коды.
import { describe, expect, it } from 'vitest'
import {
  addDays,
  clampDate,
  compareDates,
  daysInMonth,
  formatBirthDate,
  getMonthWeeks,
  isSameDate,
  maskBirthDateInput,
  MIN_BIRTH_DATE,
  parseBirthDate,
  toBirthDate,
  type BirthDateError,
} from '~/utils/date/birthDate'
import type { BirthDate } from '~/utils/matrix/types'

// Фиксированное «сегодня», чтобы тесты не зависели от часов
const today: BirthDate = { day: 10, month: 11, year: 2026 }

const date = (day: number, month: number, year: number): BirthDate => ({ day, month, year })

describe('maskBirthDateInput', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['14', '14.'],
    ['140', '14.0'],
    ['1407', '14.07.'],
    ['14071', '14.07.1'],
    ['14071992', '14.07.1992'],
  ])('digits %j → %j (dots inserted automatically)', (raw, masked) => {
    expect(maskBirthDateInput(raw)).toBe(masked)
  })

  it('dot after day and month inserted at once; typed dot is not doubled', () => {
    expect(maskBirthDateInput('14.')).toBe('14.')
    expect(maskBirthDateInput('14..')).toBe('14.')
    expect(maskBirthDateInput('14.07.')).toBe('14.07.')
    expect(maskBirthDateInput('1.')).toBe('1')
  })

  it('more than 8 digits: extra dropped', () => {
    expect(maskBirthDateInput('140719921')).toBe('14.07.1992')
    expect(maskBirthDateInput('14.07.19925')).toBe('14.07.1992')
  })

  it.each([
    ['14/07/1992', '14.07.1992'],
    ['14-07-1992', '14.07.1992'],
    [' 14 07 1992 ', '14.07.1992'],
    ['14.07.1992', '14.07.1992'],
    ['a1b4c0d7', '14.07.'],
  ])('paste %j → %j (non-digits dropped)', (raw, masked) => {
    expect(maskBirthDateInput(raw)).toBe(masked)
  })

  it('already masked value is unchanged (masking is idempotent)', () => {
    for (const value of ['', '1', '14.', '14.0', '14.07.', '14.07.19', '14.07.1992']) {
      expect(maskBirthDateInput(value)).toBe(value)
    }
  })
})

describe('parseBirthDate: valid dates', () => {
  it('14.07.1992 → date object', () => {
    expect(parseBirthDate('14.07.1992', today)).toEqual({ ok: true, date: date(14, 7, 1992) })
  })

  it('surrounding whitespace is ignored', () => {
    expect(parseBirthDate('  14.07.1992 ', today)).toEqual({ ok: true, date: date(14, 7, 1992) })
  })

  it('lower bound 01.01.1900 is valid', () => {
    expect(parseBirthDate('01.01.1900', today)).toEqual({ ok: true, date: MIN_BIRTH_DATE })
  })

  it('today is valid, tomorrow is future', () => {
    expect(parseBirthDate('10.11.2026', today)).toEqual({ ok: true, date: today })
    expect(parseBirthDate('11.11.2026', today)).toEqual({ ok: false, error: 'future' })
  })

  it('tomorrow across month and year boundary is future', () => {
    expect(parseBirthDate('01.01.2027', date(31, 12, 2026))).toEqual({ ok: false, error: 'future' })
    expect(parseBirthDate('31.12.2026', date(31, 12, 2026)).ok).toBe(true)
  })

  it.each(['29.02.2024', '29.02.2000', '29.02.1904'])('29.02 in a leap year (%s) is valid', (value) => {
    expect(parseBirthDate(value, today).ok).toBe(true)
  })

  it.each(['31.01.2001', '30.04.2001', '31.12.1999', '28.02.2023'])('last day of month %s is valid', (value) => {
    expect(parseBirthDate(value, today).ok).toBe(true)
  })
})

describe('parseBirthDate: error codes', () => {
  const cases: Array<[string, BirthDateError]> = [
    ['', 'required'],
    ['   ', 'required'],
    ['1', 'format'],
    ['14.07', 'format'],
    ['14.07.19', 'format'],
    ['14.07.92', 'format'],
    ['1.7.1992', 'format'],
    ['14/07/1992', 'format'],
    ['14071992', 'format'],
    ['abc', 'format'],
    ['14.07.19920', 'format'],
    ['29.02.2023', 'nonexistent'],
    ['29.02.1900', 'nonexistent'],
    ['31.02.1990', 'nonexistent'],
    ['30.02.2024', 'nonexistent'],
    ['31.04.1990', 'nonexistent'],
    ['32.01.1990', 'nonexistent'],
    ['00.01.1990', 'nonexistent'],
    ['01.00.1990', 'nonexistent'],
    ['13.13.2000', 'nonexistent'],
    ['01.01.2999', 'future'],
    ['11.11.2026', 'future'],
    ['01.12.2026', 'future'],
    ['31.12.1899', 'tooEarly'],
    ['01.01.0000', 'tooEarly'],
  ]

  it.each(cases)('%j → %s', (value, error) => {
    expect(parseBirthDate(value, today)).toEqual({ ok: false, error })
  })

  it('every error code is reachable', () => {
    const codes = new Set(cases.map(([, error]) => error))
    expect([...codes].sort()).toEqual(['format', 'future', 'nonexistent', 'required', 'tooEarly'])
  })
})

describe('formatBirthDate / toBirthDate', () => {
  it('adds leading zeros', () => {
    expect(formatBirthDate(date(1, 2, 1990))).toBe('01.02.1990')
    expect(formatBirthDate(date(14, 7, 1992))).toBe('14.07.1992')
  })

  it('formatBirthDate and parseBirthDate are inverse', () => {
    for (const value of [date(1, 1, 1900), date(29, 2, 2024), date(31, 12, 1999), today]) {
      expect(parseBirthDate(formatBirthDate(value), today)).toEqual({ ok: true, date: value })
    }
  })

  it('toBirthDate: month is 1-based, local time', () => {
    expect(toBirthDate(new Date(1992, 6, 14, 23, 59))).toEqual(date(14, 7, 1992))
    expect(toBirthDate(new Date(2000, 0, 1, 0, 0))).toEqual(date(1, 1, 2000))
  })
})

describe('calendar arithmetic', () => {
  it.each([
    [2024, 2, 29],
    [2023, 2, 28],
    [1900, 2, 28],
    [2000, 2, 29],
    [1992, 7, 31],
    [1992, 4, 30],
    [1992, 12, 31],
  ])('daysInMonth(%i, %i) = %i', (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days)
  })

  it('compareDates: sign by year, then month, then day', () => {
    expect(compareDates(date(1, 1, 1990), date(1, 1, 1991))).toBeLessThan(0)
    expect(compareDates(date(1, 2, 1990), date(31, 1, 1990))).toBeGreaterThan(0)
    expect(compareDates(date(2, 1, 1990), date(1, 1, 1990))).toBeGreaterThan(0)
    expect(compareDates(date(14, 7, 1992), date(14, 7, 1992))).toBe(0)
  })

  it('isSameDate: null and undefined are not equal', () => {
    expect(isSameDate(date(14, 7, 1992), date(14, 7, 1992))).toBe(true)
    expect(isSameDate(date(14, 7, 1992), date(15, 7, 1992))).toBe(false)
    expect(isSameDate(null, date(14, 7, 1992))).toBe(false)
    expect(isSameDate(date(14, 7, 1992), undefined)).toBe(false)
    expect(isSameDate(null, null)).toBe(false)
  })

  it('clampDate clamps to the range', () => {
    expect(clampDate(date(31, 12, 1899), MIN_BIRTH_DATE, today)).toEqual(MIN_BIRTH_DATE)
    expect(clampDate(date(11, 11, 2026), MIN_BIRTH_DATE, today)).toEqual(today)
    expect(clampDate(date(14, 7, 1992), MIN_BIRTH_DATE, today)).toEqual(date(14, 7, 1992))
  })

  it.each([
    [date(14, 7, 1992), 1, date(15, 7, 1992)],
    [date(31, 7, 1992), 1, date(1, 8, 1992)],
    [date(1, 8, 1992), -1, date(31, 7, 1992)],
    [date(31, 12, 1999), 1, date(1, 1, 2000)],
    [date(1, 1, 2000), -1, date(31, 12, 1999)],
    [date(28, 2, 2024), 1, date(29, 2, 2024)],
    [date(28, 2, 2023), 1, date(1, 3, 2023)],
    [date(1, 3, 2024), -7, date(23, 2, 2024)],
    [date(26, 12, 1999), 7, date(2, 1, 2000)],
    [date(1, 1, 1900), -1, date(31, 12, 1899)],
  ])('addDays(%o, %i) = %o', (from, days, expected) => {
    expect(addDays(from, days)).toEqual(expected)
  })

  describe('getMonthWeeks', () => {
    // Все дни месяца по порядку, без пустых клеток
    const daysOf = (weeks: Array<Array<number | null>>) => weeks.flat().filter((day): day is number => day !== null)

    it.each([
      [1992, 7],
      [2024, 2],
      [2023, 2],
      [1900, 1],
      [2026, 11],
    ])('%i-%i: weeks of 7 cells, all month days in order', (year, month) => {
      const weeks = getMonthWeeks(year, month)
      for (const week of weeks) expect(week).toHaveLength(7)
      expect(daysOf(weeks)).toEqual(Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1))
      // Нет недели целиком из пустых клеток
      for (const week of weeks) expect(week.some(day => day !== null)).toBe(true)
    })

    it('weeks start on Monday: the 1st is in its weekday column', () => {
      for (const [year, month] of [[1992, 7], [2021, 2], [2023, 1], [1900, 1], [2026, 11]] as const) {
        const firstColumn = getMonthWeeks(year, month)[0]!.indexOf(1)
        const mondayBased = (new Date(year, month - 1, 1).getDay() + 6) % 7
        expect(firstColumn).toBe(mondayBased)
      }
    })

    it('February 2021 (starts Monday, 28 days): exactly 4 weeks without empty cells', () => {
      const weeks = getMonthWeeks(2021, 2)
      expect(weeks).toHaveLength(4)
      expect(weeks.flat().includes(null)).toBe(false)
    })

    it('July 1992 starts on Wednesday', () => {
      expect(getMonthWeeks(1992, 7)[0]).toEqual([null, null, 1, 2, 3, 4, 5])
    })
  })
})
