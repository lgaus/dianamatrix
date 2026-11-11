// Тесты шапки (шаг 5): ссылки навигации зависят от маршрута, бургер (компонент HeaderMenu) переключает меню
// (на /about бургера нет), кнопка записи — кнопка без адреса (действие — шаг 10).
// Формулировки не проверяются — только адреса и атрибуты. Поведение HeaderMenu отдельно — в HeaderMenu.test.ts.
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import AppHeader from '~/components/AppHeader.vue'
import HeaderMenu from '~/components/HeaderMenu.vue'

// Адреса ссылок навигации шапки (включая ссылки в скрытом меню бургера; логотип — всегда на /, не учитывается)
const getHrefs = (wrapper: VueWrapper): string[] =>
  wrapper.findAll('a:not([data-testid="header-logo"])').map(link => link.attributes('href') ?? '')

describe('AppHeader: route navigation', () => {
  it('home page has a link to /about and no link to /', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const hrefs = getHrefs(wrapper)

    expect(wrapper.get('[data-testid="header-nav-link"]').attributes('href')).toBe('/about')
    expect(hrefs).toContain('/about')
    expect(hrefs).not.toContain('/')
  })

  it('on /about no nav links (only logo and booking buttons)', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/about' })

    expect(wrapper.find('[data-testid="header-nav-link"]').exists()).toBe(false)
    expect(getHrefs(wrapper)).toEqual([])
  })

  it.each([
    ['/', ['header-cta', 'header-menu-cta']],
    ['/about', ['header-cta']],
  ])('booking buttons are buttons without href (route %s)', async (route, testIds) => {
    const wrapper = await mountSuspended(AppHeader, { route })

    for (const testId of testIds) {
      const cta = wrapper.get(`[data-testid="${testId}"]`)
      expect(cta.element.tagName).toBe('BUTTON')
      expect(cta.attributes('type')).toBe('button')
      expect(cta.attributes('href')).toBeUndefined()
    }
  })

  it('on /about no burger or menu; booking button visible at all widths (no hidden)', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/about' })
    const ctaNav = wrapper.get('[data-testid="header-cta"]').element.closest('nav')

    expect(wrapper.find('[data-testid="header-menu-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="header-menu"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="header-menu-cta"]').exists()).toBe(false)
    expect(ctaNav?.classList.contains('hidden')).toBe(false)
  })

  it('burger is the HeaderMenu component: present on home, absent on /about', async () => {
    const home = await mountSuspended(AppHeader, { route: '/' })
    expect(home.findComponent(HeaderMenu).exists()).toBe(true)
    home.unmount()

    const about = await mountSuspended(AppHeader, { route: '/about' })
    expect(about.findComponent(HeaderMenu).exists()).toBe(false)
  })

  it('header booking button: short and full texts non-empty, shown on opposite sides of the xs breakpoint', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/about' })
    const short = wrapper.get('[data-testid="header-cta"] [data-testid="header-cta-short"]')
    const full = wrapper.get('[data-testid="header-cta"] [data-testid="header-cta-full"]')

    expect(short.text().trim()).toBeTruthy()
    expect(full.text().trim()).toBeTruthy()
    // Скрытый вариант — display: none (не читается диктором); варианты не видны одновременно
    expect(short.classes()).toContain('xs:hidden')
    expect(full.classes()).toContain('max-xs:hidden')
  })

  it('on home, header booking button hidden below md (burger there)', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const ctaNav = wrapper.get('[data-testid="header-cta"]').element.closest('nav')

    expect(ctaNav?.classList.contains('hidden')).toBe(true)
    expect(wrapper.find('[data-testid="header-menu-button"]').exists()).toBe(true)
  })

  it('logo on home links to /, accessible name is logo text, arch without arrow', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const logo = wrapper.get('[data-testid="header-logo"]')

    expect(logo.element.tagName).toBe('A')
    expect(logo.attributes('href')).toBe('/')
    expect(logo.attributes('aria-label')).toBeUndefined()
    expect(logo.text().trim()).toBeTruthy()
    expect(wrapper.find('[data-testid="header-back-arrow"]').exists()).toBe(false)
  })

  it('logo on /about links to / with arrow; accessible name is hidden text plus visible logo text', async () => {
    // Видимый текст логотипа — как на главной (роутер общий, поэтому главная монтируется и снимается первой)
    const home = await mountSuspended(AppHeader, { route: '/' })
    const visibleText = home.get('[data-testid="header-logo"]').text().trim()
    home.unmount()

    const wrapper = await mountSuspended(AppHeader, { route: '/about' })
    const logo = wrapper.get('[data-testid="header-logo"]')
    const arrow = wrapper.get('[data-testid="header-back-arrow"]')
    const backLabel = wrapper.get('[data-testid="header-back-label"]')

    expect(logo.element.tagName).toBe('A')
    expect(logo.attributes('href')).toBe('/')
    // Имя считается из содержимого: aria-label не перекрывает видимый текст
    expect(logo.attributes('aria-label')).toBeUndefined()
    expect(arrow.attributes('aria-hidden')).toBe('true')
    expect(backLabel.classes()).toContain('sr-only')
    expect(backLabel.text().trim()).toBeTruthy()
    // Скрытый текст стоит перед видимым и отделён от него пробелом
    expect(logo.text().replace(/\s+/g, ' ').trim()).toBe(`${backLabel.text().trim()} ${visibleText}`)
  })

  it('burger menu has the same links and buttons as the nav (home)', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const describeItems = (selector: string): string[] =>
      wrapper.findAll(selector).map(item => `${item.element.tagName}:${item.attributes('href') ?? ''}`)

    expect(describeItems('[data-testid="header-menu"] > a, [data-testid="header-menu"] > button'))
      .toEqual(describeItems('nav:not([data-testid="header-menu"]) > a, nav:not([data-testid="header-menu"]) > button'))
  })
})

