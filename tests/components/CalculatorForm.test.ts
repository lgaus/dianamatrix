// Тесты формы расчёта (шаг 6): submit только с правильной датой и с данными { name, birthDate },
// ошибки даты (когда появляются и исчезают, aria-invalid / aria-describedby, фокус), имя ≤ 50 и без пробелов по краям,
// таб «Для пары» недоступен. Формулировки не проверяются: ошибка сверяется с ключом texts.form.errors по коду.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import CalculatorForm from '~/components/CalculatorForm.vue'
import { disabledFillClass } from '~/config/feedback'
import { texts } from '~/content/texts'
import { type BirthDateError, MIN_BIRTH_DATE } from '~/utils/date/birthDate'
import { vtsFix } from '../helpers/vueEvents'

const DATE = '#calculator-birth-date'
const NAME = '#calculator-name'
const ERROR = '#calculator-birth-date-error'
const SUBMIT = '[data-testid="calculator-submit"]'
const PICKER = '[data-testid="date-picker"]'

const wrappers: VueWrapper[] = []

const mountForm = async () => {
  const wrapper = await mountSuspended(CalculatorForm, { attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

const setDate = async (wrapper: VueWrapper, value: string) => {
  await wrapper.get(DATE).setValue(value)
  await nextTick()
}

const submit = async (wrapper: VueWrapper) => {
  await wrapper.get('form').trigger('submit')
  await nextTick()
}

// Уход фокуса из поля даты на другой элемент (Tab): следующий — кнопка «Рассчитать»
const leaveDate = async (wrapper: VueWrapper) => {
  const next = wrapper.get('[data-testid="calculator-submit"]').element
  wrapper.get(DATE).element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: next }))
  await nextTick()
}

const submits = (wrapper: VueWrapper) => wrapper.emitted('submit') ?? []

// Ожидаемый текст ошибки по коду (tooEarly — функция от самого раннего года)
const errorText = (code: BirthDateError) => {
  const message = texts.form.errors[code]
  return typeof message === 'function' ? message(MIN_BIRTH_DATE.year) : message
}

beforeEach(() => {
  // Фиксированное «сегодня»: 10.11.2026 (подменяется только Date)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 10, 12, 0))
})

afterEach(() => {
  vi.useRealTimers()
  while (wrappers.length) wrappers.pop()!.unmount()
})

describe('CalculatorForm: initial state', () => {
  it('fields are empty, placeholders shown, no error', async () => {
    const wrapper = await mountForm()
    const name = wrapper.get<HTMLInputElement>(NAME).element
    const date = wrapper.get<HTMLInputElement>(DATE).element
    expect(name.value).toBe('')
    expect(date.value).toBe('')
    expect(name.placeholder).not.toBe('')
    expect(date.placeholder).not.toBe('')
    expect(wrapper.find(ERROR).exists()).toBe(false)
    expect(date.getAttribute('aria-invalid')).toBeNull()
    expect(date.getAttribute('aria-describedby')).toBeNull()
  })

  it('fields are linked to labels (label for = id)', async () => {
    const wrapper = await mountForm()
    expect(wrapper.find(`label[for="${NAME.slice(1)}"]`).exists()).toBe(true)
    expect(wrapper.find(`label[for="${DATE.slice(1)}"]`).exists()).toBe(true)
  })

  it('date field: numeric keyboard; button is type=submit', async () => {
    const wrapper = await mountForm()
    expect(wrapper.get(DATE).attributes('inputmode')).toBe('numeric')
    expect(wrapper.get('[data-testid="calculator-submit"]').attributes('type')).toBe('submit')
  })
})

