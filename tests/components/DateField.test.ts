// Тесты поля даты с календарём: маска с точкой и курсором при правке в середине,
// синхронизация поле ↔ календарь (в том числе по частям), смена месяца/года сохраняет день,
// «Подтвердить» неактивна без полной допустимой даты, откат изменений календаря при закрытии без подтверждения
// (напечатанное сохраняется), нажатия внутри календаря не уводят фокус, слушатель pointerdown только при открытом
// календаре, тач (pointer: coarse) — поле только для чтения без экранной клавиатуры. Формулировки не проверяются.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import DateField from '~/components/DateField.vue'
import { vtsFix } from '../helpers/vueEvents'

const wrappers: VueWrapper[] = []

beforeEach(() => {
  // Фиксированное «сегодня»: 10.11.2026 (подменяется только Date)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 10, 12, 0))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  while (wrappers.length) wrappers.pop()!.unmount()
})

// realTransition — настоящий Transition (по умолчанию Vue Test Utils его заглушает, и хуки after-enter не вызываются)
const mountField = async (initial = '', { realTransition = false } = {}) => {
  const value = ref(initial)
  const Host = defineComponent({
    setup: () => () => h(DateField, {
      'id': 'test-date',
      'label': 'label',
      'modelValue': value.value,
      'onUpdate:modelValue': (next: string) => {
        value.value = next
      },
    }),
  })
  const wrapper = await mountSuspended(Host, {
    attachTo: document.body,
    ...(realTransition && { global: { stubs: { transition: false } } }),
  })
  wrappers.push(wrapper)
  return { wrapper, value }
}

const input = (wrapper: VueWrapper) => wrapper.get<HTMLInputElement>('#test-date')
const picker = (wrapper: VueWrapper) => wrapper.find('[data-testid="date-picker"]')
const confirmButton = (wrapper: VueWrapper) => wrapper.get('[data-testid="date-picker-confirm"]')
const day = (wrapper: VueWrapper, number: number) => wrapper.get(`[data-testid="date-picker-grid"] [data-day="${number}"]`)
const selectValue = (wrapper: VueWrapper, name: 'month' | 'year') =>
  wrapper.get<HTMLSelectElement>(`[data-testid="date-picker-${name}"]`).element.value
const pressedDays = (wrapper: VueWrapper) =>
  wrapper.findAll('[data-testid="date-picker-grid"] [aria-pressed="true"]').map(button => button.attributes('data-day'))

const openField = async (wrapper: VueWrapper) => {
  await input(wrapper).trigger('focus')
  await nextTick()
}

// Правка в поле как в браузере: новый текст и курсор, затем событие input
const edit = async (wrapper: VueWrapper, text: string, caret = text.length) => {
  const element = input(wrapper).element
  element.value = text
  element.setSelectionRange(caret, caret)
  await input(wrapper).trigger('input')
  await nextTick()
  await nextTick()
}

const changeSelect = async (wrapper: VueWrapper, name: 'month' | 'year', value: number) => {
  await wrapper.get(`[data-testid="date-picker-${name}"]`).setValue(String(value))
  await nextTick()
}

describe('DateField: mask and caret', () => {
  it('dot is inserted right after day and month', async () => {
    const { wrapper, value } = await mountField()
    await openField(wrapper)
    await edit(wrapper, '14')
    expect(value.value).toBe('14.')
    expect(input(wrapper).element.selectionStart).toBe(3)
    await edit(wrapper, '14.07')
    expect(value.value).toBe('14.07.')
    expect(input(wrapper).element.selectionStart).toBe(6)
  })

  it('edit in the middle: caret stays at the edit position', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    // «14.0|7.1992» → Backspace
    await edit(wrapper, '14.7.1992', 3)
    expect(value.value).toBe('14.71.992')
    expect(input(wrapper).element.selectionStart).toBe(3)
    // ввод «0» на том же месте
    await edit(wrapper, '14.071.992', 4)
    expect(value.value).toBe('14.07.1992')
    expect(input(wrapper).element.selectionStart).toBe(4)
  })

  it('Backspace right after a dot removes the dot with the preceding digit', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    input(wrapper).element.setSelectionRange(3, 3)
    await input(wrapper).trigger('keydown', { key: 'Backspace' })
    await nextTick()
    expect(value.value).toBe('10.71.992')
    expect(input(wrapper).element.selectionStart).toBe(1)
  })
})

