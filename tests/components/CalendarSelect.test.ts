// Тесты селекта календаря: своя стрелка вместо нативной, атрибуты и обработчики — на <select>,
// class — на обёртку; рамка фокуса скрыта после нажатия указателем (data-pointer) и возвращается при клавиатуре.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import CalendarSelect from '~/components/CalendarSelect.vue'

const wrappers: VueWrapper[] = []

afterEach(() => {
  vi.restoreAllMocks()
  while (wrappers.length) wrappers.pop()!.unmount()
})

const options = [
  { value: 1, label: 'a' },
  { value: 2, label: 'b' },
  { value: 3, label: 'c', disabled: true },
]

const mountSelect = async (attrs: Record<string, unknown> = {}) => {
  const wrapper = await mountSuspended(CalendarSelect, { props: { options }, attrs, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

describe('CalendarSelect', () => {
  it('options from options (value, disabled); native arrow removed, custom arrow hidden from screen readers', async () => {
    const wrapper = await mountSelect()
    const items = wrapper.findAll('option')
    expect(items.map(option => option.attributes('value'))).toEqual(['1', '2', '3'])
    expect(items[2]!.attributes('disabled')).toBeDefined()
    expect(wrapper.get('select').classes()).toContain('appearance-none')
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
  })

  it('attributes and handlers go to select, class to the wrapper', async () => {
    let changes = 0
    const wrapper = await mountSelect({ 'class': 'outer-class', 'aria-label': 'label', 'data-testid': 'test-select', 'onChange': () => changes++ })
    const select = wrapper.get('select')
    expect(wrapper.classes()).toContain('outer-class')
    expect(select.classes()).not.toContain('outer-class')
    expect(select.attributes('aria-label')).toBe('label')
    expect(select.attributes('data-testid')).toBe('test-select')
    await select.setValue('2')
    expect(changes).toBe(1)
  })

  it('pointer press marks the select (focus ring hidden); key press and blur clear the mark', async () => {
    const wrapper = await mountSelect()
    const select = wrapper.get('select')
    expect(select.classes()).toContain('data-pointer:focus-visible:outline-none')
    expect(select.attributes('data-pointer')).toBeUndefined()

    await select.trigger('pointerdown')
    await nextTick()
    expect(select.attributes('data-pointer')).toBeDefined()
    await select.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(select.attributes('data-pointer')).toBeUndefined()

    await select.trigger('pointerdown')
    await select.trigger('blur')
    await nextTick()
    expect(select.attributes('data-pointer')).toBeUndefined()
  })

  it('window blur (native picker on phone) does not clear the mark', async () => {
    const wrapper = await mountSelect()
    const select = wrapper.get('select')
    await select.trigger('pointerdown')
    vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    await select.trigger('blur')
    await select.trigger('focus')
    await nextTick()
    expect(select.attributes('data-pointer')).toBeDefined()
  })
})