// Меню скрывается через v-show (display: none); isVisible() без монтирования в document ненадёжен
const isShown = (element: Element): boolean => (element as HTMLElement).style.display !== 'none'

describe('AppHeader: burger', () => {
  it('button is linked to the menu and has aria-label', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const button = wrapper.get('[data-testid="header-menu-button"]')
    const menu = wrapper.get('[data-testid="header-menu"]')

    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')?.trim()).toBeTruthy()
    expect(menu.attributes('id')).toBeTruthy()
    expect(button.attributes('aria-controls')).toBe(menu.attributes('id'))
  })

  it('click toggles aria-expanded and menu visibility', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const button = wrapper.get('[data-testid="header-menu-button"]')
    const menu = wrapper.get('[data-testid="header-menu"]')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(isShown(menu.element)).toBe(false)

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(isShown(menu.element)).toBe(true)

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(isShown(menu.element)).toBe(false)
  })

  it('open menu: button icon changes, button background tinted', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const button = wrapper.get('[data-testid="header-menu-button"]')
    const iconOf = (): string | undefined => wrapper.get('[data-testid="header-menu-icon"]').attributes('data-icon')
    const closedIcon = iconOf()
    const closedClasses = button.classes()

    await button.trigger('click')
    expect(iconOf()).not.toBe(closedIcon)
    expect(button.classes()).not.toEqual(closedClasses)

    await button.trigger('click')
    expect(iconOf()).toBe(closedIcon)
    expect(button.classes()).toEqual(closedClasses)
  })

  it('menu link click closes the menu', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const button = wrapper.get('[data-testid="header-menu-button"]')

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')

    await wrapper.get('[data-testid="header-menu"] a').trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(isShown(wrapper.get('[data-testid="header-menu"]').element)).toBe(false)
  })
})

// Прокрутка окна с событием scroll (в happy-dom scroll само не рассылается)
const scrollWindowTo = async (y: number): Promise<void> => {
  window.scrollTo(0, y)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
}

// Шапка сдвинута вверх (скрыта на телефоне). Ширину (только ниже md) задаёт CSS-вариант класса — его happy-dom не применяет,
// поэтому проверяется сам класс сдвига
const isHeaderShiftedUp = (wrapper: VueWrapper): boolean =>
  wrapper.get('[data-testid="app-header"]').classes().some(name => name.includes('-translate-y-full'))

describe('AppHeader: hide on scroll', () => {
  afterEach(async () => {
    await scrollWindowTo(0)
  })

  it('header is pinned to the top', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const classes = wrapper.get('[data-testid="app-header"]').classes()

    expect(classes).toContain('sticky')
    expect(classes).toContain('top-0')
    wrapper.unmount()
  })

  it('hides on scroll down and shows on scroll up', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })

    expect(isHeaderShiftedUp(wrapper)).toBe(false)
    await scrollWindowTo(400)
    expect(isHeaderShiftedUp(wrapper)).toBe(true)
    await scrollWindowTo(300)
    expect(isHeaderShiftedUp(wrapper)).toBe(false)
    wrapper.unmount()
  })

  it('does not hide while the menu is open', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })

    await wrapper.get('[data-testid="header-menu-button"]').trigger('click')
    await scrollWindowTo(400)
    expect(isHeaderShiftedUp(wrapper)).toBe(false)
    wrapper.unmount()
  })

  it('after menu closes, stays visible until the next scroll down', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })
    const button = wrapper.get('[data-testid="header-menu-button"]')

    await button.trigger('click')
    await scrollWindowTo(400)
    await button.trigger('click')
    expect(isHeaderShiftedUp(wrapper)).toBe(false)

    await scrollWindowTo(500)
    expect(isHeaderShiftedUp(wrapper)).toBe(true)
    wrapper.unmount()
  })

  it('focus inside the hidden header reveals it', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/' })

    await scrollWindowTo(400)
    expect(isHeaderShiftedUp(wrapper)).toBe(true)

    await wrapper.get('[data-testid="header-logo"]').trigger('focusin')
    expect(isHeaderShiftedUp(wrapper)).toBe(false)
    wrapper.unmount()
  })
})