describe('DateField: field → calendar sync', () => {
  it('by parts: day highlighted at once, month after two digits, year after four', async () => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    expect([selectValue(wrapper, 'month'), selectValue(wrapper, 'year')]).toEqual(['11', '2026'])

    await edit(wrapper, '05.')
    expect(pressedDays(wrapper)).toEqual(['5'])
    expect(selectValue(wrapper, 'month')).toBe('11')

    await edit(wrapper, '05.07.')
    expect(selectValue(wrapper, 'month')).toBe('7')
    expect(selectValue(wrapper, 'year')).toBe('2026')
    expect(pressedDays(wrapper)).toEqual(['5'])

    await edit(wrapper, '05.07.199')
    expect(selectValue(wrapper, 'year')).toBe('2026')

    await edit(wrapper, '05.07.1992')
    expect(selectValue(wrapper, 'year')).toBe('1992')
    expect(pressedDays(wrapper)).toEqual(['5'])
  })

  it('invalid part (day 35, year 1899): no highlight', async () => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    await edit(wrapper, '35.')
    expect(pressedDays(wrapper)).toEqual([])
    await edit(wrapper, '01.01.1899')
    expect(pressedDays(wrapper)).toEqual([])
  })

  it('nonexistent day in month (31.02): no highlight', async () => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    await edit(wrapper, '31.02.1990')
    expect(selectValue(wrapper, 'month')).toBe('2')
    expect(pressedDays(wrapper)).toEqual([])
  })
})

describe('DateField: calendar → field, month and year change', () => {
  it('picking a day updates the field at once', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await day(wrapper, 20).trigger('click')
    expect(value.value).toBe('20.07.1992')
  })

  it('month/year change keeps the day; missing day → last day of month', async () => {
    const { wrapper, value } = await mountField('31.07.1992')
    await openField(wrapper)
    await changeSelect(wrapper, 'month', 2)
    expect(value.value).toBe('29.02.1992')
    await changeSelect(wrapper, 'year', 1993)
    expect(value.value).toBe('28.02.1993')
    await wrapper.get('[data-testid="date-picker-next"]').trigger('click')
    await nextTick()
    expect(value.value).toBe('28.03.1993')
    await wrapper.get('[data-testid="date-picker-prev"]').trigger('click')
    await nextTick()
    expect(value.value).toBe('28.02.1993')
  })

  it('date after today on month/year change → today (nearest valid)', async () => {
    const { wrapper, value } = await mountField('15.10.2026')
    await openField(wrapper)
    await wrapper.get('[data-testid="date-picker-next"]').trigger('click')
    await nextTick()
    expect(value.value).toBe('10.11.2026')

    const second = await mountField('30.12.2025')
    await openField(second.wrapper)
    await changeSelect(second.wrapper, 'year', 2026)
    expect(second.value.value).toBe('10.11.2026')
    expect(selectValue(second.wrapper, 'month')).toBe('11')
  })

  it('without a typed day, month change only changes the shown month, field untouched', async () => {
    const { wrapper, value } = await mountField()
    await openField(wrapper)
    await changeSelect(wrapper, 'year', 1992)
    await changeSelect(wrapper, 'month', 7)
    expect(value.value).toBe('')
    expect(selectValue(wrapper, 'month')).toBe('7')
    expect(selectValue(wrapper, 'year')).toBe('1992')
  })

  it('grid has one day button with tabindex 0, also after month change', async () => {
    const { wrapper } = await mountField('14.07.1992')
    await openField(wrapper)
    await changeSelect(wrapper, 'month', 8)
    const focusable = wrapper.findAll('[data-testid="date-picker-grid"] button[tabindex="0"]')
    expect(focusable).toHaveLength(1)
    expect(focusable[0]!.attributes('data-day')).toBe('14')
  })
})