describe('CalculatorForm: submit', () => {
  it('valid date without name → submit { name: undefined, birthDate }', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14.07.1992')
    await submit(wrapper)
    expect(submits(wrapper)).toEqual([[{ name: undefined, birthDate: { day: 14, month: 7, year: 1992 } }]])
  })

  it('name is trimmed', async () => {
    const wrapper = await mountForm()
    await wrapper.get(NAME).setValue('  Анна  ')
    await setDate(wrapper, '14.07.1992')
    await submit(wrapper)
    expect(submits(wrapper)).toEqual([[{ name: 'Анна', birthDate: { day: 14, month: 7, year: 1992 } }]])
  })

  it('whitespace-only name counts as empty', async () => {
    const wrapper = await mountForm()
    await wrapper.get(NAME).setValue('   ')
    await setDate(wrapper, '14.07.1992')
    await submit(wrapper)
    expect(submits(wrapper)[0]![0]).toMatchObject({ name: undefined })
  })

  it('name is limited to 50 characters (maxlength)', async () => {
    const wrapper = await mountForm()
    expect(wrapper.get(NAME).attributes('maxlength')).toBe('50')
  })

  it('boundary dates 01.01.1900 and today are submitted', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '01.01.1900')
    await submit(wrapper)
    await setDate(wrapper, '10.11.2026')
    await submit(wrapper)
    expect(submits(wrapper).map(([data]) => (data as { birthDate: unknown }).birthDate)).toEqual([
      { day: 1, month: 1, year: 1900 },
      { day: 10, month: 11, year: 2026 },
    ])
  })

  it('input is masked: digits → DD.MM.YYYY, extra input dropped', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14071992')
    expect(wrapper.get<HTMLInputElement>(DATE).element.value).toBe('14.07.1992')
    await setDate(wrapper, '14/07/19925x')
    expect(wrapper.get<HTMLInputElement>(DATE).element.value).toBe('14.07.1992')
    await submit(wrapper)
    expect(submits(wrapper)).toHaveLength(1)
  })
})

describe('CalculatorForm: date errors', () => {
  const invalid: Array<[string, BirthDateError]> = [
    ['', 'required'],
    ['14.07', 'format'],
    ['31.02.1990', 'nonexistent'],
    ['29.02.2023', 'nonexistent'],
    ['11.11.2026', 'future'],
    ['31.12.1899', 'tooEarly'],
  ]

  it.each(invalid)('submitting %j: no submit, error %s, aria, focus in date field', async (value, code) => {
    const wrapper = await mountForm()
    await setDate(wrapper, value)
    await submit(wrapper)

    expect(submits(wrapper)).toHaveLength(0)
    const error = wrapper.get(ERROR)
    expect(error.text()).toBe(errorText(code))
    const input = wrapper.get(DATE)
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'))
    expect(document.activeElement).toBe(input.element)
  })

  it('blur from a filled invalid field shows the error', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '31.02.1990')
    expect(wrapper.find(ERROR).exists()).toBe(false)
    await leaveDate(wrapper)
    expect(wrapper.get(ERROR).text()).toBe(errorText('nonexistent'))
  })

  it('blur from an empty field shows no error', async () => {
    const wrapper = await mountForm()
    await leaveDate(wrapper)
    expect(wrapper.find(ERROR).exists()).toBe(false)
  })

  it('blur from a valid date shows no error', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14.07.1992')
    await leaveDate(wrapper)
    expect(wrapper.find(ERROR).exists()).toBe(false)
  })

  it('error disappears once the date is fixed (without blur), aria removed', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '29.02.2023')
    await submit(wrapper)
    expect(wrapper.find(ERROR).exists()).toBe(true)

    await setDate(wrapper, '29.02.2024')
    expect(wrapper.find(ERROR).exists()).toBe(false)
    expect(wrapper.get(DATE).attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get(DATE).attributes('aria-describedby')).toBeUndefined()

    await submit(wrapper)
    expect(submits(wrapper)).toEqual([[{ name: undefined, birthDate: { day: 29, month: 2, year: 2024 } }]])
  })

  it('after a fix, a new error shows only on blur or submit', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '31.02.1990')
    await leaveDate(wrapper)
    await setDate(wrapper, '28.02.1990')
    expect(wrapper.find(ERROR).exists()).toBe(false)

    await setDate(wrapper, '28.02')
    expect(wrapper.find(ERROR).exists()).toBe(false)
    await leaveDate(wrapper)
    expect(wrapper.get(ERROR).text()).toBe(errorText('format'))
  })
})

