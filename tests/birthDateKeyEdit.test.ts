// Тесты правки поля даты клавишами: editBirthDateByKey — режим замены в полной дате,
// «1.» → «01.», «0.» — точка отбрасывается, удаление Backspace/Delete, замена выделения, необрабатываемые клавиши.
import { describe, expect, it } from 'vitest'
import { editBirthDateByKey, maskBirthDateEdit } from '~/utils/date/birthDate'

// Курсор без выделения
const press = (value: string, caret: number, key: string) => editBirthDateByKey(value, caret, caret, key)

describe('editBirthDateByKey: overwrite mode in full date', () => {
  it.each([
    // [курсор, цифра, значение, курсор после]
    [0, '2', '24.07.1992', 1],
    [1, '5', '15.07.1992', 3],
    // курсор перед точкой — заменяется первая цифра после точки
    [2, '0', '14.07.1992', 4],
    [3, '1', '14.17.1992', 4],
    [4, '3', '14.03.1992', 6],
    // курсор перед точкой перед годом — заменяется первая цифра года
    [5, '2', '14.07.2992', 7],
    [6, '2', '14.07.2992', 7],
    [9, '5', '14.07.1995', 10],
  ])('14.07.1992, caret %i, «%s» → %j, caret %i', (caret, key, value, nextCaret) => {
    expect(press('14.07.1992', caret, key)).toEqual({ value, caret: nextCaret })
  })

  it('length and dot positions unchanged, digits to the right do not shift', () => {
    for (let caret = 0; caret < 10; caret++) {
      const result = press('14.07.1992', caret, '8')!
      expect(result.value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
      expect(result.value.replace(/\D/g, '')).toHaveLength(8)
    }
  })

  it('caret at end of full date: field unchanged', () => {
    expect(press('14.07.1992', 10, '5')).toEqual({ value: '14.07.1992', caret: 10 })
  })

  it('consecutive digits replace consecutive digits (across a dot)', () => {
    let state = { value: '14.07.1992', caret: 0 }
    for (const key of '01022000') state = press(state.value, state.caret, key)!
    expect(state).toEqual({ value: '01.02.2000', caret: 10 })
  })

  it('selection in full date: replaces the selection as in a regular masked field', () => {
    // «[14].07.1992» → «2»
    expect(editBirthDateByKey('14.07.1992', 0, 2, '2')).toEqual(maskBirthDateEdit('2.07.1992', 1))
    // всё выделено → «5»
    expect(editBirthDateByKey('14.07.1992', 0, 10, '5')).toEqual({ value: '5', caret: 1 })
  })

  it('incomplete date: digit is inserted (no overwrite)', () => {
    expect(press('14.07.199', 0, '2')).toEqual(maskBirthDateEdit('214.07.199', 1))
    expect(press('14.07.', 6, '1')).toEqual({ value: '14.07.1', caret: 7 })
  })
})

describe('editBirthDateByKey: dot', () => {
  it('«1.» → «01.», «01.3.» → «01.03.»', () => {
    expect(press('1', 1, '.')).toEqual({ value: '01.', caret: 3 })
    expect(press('01.3', 4, '.')).toEqual({ value: '01.03.', caret: 6 })
  })

  it.each([
    ['0', 1, 'одиночный 0 дня'],
    ['01.0', 4, 'одиночный 0 месяца'],
    ['', 0, 'пустое поле'],
    ['14.', 3, 'день уже из двух цифр'],
    ['14.07.', 6, 'месяц уже из двух цифр'],
    ['14.07.1', 7, 'год'],
    ['14.07.1992', 10, 'полная дата'],
    ['1', 0, 'курсор не в конце'],
  ])('%j, caret %i (%s): null, dot does not pad', (value, caret) => {
    expect(press(value, caret, '.')).toBeNull()
  })

  it('dot dropped by an edit (input path) is removed by the mask: «0.» → «0»', () => {
    expect(maskBirthDateEdit('0.', 2)).toEqual({ value: '0', caret: 1 })
    expect(maskBirthDateEdit('01.0.', 5)).toEqual({ value: '01.0', caret: 4 })
  })

  it('dot with selection: null', () => {
    expect(editBirthDateByKey('1', 0, 1, '.')).toBeNull()
  })
})

describe('editBirthDateByKey: deletion', () => {
  it('Backspace in the middle: digits shift left, caret at edit position', () => {
    // «14.0|7.1992»
    expect(press('14.07.1992', 4, 'Backspace')).toEqual(maskBirthDateEdit('14.7.1992', 3))
  })

  it('Backspace after a dot and Delete before a dot remove the adjacent digit', () => {
    expect(press('14.07.1992', 3, 'Backspace')).toEqual({ value: '10.71.992', caret: 1 })
    expect(press('14.07.1992', 2, 'Delete')).toEqual({ value: '14.71.992', caret: 3 })
  })

  it('nothing to delete at field edge: field unchanged', () => {
    expect(press('14.07.1992', 0, 'Backspace')).toEqual({ value: '14.07.1992', caret: 0 })
    expect(press('14.07.1992', 10, 'Delete')).toEqual({ value: '14.07.1992', caret: 10 })
    expect(press('', 0, 'Backspace')).toEqual({ value: '', caret: 0 })
  })

  it('deleting a selection', () => {
    expect(editBirthDateByKey('14.07.1992', 0, 10, 'Backspace')).toEqual({ value: '', caret: 0 })
    expect(editBirthDateByKey('14.07.1992', 6, 10, 'Delete')).toEqual({ value: '14.07.', caret: 6 })
  })
})

describe('editBirthDateByKey: other keys', () => {
  it.each(['a', 'Enter', 'Escape', 'Tab', 'ArrowLeft', 'ArrowDown', '/', ' ', 'Shift'])('%j: null (not handled)', (key) => {
    expect(press('14.07.1992', 3, key)).toBeNull()
  })
})