describe('DateField: confirm button', () => {
  it.each([
    ['', 'пусто'],
    ['14.07.', 'неполная'],
    ['31.02.1990', 'несуществующая'],
    ['01.01.1899', 'раньше 1900'],
    ['11.11.2026', 'в будущем'],
  ])('%j (%s): aria-disabled, click neither closes nor commits', async (text) => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    if (text) await edit(wrapper, text)
    expect(confirmButton(wrapper).attributes('aria-disabled')).toBe('true')
    await confirmButton(wrapper).trigger('click')
    await nextTick()
    expect(picker(wrapper).exists()).toBe(true)
  })

  it('full valid date: enabled', async () => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    await edit(wrapper, '14.07.1992')
    expect(confirmButton(wrapper).attributes('aria-disabled')).toBeUndefined()
  })
})

describe('DateField: closing without confirm', () => {
  it('calendar changes are reverted (Escape)', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await day(wrapper, 20).trigger('click')
    await changeSelect(wrapper, 'month', 3)
    expect(value.value).toBe('20.03.1992')
    await input(wrapper).trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(picker(wrapper).exists()).toBe(false)
    expect(value.value).toBe('14.07.1992')
  })

  it('calendar changes are reverted when focus moves to an outside element (Tab)', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await day(wrapper, 20).trigger('click')
    const outside = document.createElement('button')
    document.body.append(outside)
    input(wrapper).element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
    outside.remove()
    await nextTick()
    expect(picker(wrapper).exists()).toBe(false)
    expect(value.value).toBe('14.07.1992')
  })

  it('focus leaving the window (native select picker on a phone) keeps the calendar and the chosen month/year', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    const select = wrapper.get('[data-testid="date-picker-month"]')
    select.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    await changeSelect(wrapper, 'month', 3)
    await changeSelect(wrapper, 'year', 1990)
    await nextTick()
    expect(picker(wrapper).exists()).toBe(true)
    expect([selectValue(wrapper, 'month'), selectValue(wrapper, 'year')]).toEqual(['3', '1990'])
    expect(value.value).toBe('14.03.1990')
  })

  it('click outside field and calendar closes and reverts', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await day(wrapper, 20).trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(picker(wrapper).exists()).toBe(false)
    expect(value.value).toBe('14.07.1992')
  })

  it('typed input is kept', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await edit(wrapper, '01.01.2000')
    await input(wrapper).trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(value.value).toBe('01.01.2000')
  })

  it('after confirm, value survives reopening and Escape', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await day(wrapper, 20).trigger('click')
    await confirmButton(wrapper).trigger('click')
    await nextTick()
    await input(wrapper).trigger('click')
    await nextTick()
    await input(wrapper).trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(value.value).toBe('20.07.1992')
  })
})

describe('DateField: clicks inside the calendar', () => {
  // mousedown с отменой по умолчанию — фокус не уходит из поля, календарь не закрывается
  const mousedownPrevented = (element: Element) =>
    !element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))

  it('disabled day, disabled arrow, confirm button, panel background do not steal focus', async () => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    expect(day(wrapper, 25).attributes('aria-disabled')).toBe('true')
    expect(mousedownPrevented(day(wrapper, 25).element)).toBe(true)
    expect(mousedownPrevented(wrapper.get('[data-testid="date-picker-next"]').element)).toBe(true)
    expect(mousedownPrevented(confirmButton(wrapper).element)).toBe(true)
    expect(mousedownPrevented(picker(wrapper).element)).toBe(true)
  })

  it('month and year selects receive focus (mousedown not prevented)', async () => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    expect(mousedownPrevented(wrapper.get('[data-testid="date-picker-month"]').element)).toBe(false)
    expect(mousedownPrevented(wrapper.get('[data-testid="date-picker-year"]').element)).toBe(false)
  })

  it('click on a disabled day changes nothing and keeps the calendar open', async () => {
    const { wrapper, value } = await mountField('01.11.2026')
    await openField(wrapper)
    await day(wrapper, 25).trigger('click')
    document.querySelector('[data-day="25"]')!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(value.value).toBe('01.11.2026')
    expect(picker(wrapper).exists()).toBe(true)
  })

  it('document pointerdown listener exists only while the calendar is open', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const pointerdownCalls = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === 'pointerdown').length

    const { wrapper } = await mountField()
    expect(pointerdownCalls(add)).toBe(0)
    await openField(wrapper)
    expect(pointerdownCalls(add)).toBe(1)
    await input(wrapper).trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(pointerdownCalls(remove)).toBeGreaterThanOrEqual(1)
  })
})

