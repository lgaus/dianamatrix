// Тесты правки поля даты: маска с курсором (maskBirthDateEdit), удаление точки вместе с цифрой
// (removeAtSeparator), части неполной даты для календаря (parseBirthDateParts), daysInMonth и addDays.
import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysInMonth,
  maskBirthDateEdit,
  parseBirthDateParts,
  removeAtSeparator,
} from '~/utils/date/birthDate'
import type { BirthDate } from '~/utils/matrix/types'

const today: BirthDate = { day: 10, month: 11, year: 2026 }

describe('maskBirthDateEdit: caret after edit', () => {
  it.each([
    // [текст после правки, курсор до маски, значение, курсор после маски]
    ['1', 1, '1', 1],
    ['14', 2, '14.', 3],
    ['14.0', 4, '14.0', 4],
    ['14.07', 5, '14.07.', 6],
    ['14.07.1992', 10, '14.07.1992', 10],
  ])('typing at end: %j (caret %i) → %j, caret %i (after dot)', (raw, caret, value, nextCaret) => {
    expect(maskBirthDateEdit(raw, caret)).toEqual({ value, caret: nextCaret })
  })

  it('deleting a digit in the middle: caret stays at the edit position, not at the end', () => {
    // «14.0|7.1992» → Backspace удаляет «0»
    expect(maskBirthDateEdit('14.7.1992', 3)).toEqual({ value: '14.71.992', caret: 3 })
  })

  it('inserting a digit in the middle: caret right after the inserted digit', () => {
    // «14.|71.992» → ввод «0»
    expect(maskBirthDateEdit('14.071.992', 4)).toEqual({ value: '14.07.1992', caret: 4 })
    // «1|4.07.1992» → ввод «2» (девятая цифра отбрасывается)
    expect(maskBirthDateEdit('124.07.1992', 2)).toEqual({ value: '12.40.7199', caret: 3 })
  })

  it('replacing a selection at the start: caret after the typed digit', () => {
    // «[14].07.1992» → ввод «2»
    expect(maskBirthDateEdit('2.07.1992', 1)).toEqual({ value: '20.71.992', caret: 1 })
  })

  it('pasting with separators: caret after the last pasted digit', () => {
    expect(maskBirthDateEdit('14/07/1992', 10)).toEqual({ value: '14.07.1992', caret: 10 })
  })

  it('caret does not exceed value length', () => {
    for (const raw of ['', '1', '14', '14071992', '140719921234']) {
      const { value, caret } = maskBirthDateEdit(raw, raw.length)
      expect(caret).toBeGreaterThanOrEqual(0)
      expect(caret).toBeLessThanOrEqual(value.length)
    }
  })
})

describe('removeAtSeparator: deleting a dot by key', () => {
  it('Backspace right after a dot removes the digit before the dot', () => {
    expect(removeAtSeparator('14.07.1992', 3, 'backward')).toEqual({ value: '10.71.992', caret: 1 })
    expect(removeAtSeparator('14.07.1992', 6, 'backward')).toEqual({ value: '14.01.992', caret: 4 })
  })

  it('Backspace after the trailing dot of an incomplete date: «14.» → «1»', () => {
    expect(removeAtSeparator('14.', 3, 'backward')).toEqual({ value: '1', caret: 1 })
    expect(removeAtSeparator('14.07.', 6, 'backward')).toEqual({ value: '14.0', caret: 4 })
  })

  it('Delete before a dot removes the digit after the dot', () => {
    expect(removeAtSeparator('14.07.1992', 2, 'forward')).toEqual({ value: '14.71.992', caret: 3 })
  })

  it('no dot at caret: null (regular deletion)', () => {
    expect(removeAtSeparator('14.07.1992', 4, 'backward')).toBeNull()
    expect(removeAtSeparator('14.07.1992', 4, 'forward')).toBeNull()
    expect(removeAtSeparator('', 0, 'backward')).toBeNull()
  })

  it('Delete before a trailing dot with no digit after it: null', () => {
    expect(removeAtSeparator('14.', 2, 'forward')).toBeNull()
  })
})

describe('parseBirthDateParts: parts of an incomplete date', () => {
  it.each([
    ['', { day: null, month: null, year: null, invalid: false }],
    ['1', { day: null, month: null, year: null, invalid: false }],
    ['14.', { day: 14, month: null, year: null, invalid: false }],
    ['14.0', { day: 14, month: null, year: null, invalid: false }],
    ['14.07.', { day: 14, month: 7, year: null, invalid: false }],
    ['14.07.199', { day: 14, month: 7, year: null, invalid: false }],
    ['14.07.1992', { day: 14, month: 7, year: 1992, invalid: false }],
  ])('%j → parts', (text, parts) => {
    expect(parseBirthDateParts(text, today)).toEqual(parts)
  })

  it.each([
    ['35.', 'день > 31'],
    ['00.', 'день 0'],
    ['14.13.', 'месяц 13'],
    ['14.00.', 'месяц 0'],
    ['14.07.1899', 'год до 1900'],
    ['14.07.2027', 'год после текущего'],
  ])('%j: invalid (%s), invalid part is null', (text) => {
    const parts = parseBirthDateParts(text, today)
    expect(parts.invalid).toBe(true)
  })

  it('31.02: parts valid separately (day-in-month check is up to the calendar and parseBirthDate)', () => {
    expect(parseBirthDateParts('31.02.1990', today)).toEqual({ day: 31, month: 2, year: 1990, invalid: false })
  })

  it('current year is valid, 1900 boundary too', () => {
    expect(parseBirthDateParts('01.01.1900', today).year).toBe(1900)
    expect(parseBirthDateParts('01.01.2026', today).year).toBe(2026)
  })
})

describe('daysInMonth / addDays', () => {
  it('daysInMonth: leap February, 30 and 31 days', () => {
    expect(daysInMonth(1992, 2)).toBe(29)
    expect(daysInMonth(1900, 2)).toBe(28)
    expect(daysInMonth(2000, 2)).toBe(29)
    expect(daysInMonth(1993, 4)).toBe(30)
    expect(daysInMonth(1993, 12)).toBe(31)
  })

  it('addDays: across month and year, backward and forward', () => {
    expect(addDays({ day: 31, month: 12, year: 1999 }, 1)).toEqual({ day: 1, month: 1, year: 2000 })
    expect(addDays({ day: 1, month: 3, year: 1992 }, -1)).toEqual({ day: 29, month: 2, year: 1992 })
    expect(addDays({ day: 28, month: 7, year: 1992 }, 7)).toEqual({ day: 4, month: 8, year: 1992 })
  })
})
