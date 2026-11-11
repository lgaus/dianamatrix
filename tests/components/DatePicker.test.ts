// Тесты календаря (шаг 6): DatePicker — недоступные дни вне 1900…max, быстрый выбор года и месяца,
// выбор дня и «Подтвердить»; DateField — открытие при фокусе, синхронизация с вводом, выбор в календаре сразу в поле,
// «Подтвердить» фиксирует и закрывает, Escape возвращает прежнее значение. Формулировки не проверяются.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import DatePicker from '~/components/DatePicker.vue'
import DateField from '~/components/DateField.vue'
import { disabledFillClass } from '~/config/feedback'
import type { BirthDate } from '~/utils/matrix/types'
import { formatBirthDate, MAX_MONTH_WEEKS, parseBirthDateParts } from '~/utils/date/birthDate'

const max: BirthDate = { day: 10, month: 11, year: 2026 }

const wrappers: VueWrapper[] = []

afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
  vi.restoreAllMocks()
})

// Календарь как в DateField: части даты из текста поля; выбор (select) вписывается в «поле»
const partsOf = (date: BirthDate | null) => parseBirthDateParts(date ? formatBirthDate(date) : '', max)

const mountPicker = async (initial: BirthDate | null) => {
  const wrapper = await mountSuspended(DatePicker, {
    props: {
      id: 'test-calendar',
      max,
      parts: partsOf(initial),
      confirmable: initial !== null,
      onSelect: (date: BirthDate) => wrapper.setProps({ parts: partsOf(date), confirmable: true }),
    },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

const day = (wrapper: VueWrapper, number: number) => wrapper.get(`[data-testid="date-picker-grid"] [data-day="${number}"]`)
const select = (wrapper: VueWrapper, name: 'month' | 'year') => wrapper.get<HTMLSelectElement>(`[data-testid="date-picker-${name}"]`)

describe('DatePicker', () => {
  it('shows the month of the selected date; selected day is aria-pressed', async () => {
    const wrapper = await mountPicker({ day: 14, month: 7, year: 1992 })
    expect(select(wrapper, 'year').element.value).toBe('1992')
    expect(select(wrapper, 'month').element.value).toBe('7')
    expect(day(wrapper, 14).attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(1)
  })

  it('without a date shows the max month, no selected day', async () => {
    const wrapper = await mountPicker(null)
    expect(select(wrapper, 'year').element.value).toBe(String(max.year))
    expect(select(wrapper, 'month').element.value).toBe(String(max.month))
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(0)
  })

  it('days after max are disabled and not selectable; max and earlier are enabled', async () => {
    const wrapper = await mountPicker(null)
    expect(day(wrapper, 10).attributes('aria-disabled')).toBeUndefined()
    expect(day(wrapper, 11).attributes('aria-disabled')).toBe('true')
    expect(day(wrapper, 30).attributes('aria-disabled')).toBe('true')
    await day(wrapper, 11).trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('next month disabled in the max month, previous in January 1900', async () => {
    const atMax = await mountPicker(null)
    expect(atMax.get('[data-testid="date-picker-next"]').attributes('aria-disabled')).toBe('true')
    expect(atMax.get('[data-testid="date-picker-prev"]').attributes('aria-disabled')).toBeUndefined()

    const atMin = await mountPicker({ day: 1, month: 1, year: 1900 })
    expect(atMin.get('[data-testid="date-picker-prev"]').attributes('aria-disabled')).toBe('true')
    expect(atMin.get('[data-testid="date-picker-next"]').attributes('aria-disabled')).toBeUndefined()
  })

  it('year: all years from max to 1900; months after max disabled in the max year', async () => {
    const wrapper = await mountPicker(null)
    const years = select(wrapper, 'year').findAll('option').map(option => Number(option.attributes('value')))
    expect(years[0]).toBe(max.year)
    expect(years.at(-1)).toBe(1900)
    expect(years).toHaveLength(max.year - 1900 + 1)
    const disabledMonths = select(wrapper, 'month').findAll('option')
      .filter(option => option.attributes('disabled') !== undefined)
      .map(option => Number(option.attributes('value')))
    expect(disabledMonths).toEqual([12])
  })

  it('quick year and month selection switches the grid without paging', async () => {
    const wrapper = await mountPicker(null)
    await select(wrapper, 'year').setValue('1992')
    await select(wrapper, 'month').setValue('7')
    await nextTick()
    expect(select(wrapper, 'year').element.value).toBe('1992')
    expect(select(wrapper, 'month').element.value).toBe('7')
    // Июль 1992: 31 день, все доступны
    expect(wrapper.findAll('[data-testid="date-picker-grid"] button')).toHaveLength(31)
    expect(wrapper.findAll('[data-testid="date-picker-grid"] button[aria-disabled]')).toHaveLength(0)
  })

  it('month arrows cross the year boundary', async () => {
    const wrapper = await mountPicker({ day: 15, month: 1, year: 1993 })
    await wrapper.get('[data-testid="date-picker-prev"]').trigger('click')
    expect(select(wrapper, 'year').element.value).toBe('1992')
    expect(select(wrapper, 'month').element.value).toBe('12')
    await wrapper.get('[data-testid="date-picker-next"]').trigger('click')
    expect(select(wrapper, 'year').element.value).toBe('1993')
    expect(select(wrapper, 'month').element.value).toBe('1')
  })

  it('clicking a day selects the date; confirm button emits confirm', async () => {
    const wrapper = await mountPicker({ day: 14, month: 7, year: 1992 })
    await day(wrapper, 20).trigger('click')
    expect(wrapper.emitted('select')!.at(-1)).toEqual([{ day: 20, month: 7, year: 1992 }])
    expect(wrapper.emitted('confirm')).toBeUndefined()
    await wrapper.get('[data-testid="date-picker-confirm"]').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('every day has an accessible name; grid has one day button with tabindex 0', async () => {
    const wrapper = await mountPicker({ day: 14, month: 7, year: 1992 })
    const buttons = wrapper.findAll('[data-testid="date-picker-grid"] button')
    for (const button of buttons) expect(button.attributes('aria-label')).toBeTruthy()
    expect(buttons.filter(button => button.attributes('tabindex') === '0')).toHaveLength(1)
    expect(day(wrapper, 14).attributes('tabindex')).toBe('0')
  })

  // Раскладки в happy-dom нет: max-width календаря и ширина строки навигации в одну строку (её копия
  // шириной min-content) подставляются в getComputedStyle
  const mockNavWidths = (maxWidth: string, oneLineWidth: string) => {
    const realGetComputedStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = realGetComputedStyle(element, pseudo)
      const overrides: Record<string, string> = {}
      if ((element as HTMLElement).dataset.testid === 'date-picker') overrides.maxWidth = maxWidth
      if ((element as HTMLElement).style.width === 'min-content') overrides.width = oneLineWidth
      return new Proxy(style, { get: (target, key) => overrides[key as string] ?? Reflect.get(target, key) })
    })
  }

  const navOrder = (wrapper: VueWrapper) => wrapper.get('[data-testid="date-picker-nav"]').element.children
  const navIds = (wrapper: VueWrapper) => [...navOrder(wrapper)].map(element =>
    (element.matches('[data-testid]') ? element : element.querySelector('[data-testid]'))!.getAttribute('data-testid'))

  it('navigation fits: single row (flex), no data-wrapped', async () => {
    mockNavWidths('300px', '270px')
    const wrapper = await mountPicker(null)
    const nav = wrapper.get('[data-testid="date-picker-nav"]')
    expect(nav.attributes('data-wrapped')).toBeUndefined()
    expect(nav.classes()).toContain('flex')
    expect(navIds(wrapper)).toEqual(['date-picker-prev', 'date-picker-month', 'date-picker-year', 'date-picker-next'])
  })

  it('without calendar max-width, navigation does not wrap', async () => {
    mockNavWidths('none', '900px')
    const wrapper = await mountPicker(null)
    expect(wrapper.get('[data-testid="date-picker-nav"]').attributes('data-wrapped')).toBeUndefined()
  })

  it('navigation does not fit: wraps, arrows on first row at edges, month and year on second; Tab order unchanged', async () => {
    mockNavWidths('300px', '400px')
    const wrapper = await mountPicker(null)
    const nav = wrapper.get('[data-testid="date-picker-nav"]')
    expect(nav.attributes('data-wrapped')).toBeDefined()
    // Сетка из двух колонок: месяц (не уже названия) и колонка года / стрелки «следующий»
    expect(nav.classes()).toEqual(expect.arrayContaining(['group/nav', 'data-wrapped:grid', 'data-wrapped:grid-cols-[minmax(min-content,1fr)_auto]']))
    const [prev, month, year, next] = [...navOrder(wrapper)]
    // Предыдущий месяц — первая свободная ячейка (строка 1, колонка 1): без явного места
    expect(prev!.className).not.toContain('group-data-wrapped/nav:')
    expect(next!.classList).toContain('group-data-wrapped/nav:row-start-1')
    expect(next!.classList).toContain('group-data-wrapped/nav:col-start-2')
    expect(next!.classList).toContain('group-data-wrapped/nav:justify-self-end')
    expect(month!.classList).toContain('group-data-wrapped/nav:row-start-2')
    expect(month!.classList).toContain('group-data-wrapped/nav:col-start-1')
    expect(year!.classList).toContain('group-data-wrapped/nav:row-start-2')
    expect(year!.classList).toContain('group-data-wrapped/nav:col-start-2')
    // Порядок в разметке (и Tab) не меняется: ‹ → месяц → год → ›
    expect(navIds(wrapper)).toEqual(['date-picker-prev', 'date-picker-month', 'date-picker-year', 'date-picker-next'])
    // Копия для замера удалена
    expect(wrapper.findAll('[data-testid="date-picker-nav"]')).toHaveLength(1)
  })

  it('calendar popup: role=dialog with an accessible name', async () => {
    const wrapper = await mountPicker(null)
    const dialog = wrapper.get('[data-testid="date-picker"]')
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-label')).toBeTruthy()
  })
})

describe('DateField', () => {
  const mountField = async (initial = '') => {
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
    const wrapper = await mountSuspended(Host, { attachTo: document.body })
    wrappers.push(wrapper)
    return { wrapper, value }
  }

  const input = (wrapper: VueWrapper) => wrapper.get<HTMLInputElement>('#test-date')
  const picker = (wrapper: VueWrapper) => wrapper.find('[data-testid="date-picker"]')

  it('focus opens the calendar; aria-expanded and aria-controls', async () => {
    const { wrapper } = await mountField()
    expect(input(wrapper).attributes('aria-expanded')).toBe('false')
    expect(picker(wrapper).exists()).toBe(false)
    await input(wrapper).trigger('focus')
    await nextTick()
    expect(picker(wrapper).exists()).toBe(true)
    expect(input(wrapper).attributes('aria-expanded')).toBe('true')
    expect(input(wrapper).attributes('aria-controls')).toBe(picker(wrapper).attributes('id'))
  })

  it('typed date is highlighted in the calendar at once', async () => {
    const { wrapper } = await mountField()
    await input(wrapper).trigger('focus')
    await input(wrapper).setValue('14071992')
    await nextTick()
    await nextTick()
    expect(input(wrapper).element.value).toBe('14.07.1992')
    expect(wrapper.get('[aria-pressed="true"]').attributes('data-day')).toBe('14')
    expect(wrapper.get<HTMLSelectElement>('[data-testid="date-picker-year"]').element.value).toBe('1992')
  })

  it('picking a day updates the field at once; confirm commits the date and closes the calendar', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await input(wrapper).trigger('focus')
    await nextTick()
    await wrapper.get('[data-testid="date-picker-grid"] [data-day="20"]').trigger('click')
    expect(value.value).toBe('20.07.1992')
    await wrapper.get('[data-testid="date-picker-confirm"]').trigger('click')
    await nextTick()
    expect(value.value).toBe('20.07.1992')
    expect(picker(wrapper).exists()).toBe(false)
  })

  it('Escape closes the calendar and restores the value from before opening', async () => {
    const { wrapper, value } = await mountField('14.07.1992')
    await input(wrapper).trigger('focus')
    await nextTick()
    await wrapper.get('[data-testid="date-picker-grid"] [data-day="20"]').trigger('click')
    await input(wrapper).trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(picker(wrapper).exists()).toBe(false)
    expect(value.value).toBe('14.07.1992')
  })

  it('focus moving to an outside element closes the calendar', async () => {
    const { wrapper } = await mountField()
    await input(wrapper).trigger('focus')
    await nextTick()
    const outside = document.createElement('button')
    document.body.append(outside)
    input(wrapper).element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
    outside.remove()
    await nextTick()
    expect(picker(wrapper).exists()).toBe(false)
  })
})

// ---- Раунд 3–5: навигация календаря ----
// Порядок элементов навигации в разметке — он же порядок Tab и диктора
const navOrder = (wrapper: VueWrapper) => wrapper.findAll('[data-testid="date-picker"] :is(select, button)')
  .map(element => element.attributes('data-testid')?.replace('date-picker-', ''))
  .filter(name => name === 'prev' || name === 'month' || name === 'year' || name === 'next')

describe('DatePicker: navigation row', () => {
  it('single row: ‹, month, year, › in one block, then grid with weekdays', async () => {
    const wrapper = await mountPicker({ day: 14, month: 7, year: 1992 })
    expect(navOrder(wrapper)).toEqual(['prev', 'month', 'year', 'next'])
    const nav = wrapper.get('[data-testid="date-picker-prev"]').element.parentElement!
    // селекты — в своих обёртках (CalendarSelect) внутри того же блока
    for (const name of ['month', 'year', 'next']) {
      expect(nav.contains(wrapper.get(`[data-testid="date-picker-${name}"]`).element)).toBe(true)
    }
    expect(nav.classList.contains('flex')).toBe(true)
    const grid = wrapper.get('[data-testid="date-picker-grid"]').element
    expect(!!(wrapper.get('[data-testid="date-picker-next"]').element.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    // подписи дней недели — в шапке таблицы, 7 колонок
    expect(grid.querySelectorAll('thead th')).toHaveLength(7)
  })

  it('touch: arrows 40 × 40 (pointer-coarse:size-10), day button smaller; row pitch as on desktop (h-8)', async () => {
    const wrapper = await mountPicker({ day: 14, month: 7, year: 1992 })
    expect(wrapper.get('[data-testid="date-picker-prev"]').classes()).toContain('pointer-coarse:size-10')
    expect(wrapper.get('[data-testid="date-picker-next"]').classes()).toContain('pointer-coarse:size-10')
    const dayClasses = day(wrapper, 14).classes()
    expect(dayClasses).toContain('size-8')
    expect(dayClasses.some(name => /^pointer-coarse:(?:h|size)-/.test(name))).toBe(false)
  })
})

// ---- Раунд 5: постоянная высота сетки ----
describe('DatePicker: grid always has six weeks', () => {
  // Февраль 2021 — 4 недели, сентябрь 2020 — 5, ноябрь 2026 — 6
  it.each([
    [{ day: 1, month: 2, year: 2021 }, 4],
    [{ day: 1, month: 9, year: 2020 }, 5],
    [{ day: 1, month: 11, year: 2026 }, 6],
  ])('%j: MAX_MONTH_WEEKS rows, %i with days; empty rows have no buttons, hidden from screen readers', async (date, dayWeeks) => {
    const wrapper = await mountPicker(date)
    const rows = wrapper.findAll('[data-testid="date-picker-grid"] tbody tr')
    expect(rows).toHaveLength(MAX_MONTH_WEEKS)
    const fillers = wrapper.findAll('[data-testid="date-picker-filler-week"]')
    expect(fillers).toHaveLength(MAX_MONTH_WEEKS - dayWeeks)
    for (const filler of fillers) {
      expect(filler.attributes('aria-hidden')).toBe('true')
      expect(filler.find('button').exists()).toBe(false)
      expect(filler.text()).toBe('')
    }
  })

  it('month change does not change the row count', async () => {
    const wrapper = await mountPicker({ day: 1, month: 11, year: 2026 })
    const rowCount = () => wrapper.findAll('[data-testid="date-picker-grid"] tbody tr').length
    expect(rowCount()).toBe(MAX_MONTH_WEEKS)
    await wrapper.get<HTMLSelectElement>('[data-testid="date-picker-year"]').setValue('2021')
    await wrapper.get<HTMLSelectElement>('[data-testid="date-picker-month"]').setValue('2')
    await nextTick()
    expect(wrapper.findAll('[data-testid="date-picker-grid"] [data-day]')).toHaveLength(28)
    expect(rowCount()).toBe(MAX_MONTH_WEEKS)
  })
})

// Неактивная «Подтвердить» — общий класс неактивной кнопки с фоном (как «Рассчитать»); активная — акцентная
describe('DatePicker: confirm button look', () => {
  const classesOf = (value: string | string[]) => (Array.isArray(value) ? value.join(' ') : value).split(/\s+/).filter(Boolean)

  it('inactive: disabledFillClass, no accent background', async () => {
    const wrapper = await mountPicker(null)
    const confirm = wrapper.get('[data-testid="date-picker-confirm"]')
    expect(confirm.classes()).toEqual(expect.arrayContaining(classesOf(disabledFillClass)))
    expect(confirm.classes()).not.toContain('bg-accent')
  })

  it('active: accent background, no inactive classes', async () => {
    const wrapper = await mountPicker({ day: 14, month: 7, year: 1992 })
    const confirm = wrapper.get('[data-testid="date-picker-confirm"]')
    expect(confirm.classes()).toEqual(expect.arrayContaining(['bg-accent', 'text-surface']))
    for (const cls of classesOf(disabledFillClass)) expect(confirm.classes()).not.toContain(cls)
  })
})