describe('CalculatorForm: tabs', () => {
  it('personal tab selected; couple tab is aria-disabled and not selectable by click', async () => {
    const wrapper = await mountForm()
    const personal = wrapper.get('[data-testid="form-tab-personal"]')
    const couple = wrapper.get('[data-testid="form-tab-couple"]')
    expect(personal.attributes('aria-selected')).toBe('true')
    expect(couple.attributes('aria-selected')).toBe('false')
    expect(couple.attributes('aria-disabled')).toBe('true')
    expect(personal.attributes('aria-disabled')).toBeUndefined()

    await couple.trigger('click')
    expect(personal.attributes('aria-selected')).toBe('true')
    expect(couple.attributes('aria-selected')).toBe('false')
  })

  it('tabs are type=button: click does not submit the form', async () => {
    const wrapper = await mountForm()
    for (const tab of wrapper.findAll('[role="tab"]')) expect(tab.attributes('type')).toBe('button')
  })

  it('couple tab has a note, personal tab does not', async () => {
    const wrapper = await mountForm()
    expect(wrapper.get('[data-testid="form-tab-couple"] span').text()).not.toBe('')
    expect(wrapper.find('[data-testid="form-tab-personal"] span').exists()).toBe(false)
  })
})

describe('CalculatorForm: submit button without a full valid date', () => {
  it.each([
    ['', 'пусто'],
    ['14.07.', 'неполная'],
    ['31.02.1990', 'несуществующая'],
    ['01.01.1899', 'раньше 1900'],
    ['11.11.2026', 'в будущем'],
  ])('%j (%s): aria-disabled (not disabled, stays in Tab order)', async (value) => {
    const wrapper = await mountForm()
    if (value) await setDate(wrapper, value)
    const button = wrapper.get(SUBMIT)
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('full valid date: enabled; name does not matter', async () => {
    const wrapper = await mountForm()
    await wrapper.get(NAME).setValue('Анна')
    expect(wrapper.get(SUBMIT).attributes('aria-disabled')).toBe('true')
    await setDate(wrapper, '14.07.1992')
    expect(wrapper.get(SUBMIT).attributes('aria-disabled')).toBeUndefined()
  })

  it('clicking the inactive button submits nothing and shows the error', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14.07.')
    wrapper.get(SUBMIT).element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()
    expect(submits(wrapper)).toHaveLength(0)
    expect(wrapper.find(ERROR).exists()).toBe(true)
  })

  it('clicking the active button is not prevented', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14.07.1992')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.get(SUBMIT).element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('CalculatorForm: tabs and panel (aria)', () => {
  it('form panel is a tabpanel labelled by the selected tab; aria-controls only on the available tab', async () => {
    const wrapper = await mountForm()
    const panel = wrapper.get('[role="tabpanel"]')
    const personal = wrapper.get('[data-testid="form-tab-personal"]')
    const couple = wrapper.get('[data-testid="form-tab-couple"]')
    expect(panel.attributes('aria-labelledby')).toBe(personal.attributes('id'))
    expect(personal.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(couple.attributes('aria-controls')).toBeUndefined()
    expect(personal.attributes('id')).not.toBe(couple.attributes('id'))
  })

  it('arrow keys move focus to the adjacent tab, wrapping around', async () => {
    const wrapper = await mountForm()
    const personal = wrapper.get<HTMLButtonElement>('[data-testid="form-tab-personal"]')
    const couple = wrapper.get<HTMLButtonElement>('[data-testid="form-tab-couple"]')
    personal.element.focus()
    await personal.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(couple.element)
    await couple.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(personal.element)
    await personal.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(couple.element)
  })
})

describe('CalculatorForm: reserved error space', () => {
  it('date error line exists without an error (space reserved), without id or aria link', async () => {
    const wrapper = await mountForm()
    const date = wrapper.get(DATE)
    const field = date.element.closest('[data-testid="calculator-birth-date"]') ?? date.element.parentElement!.parentElement!
    const line = field.querySelector('p')
    expect(line).not.toBeNull()
    expect(line!.textContent!.trim()).toBe('')
    expect(line!.id).toBe('')
    expect(date.attributes('aria-describedby')).toBeUndefined()
  })
})

// ---- Раунд 3: «Рассчитать» при открытом календаре, нажатие неактивной кнопки, очистка поля ----
describe('CalculatorForm: submit button and calendar', () => {
  // pointerdown основной кнопкой (button 0 — левая кнопка мыши, касание)
  const pointerdown = () => vtsFix(new PointerEvent('pointerdown', { button: 0, bubbles: true, cancelable: true }))

  // Нажатие кнопки как в браузере: pointerdown, затем click (click по submit-кнопке отправляет форму)
  const press = async (wrapper: VueWrapper) => {
    wrapper.get(SUBMIT).element.dispatchEvent(pointerdown())
    await nextTick()
    await wrapper.get('form').trigger('submit')
    await nextTick()
  }

  const openCalendar = async (wrapper: VueWrapper) => {
    await wrapper.get(DATE).trigger('focus')
    await nextTick()
  }

  it('open calendar with a date picked in it: date is confirmed and submitted', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14.07.1992')
    await openCalendar(wrapper)
    await wrapper.get('[data-testid="date-picker-grid"] [data-day="20"]').trigger('click')
    await nextTick()
    await press(wrapper)
    expect(wrapper.find(PICKER).exists()).toBe(false)
    expect(wrapper.get<HTMLInputElement>(DATE).element.value).toBe('20.07.1992')
    expect(submits(wrapper)).toEqual([[{ name: undefined, birthDate: { day: 20, month: 7, year: 1992 } }]])
    expect(wrapper.find(ERROR).exists()).toBe(false)
  })

  it('pointerdown on submit before outside click closes the calendar: selection is not reverted', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14.07.1992')
    await openCalendar(wrapper)
    await wrapper.get('[data-testid="date-picker-grid"] [data-day="20"]').trigger('click')
    await nextTick()
    // слушатель закрытия на document срабатывает после обработчика кнопки (всплытие)
    wrapper.get(SUBMIT).element.dispatchEvent(pointerdown())
    await nextTick()
    expect(wrapper.get<HTMLInputElement>(DATE).element.value).toBe('20.07.1992')
  })

  it('inactive button with open calendar and incomplete date: error, focus in field, no submit', async () => {
    const wrapper = await mountForm()
    await openCalendar(wrapper)
    await setDate(wrapper, '14.07.')
    expect(wrapper.get(SUBMIT).attributes('aria-disabled')).toBe('true')
    await press(wrapper)
    expect(submits(wrapper)).toHaveLength(0)
    expect(wrapper.get(ERROR).text()).toBe(errorText('format'))
    expect(document.activeElement).toBe(wrapper.get(DATE).element)
  })

  it('clicking the inactive button focuses the date field without opening the calendar', async () => {
    const wrapper = await mountForm()
    await press(wrapper)
    expect(document.activeElement).toBe(wrapper.get(DATE).element)
    expect(wrapper.find(PICKER).exists()).toBe(false)
    expect(wrapper.get(ERROR).text()).toBe(errorText('required'))
  })

  it('date error line is aria-live="polite" with and without an error', async () => {
    const wrapper = await mountForm()
    const field = wrapper.get('[data-testid="calculator-birth-date"]')
    expect(field.get('p').attributes('aria-live')).toBe('polite')
    await submit(wrapper)
    expect(wrapper.get(ERROR).attributes('aria-live')).toBe('polite')
  })

  it('clearing the field keeps the error (code: required)', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '31.02.1990')
    await submit(wrapper)
    expect(wrapper.get(ERROR).text()).toBe(errorText('nonexistent'))
    await setDate(wrapper, '')
    expect(wrapper.get(ERROR).text()).toBe(errorText('required'))
    expect(wrapper.get(DATE).attributes('aria-invalid')).toBe('true')
  })

  it('Enter in field with open calendar and full date: only confirms (prevented, form not submitted)', async () => {
    const wrapper = await mountForm()
    await setDate(wrapper, '14.07.1992')
    await openCalendar(wrapper)
    const event = vtsFix(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    wrapper.get(DATE).element.dispatchEvent(event)
    await nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.find(PICKER).exists()).toBe(false)
    expect(submits(wrapper)).toHaveLength(0)
  })
})

// Неактивная «Рассчитать» — тот же класс, что у неактивной «Подтвердить» в календаре
describe('CalculatorForm: submit button look', () => {
  const classesOf = (value: string) => value.split(/\s+/).filter(Boolean)

  it('no date: disabledFillClass; valid date: accent background without inactive classes', async () => {
    const wrapper = await mountForm()
    expect(wrapper.get(SUBMIT).classes()).toEqual(expect.arrayContaining(classesOf(disabledFillClass)))
    expect(wrapper.get(SUBMIT).classes()).not.toContain('bg-accent')
    await setDate(wrapper, '14.07.1992')
    expect(wrapper.get(SUBMIT).classes()).toEqual(expect.arrayContaining(['bg-accent', 'text-surface']))
    for (const cls of classesOf(disabledFillClass)) expect(wrapper.get(SUBMIT).classes()).not.toContain(cls)
  })
})
