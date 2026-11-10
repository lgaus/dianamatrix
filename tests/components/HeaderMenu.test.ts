// Тесты HeaderMenu (шаг 5): бургер и выпадающее меню, открытие — через v-model:open (состоянием владеет родитель).
// Формулировки не проверяются — только атрибуты, события и видимость.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HeaderMenu from '~/components/HeaderMenu.vue'
import { tintPressedClass } from '~/config/feedback'

// Меню скрывается через v-show (display: none); isVisible() без монтирования в document ненадёжен
const isShown = (element: Element): boolean => (element as HTMLElement).style.display !== 'none'

describe('HeaderMenu', () => {
  it('закрыто: aria-expanded=false, меню скрыто, кнопка связана с меню', async () => {
    const wrapper = await mountSuspended(HeaderMenu, { props: { open: false }, route: '/' })
    const button = wrapper.get('[data-testid="header-menu-button"]')
    const menu = wrapper.get('[data-testid="header-menu"]')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe(menu.attributes('id'))
    expect(isShown(menu.element)).toBe(false)
  })

  it('открыто: aria-expanded=true, меню видно', async () => {
    const wrapper = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })

    expect(wrapper.get('[data-testid="header-menu-button"]').attributes('aria-expanded')).toBe('true')
    expect(isShown(wrapper.get('[data-testid="header-menu"]').element)).toBe(true)
  })

  it('клик по кнопке отправляет update:open с противоположным значением', async () => {
    const closed = await mountSuspended(HeaderMenu, { props: { open: false }, route: '/' })
    await closed.get('[data-testid="header-menu-button"]').trigger('click')
    expect(closed.emitted('update:open')).toEqual([[true]])
    closed.unmount()

    const opened = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })
    await opened.get('[data-testid="header-menu-button"]').trigger('click')
    expect(opened.emitted('update:open')).toEqual([[false]])
  })

  it('бургер: при открытом меню — состояние «нажата» (tintPressedClass), при закрытом — нет', async () => {
    const pressed = tintPressedClass.split(/\s+/).filter(Boolean)

    const opened = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })
    const openClasses = opened.get('[data-testid="header-menu-button"]').classes()
    for (const name of pressed) expect(openClasses).toContain(name)
    opened.unmount()

    const closed = await mountSuspended(HeaderMenu, { props: { open: false }, route: '/' })
    const closedClasses = closed.get('[data-testid="header-menu-button"]').classes()
    for (const name of pressed) expect(closedClasses).not.toContain(name)
  })

  it('бургер — кнопка с доступным именем; иконка скрыта от диктора и меняется при открытии', async () => {
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

  it('клик по ссылке меню отправляет update:open=false', async () => {
    const wrapper = await mountSuspended(HeaderMenu, { props: { open: true }, route: '/' })

    await wrapper.get('[data-testid="header-menu"] a').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