describe('DateField: pointer type', () => {
  const mockPointer = (coarse: boolean) => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: coarse && query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList)
  }

  it('mouse: field is editable, numeric keyboard', async () => {
    mockPointer(false)
    const { wrapper } = await mountField()
    await nextTick()
    expect(input(wrapper).attributes('readonly')).toBeUndefined()
    expect(input(wrapper).attributes('inputmode')).toBe('numeric')
  })

  it('touch (pointer: coarse): field is read-only without on-screen keyboard; calendar opens', async () => {
    mockPointer(true)
    const { wrapper, value } = await mountField()
    await nextTick()
    expect(input(wrapper).attributes('readonly')).toBeDefined()
    expect(input(wrapper).attributes('inputmode')).toBe('none')
    await openField(wrapper)
    expect(picker(wrapper).exists()).toBe(true)
    await day(wrapper, 5).trigger('click')
    await confirmButton(wrapper).trigger('click')
    await nextTick()
    expect(value.value).toBe('05.11.2026')
  })

  it('touch: tap on the field focuses without native scroll and opens the calendar', async () => {
    mockPointer(true)
    const { wrapper } = await mountField()
    await nextTick()
    const element = input(wrapper).element
    const focus = vi.spyOn(element, 'focus')
    // PointerEvent в happy-dom может не быть — тип касания задаётся полем события
    const event = vtsFix(Object.assign(new Event('pointerdown', { bubbles: true, cancelable: true }), { pointerType: 'touch' }))
    element.dispatchEvent(event)
    await nextTick()
    await nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(document.activeElement).toBe(element)
    expect(picker(wrapper).exists()).toBe(true)
  })

  it('mouse: pointerdown on the field keeps the native behaviour', async () => {
    mockPointer(false)
    const { wrapper } = await mountField()
    await nextTick()
    const event = vtsFix(Object.assign(new Event('pointerdown', { bubbles: true, cancelable: true }), { pointerType: 'mouse' }))
    input(wrapper).element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

// ---- Раунд 3: правка клавишами (keydown), повторное открытие, Enter, тач с физической клавиатурой, aria-live ----

// Нажатие клавиши в поле как в браузере: keydown; если не отменён и клавиша печатная — браузер вставляет символ
// на место выделения и шлёт input (так в поле попадает точка, которую editBirthDateByKey не обработал)
// vtsFix (tests/helpers) — иначе при замороженном Date обработчик на корне DateField (Escape) не сработал бы
const pressKey = async (wrapper: VueWrapper, key: string, caret?: number) => {
  const element = input(wrapper).element
  if (caret !== undefined) element.setSelectionRange(caret, caret)
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  vtsFix(event)
  element.dispatchEvent(event)
  if (!event.defaultPrevented && key.length === 1 && !element.readOnly) {
    const start = element.selectionStart ?? element.value.length
    const end = element.selectionEnd ?? start
    element.value = element.value.slice(0, start) + key + element.value.slice(end)
    element.setSelectionRange(start + 1, start + 1)
    const inputEvent = new Event('input', { bubbles: true })
    vtsFix(inputEvent)
    element.dispatchEvent(inputEvent)
  }
  await nextTick()
  await nextTick()
  return event
}

const typeKeys = async (wrapper: VueWrapper, keys: string) => {
  for (const key of keys) await pressKey(wrapper, key)
}

describe('DateField: key editing (keydown)', () => {
  it('full date, overwrite mode: digit replaces the digit after caret, caret moves past it', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    const event = await pressKey(wrapper, '2', 0)
    expect(event.defaultPrevented).toBe(true)
    expect(value.value).toBe('24.07.1992')
    expect(input(wrapper).element.value).toBe('24.07.1992')
    expect(input(wrapper).element.selectionStart).toBe(1)
    // курсор перед точкой — заменяется первая цифра месяца
    await pressKey(wrapper, '1', 2)
    expect(value.value).toBe('24.17.1992')
    expect(input(wrapper).element.selectionStart).toBe(4)
  })

  it('caret at end of full date: digit changes nothing', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await pressKey(wrapper, '5', 10)
    expect(value.value).toBe('14.07.1992')
  })

  it('«1.» → «01.», «01.3.» → «01.03.»', async () => {
    const { wrapper, value } = await mountField()
    await openField(wrapper)
    await typeKeys(wrapper, '1.')
    expect(value.value).toBe('01.')
    await typeKeys(wrapper, '3.')
    expect(value.value).toBe('01.03.')
    expect(input(wrapper).element.selectionStart).toBe(6)
  })

  it('«0.»: dot is dropped (also in month)', async () => {
    const { wrapper, value } = await mountField()
    await openField(wrapper)
    await typeKeys(wrapper, '0.')
    expect(value.value).toBe('0')
    await typeKeys(wrapper, '1.0.')
    expect(value.value).toBe('01.0')
  })

  it('typing digits inserts dots automatically; calendar follows input', async () => {
    const { wrapper, value } = await mountField()
    await openField(wrapper)
    await typeKeys(wrapper, '14071992')
    expect(value.value).toBe('14.07.1992')
    expect([selectValue(wrapper, 'month'), selectValue(wrapper, 'year')]).toEqual(['7', '1992'])
    expect(pressedDays(wrapper)).toEqual(['14'])
  })

  it('keys with Ctrl/Meta/Alt are not handled (paste, select all)', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    const event = new KeyboardEvent('keydown', { key: '1', ctrlKey: true, bubbles: true, cancelable: true })
    vtsFix(event)
    input(wrapper).element.dispatchEvent(event)
    await nextTick()
    expect(event.defaultPrevented).toBe(false)
    expect(value.value).toBe('14.07.1992')
  })
})

