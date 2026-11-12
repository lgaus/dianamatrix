// Тесты блока «Личный разбор» (шаг 10): структура, варианты текста для телефона и компьютера,
// кнопка записи (один текст на всех ширинах) открывает окно контактов. Формулировки не проверяются — только разметка и состояние.
import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ConsultationBlock from '~/components/ConsultationBlock.vue'

describe('ConsultationBlock', () => {
  afterEach(() => {
    useContactDialog().close()
  })

  it('is a section with an h2 title, label, description and price note', async () => {
    const wrapper = await mountSuspended(ConsultationBlock)
    const root = wrapper.get('[data-testid="consultation-block"]')

    expect(root.element.tagName).toBe('SECTION')
    expect(wrapper.findAll('h2')).toHaveLength(1)
    expect(wrapper.get('h2 + p').text()).toBeTruthy()
    expect(wrapper.get('p').text()).toBeTruthy()
    expect(wrapper.get('[data-testid="consultation-price"]').text()).toBeTruthy()
  })

  // Скрытый вариант — display: none (классы xs:hidden / max-xs:hidden), экранный диктор читает только видимый
  it('phone and desktop title variants: both non-empty, shown on opposite sides of xs', async () => {
    const wrapper = await mountSuspended(ConsultationBlock)
    const short = wrapper.get('[data-testid="consultation-title-short"]')
    const full = wrapper.get('[data-testid="consultation-title-full"]')

    expect(short.text()).toBeTruthy()
    expect(full.text()).toBeTruthy()
    expect(short.text()).not.toBe(full.text())
    expect(short.classes()).toContain('xs:hidden')
    expect(full.classes()).toContain('max-xs:hidden')
  })

  it('price note is hidden on phone', async () => {
    const wrapper = await mountSuspended(ConsultationBlock)
    expect(wrapper.get('[data-testid="consultation-price"]').classes()).toContain('max-xs:hidden')
  })

  it('photo placeholder is hidden from screen readers', async () => {
    const wrapper = await mountSuspended(ConsultationBlock)
    expect(wrapper.get('[data-testid="consultation-photo"]').attributes('aria-hidden')).toBe('true')
  })

  it('CTA is a button that opens the contact dialog and is the focus return target', async () => {
    const wrapper = await mountSuspended(ConsultationBlock)
    const cta = wrapper.get('[data-testid="consultation-cta"]')
    const { isOpen, returnFocusTarget } = useContactDialog()

    expect(cta.element.tagName).toBe('BUTTON')
    expect(cta.attributes('type')).toBe('button')
    await cta.trigger('click')
    expect(isOpen.value).toBe(true)
    expect(returnFocusTarget.value).toBe(cta.element)
  })
})
