// Тесты HeaderMenu (шаг 5): бургер и выпадающее меню, открытие — через v-model:open (состоянием владеет родитель).
// Формулировки не проверяются — только атрибуты, события и видимость.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HeaderMenu from '~/components/HeaderMenu.vue'
import { tintPressedClass } from '~/config/feedback'

// Меню скрывается через v-show (display: none); isVisible() без монтирования в document ненадёжен
const isShown = (element: Element): boolean => (element as HTMLElement).style.display !== 'none'

describe('HeaderMenu', () => {
  it('closed: aria-expanded=false, menu hidden, button linked to menu', async () => {
    const wrapper = await mountSuspended(HeaderMenu, { props: { open: false }, route: '/' })
    const button = wrapper.get('[data-testid="header-menu-button"]')
    const menu = wrapper.get('[data-testid="header-menu"]')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe(menu.attributes('id'))
    expect(isShown(menu.element)).toBe(false)
  })

  it('open: aria-expanded=true, menu visible', async () => {
    const wrapper = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })

    expect(wrapper.get('[data-testid="header-menu-button"]').attributes('aria-expanded')).toBe('true')
    expect(isShown(wrapper.get('[data-testid="header-menu"]').element)).toBe(true)
  })

  it('button click emits update:open with the opposite value', async () => {
    const closed = await mountSuspended(HeaderMenu, { props: { open: false }, route: '/' })
    await closed.get('[data-testid="header-menu-button"]').trigger('click')
    expect(closed.emitted('update:open')).toEqual([[true]])
    closed.unmount()

    const opened = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })
    await opened.get('[data-testid="header-menu-button"]').trigger('click')
    expect(opened.emitted('update:open')).toEqual([[false]])
  })

  it('burger: pressed state (tintPressedClass) when menu is open, none when closed', async () => {
    const pressed = tintPressedClass.split(/\s+/).filter(Boolean)

    const opened = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })
    const openClasses = opened.get('[data-testid="header-menu-button"]').classes()
    for (const name of pressed) expect(openClasses).toContain(name)
    opened.unmount()

    const closed = await mountSuspended(HeaderMenu, { props: { open: false }, route: '/' })
    const closedClasses = closed.get('[data-testid="header-menu-button"]').classes()
    for (const name of pressed) expect(closedClasses).not.toContain(name)
  })

  it('burger is a button with an accessible name; icon hidden from screen readers, changes when open', async () => {
    const closed = await mountSuspended(HeaderMenu, { props: { open: false }, route: '/' })
    const button = closed.get('[data-testid="header-menu-button"]')
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('aria-label')?.trim()).toBeTruthy()
    const closedIcon = closed.get('[data-testid="header-menu-icon"]')
    expect(closedIcon.attributes('aria-hidden')).toBe('true')
    const closedIconKind = closedIcon.attributes('data-icon')
    closed.unmount()

    const opened = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })
    expect(opened.get('[data-testid="header-menu-icon"]').attributes('data-icon')).not.toBe(closedIconKind)
  })

  it('booking button closes the menu and opens the contact dialog; focus returns to the burger', async () => {
    const wrapper = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })
    const { isOpen, returnFocusTarget, close } = useContactDialog()

    await wrapper.get('[data-testid="header-menu-cta"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(isOpen.value).toBe(true)
    expect(returnFocusTarget.value).toBe(wrapper.get('[data-testid="header-menu-button"]').element)
    close()
  })

  it('menu link click emits update:open=false', async () => {
    const wrapper = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })

    await wrapper.get('[data-testid="header-menu"] a').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