describe('DateField: reopening on keyboard edit', () => {
  it('after confirm (Enter), a digit reopens the calendar', async () => {
    const { wrapper, value } = await mountField()
    await openField(wrapper)
    await typeKeys(wrapper, '14071992')
    await pressKey(wrapper, 'Enter')
    expect(picker(wrapper).exists()).toBe(false)

    await pressKey(wrapper, '2', 0)
    expect(picker(wrapper).exists()).toBe(true)
    expect(value.value).toBe('24.07.1992')
  })

  it('after Escape, Backspace reopens the calendar', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await pressKey(wrapper, 'Escape')
    expect(picker(wrapper).exists()).toBe(false)
    await pressKey(wrapper, 'Backspace', 10)
    expect(picker(wrapper).exists()).toBe(true)
    expect(value.value).toBe('14.07.199')
  })

  it('edit via input (paste) with closed calendar also opens it', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await pressKey(wrapper, 'Escape')
    await edit(wrapper, '01/01/2000')
    expect(picker(wrapper).exists()).toBe(true)
    expect(value.value).toBe('01.01.2000')
  })

  it('key without value change (digit at end of full date, dot without padding) does not open the calendar', async () => {
    const { wrapper } = await mountField('14.07.1992')
    await openField(wrapper)
    await pressKey(wrapper, 'Escape')
    await pressKey(wrapper, '5', 10)
    expect(picker(wrapper).exists()).toBe(false)
  })

  it('input typed after reopening is committed: Escape does not revert it', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await pressKey(wrapper, 'Escape')
    await pressKey(wrapper, '2', 0)
    await pressKey(wrapper, 'Escape')
    expect(picker(wrapper).exists()).toBe(false)
    expect(value.value).toBe('24.07.1992')
  })
})

describe('DateField: Enter with open calendar', () => {
  it('full valid date: confirms; calendar closed, calendar value committed, no submit', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await day(wrapper, 20).trigger('click')
    input(wrapper).element.focus()
    const event = await pressKey(wrapper, 'Enter')
    // preventDefault — неявная отправка формы не происходит
    expect(event.defaultPrevented).toBe(true)
    expect(picker(wrapper).exists()).toBe(false)
    expect(value.value).toBe('20.07.1992')
    expect(document.activeElement).toBe(input(wrapper).element)

    // зафиксировано: новое открытие и Escape не откатывают
    await input(wrapper).trigger('click')
    await nextTick()
    await pressKey(wrapper, 'Escape')
    expect(value.value).toBe('20.07.1992')
  })

  it('incomplete or invalid date: calendar closes without confirm, Enter not prevented (form submits)', async () => {
    for (const text of ['14.07.', '31.02.1990', '11.11.2026']) {
      const { wrapper, value } = await mountField()
      await openField(wrapper)
      await edit(wrapper, text)
      const event = await pressKey(wrapper, 'Enter')
      expect(event.defaultPrevented).toBe(false)
      expect(picker(wrapper).exists()).toBe(false)
      expect(value.value).toBe(text)
    }
  })

  it('incomplete input, then a day picked in calendar (July 1992 shown): Enter confirms the full calendar date', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await openField(wrapper)
    await edit(wrapper, '14.07.')
    await day(wrapper, 3).trigger('click')
    expect(value.value).toBe('03.07.1992')
    // дата из календаря полная — Enter её подтверждает
    await pressKey(wrapper, 'Enter')
    expect(value.value).toBe('03.07.1992')
    expect(picker(wrapper).exists()).toBe(false)
  })
})

describe('DateField: external confirm (confirm)', () => {
  const mountWithRef = async (initial: string) => {
    const value = ref(initial)
    const field = ref<{ confirm: () => boolean, focus: () => void }>()
    const Host = defineComponent({
      setup: () => () => h(DateField, {
        'ref': field,
        'id': 'test-date',
        'label': 'label',
        'modelValue': value.value,
        'onUpdate:modelValue': (next: string) => {
          value.value = next
        },
      }),
    })
    const wrapper = await mountSuspended(Host, { attachTo: document.body })
    wrappers.push(wrapper)
    return { wrapper, value, field }
  }

  it('open calendar with full date: true, value committed, calendar closed', async () => {
    const { wrapper, value, field } = await mountWithRef('14.07.1992')
    await openField(wrapper)
    await day(wrapper, 20).trigger('click')
    expect(field.value!.confirm()).toBe(true)
    await nextTick()
    expect(picker(wrapper).exists()).toBe(false)
    expect(value.value).toBe('20.07.1992')
  })

  it('calendar closed or date incomplete: false, nothing changes', async () => {
    const { wrapper, value, field } = await mountWithRef('14.07.1992')
    expect(field.value!.confirm()).toBe(false)
    await openField(wrapper)
    await edit(wrapper, '14.07.')
    expect(field.value!.confirm()).toBe(false)
    await nextTick()
    expect(picker(wrapper).exists()).toBe(true)
    expect(value.value).toBe('14.07.')
  })

  it('focus() focuses the field without opening the calendar', async () => {
    const { wrapper, field } = await mountWithRef('')
    field.value!.focus()
    await nextTick()
    expect(document.activeElement).toBe(input(wrapper).element)
    expect(picker(wrapper).exists()).toBe(false)
  })
})

describe('DateField: touch with physical keyboard', () => {
  it('field is read-only, but digits, dot and Backspace work via keydown; edit opens the calendar', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList)
    const { wrapper, value } = await mountField()
    await nextTick()
    expect(input(wrapper).attributes('readonly')).toBeDefined()
    await openField(wrapper)
    await typeKeys(wrapper, '1.07')
    expect(value.value).toBe('01.07.')
    await pressKey(wrapper, 'Backspace')
    expect(value.value).toBe('01.0')
    await pressKey(wrapper, 'Escape')
    expect(picker(wrapper).exists()).toBe(false)
    await pressKey(wrapper, '7')
    expect(picker(wrapper).exists()).toBe(true)
    expect(value.value).toBe('01.07.')
  })
})

describe('DateField: error line', () => {
  it('aria-live="polite" is in markup even without an error (space reserved)', async () => {
    const { wrapper } = await mountField()
    const line = input(wrapper).element.closest('div')!.parentElement!.querySelector('p[aria-live]')
    expect(line).not.toBeNull()
    expect(line!.getAttribute('aria-live')).toBe('polite')
  })
})

// ---- Раунд 4: навигация по типу указателя, ширина при мыши, прокрутка к календарю под полем ----
// matchMedia: совпадают запросы, содержащие одну из строк
const mockMedia = (matching: string[]) => vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
  matches: matching.some(part => query.includes(part)),
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}) as MediaQueryList)

const navOrder = (wrapper: VueWrapper) => wrapper.findAll('[data-testid="date-picker"] :is(select, button)')
  .map(element => element.attributes('data-testid')?.replace('date-picker-', ''))
  .filter(name => name === 'prev' || name === 'month' || name === 'year' || name === 'next')

describe('DateField: calendar navigation and width', () => {
  it.each([
    ['мышь', []],
    ['тач', ['pointer: coarse']],
  ])('%s: single row ‹, month, year, ›', async (_, media) => {
    mockMedia(media)
    const { wrapper } = await mountField('14.07.1992')
    await nextTick()
    await openField(wrapper)
    expect(navOrder(wrapper)).toEqual(['prev', 'month', 'year', 'next'])
  })

  it('calendar not narrower than content and (any pointer) not wider than viewport minus page padding; on touch sized to content; on phone centered on field', async () => {
    const { wrapper } = await mountField()
    await openField(wrapper)
    const classes = picker(wrapper).classes()
    expect(classes).toContain('min-w-min')
    expect(classes).toContain('pointer-coarse:w-max')
    expect(classes.some(name => name.startsWith('max-w-[calc(100vw'))).toBe(true)
    expect(classes).toContain('pointer-coarse:max-sm:left-1/2')
    expect(classes).toContain('pointer-coarse:max-sm:-translate-x-1/2')
  })
})

describe('DateField: placement and scrolling to the calendar', () => {
  // Раскладка в happy-dom не считается: поле (его блок) на fieldTop от верха окна, высота поля 52,
  // календарь высотой 386 над полем (bottom-full) или под ним (top-full), отступ от поля 8
  const mockLayout = (fieldTop: number) => {
    const isPanel = (element: HTMLElement) => element.dataset.testid === 'date-picker'
    // offsetParent в happy-dom нет: задаётся на время теста (родитель — блок поля с position: relative)
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get(this: HTMLElement) {
        return this.parentElement
      },
    })
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
      if (!isPanel(this)) return 0
      return this.classList.contains('bottom-full') ? -(386 + 8) : 52 + 8
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
      { top: fieldTop, bottom: fieldTop + 52, left: 0, right: 0, width: 0, height: 52, x: 0, y: fieldTop } as DOMRect)
    return vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
  }

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'offsetParent')
  })

  // Проверка видимости — после анимации появления (after-enter): ждём конца перехода
  const openAndSettle = async (wrapper: VueWrapper) => {
    await openField(wrapper)
    await vi.waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
  }

  it('fits above the field: opens above; visibility ensured with the minimal scroll (block nearest, smooth)', async () => {
    mockMedia(['pointer: coarse'])
    const scrollIntoView = mockLayout(450)
    const { wrapper } = await mountField('', { realTransition: true })
    await openAndSettle(wrapper)
    expect(picker(wrapper).classes()).toContain('bottom-full')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' })
    expect(scrollIntoView.mock.contexts[0]).toBe(picker(wrapper).element)
  })

  it('does not fit above: opens below; prefers-reduced-motion — without animation', async () => {
    mockMedia(['pointer: coarse', 'prefers-reduced-motion: reduce'])
    const scrollIntoView = mockLayout(250)
    const { wrapper } = await mountField('', { realTransition: true })
    await openAndSettle(wrapper)
    expect(picker(wrapper).classes()).toContain('top-full')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'instant' })
  })
})
