// Тесты окна контактов (шаг 10): нативный <dialog>, ссылки из app/config/contacts.ts, открытие и закрытие
// через общее состояние useContactDialog, возврат фокуса на кнопку, которой открыли.
// Формулировки не проверяются — только структура, адреса и состояние.
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ContactDialog from '~/components/ContactDialog.vue'
import { contacts } from '~/config/contacts'
import { texts } from '~/content/texts'

const mountDialog = () => mountSuspended(ContactDialog, { attachTo: document.body })

describe('ContactDialog', () => {
  afterEach(() => {
    useContactDialog().close()
    document.body.innerHTML = ''
  })

  it('is a closed native dialog labelled by its h2 title; close button has an accessible name', async () => {
    const wrapper = await mountDialog()
    const dialog = wrapper.get('[data-testid="contact-dialog"]')
    const title = wrapper.get('h2')

    expect(dialog.element.tagName).toBe('DIALOG')
    expect((dialog.element as HTMLDialogElement).open).toBe(false)
    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(wrapper.get('[data-testid="contact-dialog-close"]').attributes('aria-label')?.trim()).toBeTruthy()
    wrapper.unmount()
  })

  it('lists telegram, whatsapp, vk, instagram in this order, opening in a new tab', async () => {
    const wrapper = await mountDialog()
    const links = wrapper.findAll('[data-testid="contact-link"]')

    expect(links.map(link => link.attributes('data-contact'))).toEqual(['telegram', 'whatsapp', 'vk', 'instagram'])
    links.forEach((link, index) => {
      expect(link.attributes('href')).toBe(contacts[index]!.href(texts.contacts.message))
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')?.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
    })
    wrapper.unmount()
  })

  it('prefilled message: WhatsApp and Telegram links carry it encoded, VK and Instagram do not', async () => {
    const encoded = `text=${encodeURIComponent(texts.contacts.message)}`
    const href = (id: string) => contacts.find(contact => contact.id === id)!.href(texts.contacts.message)

    expect(href('whatsapp')).toContain(encoded)
    expect(href('telegram')).toContain(encoded)
    expect(href('vk')).not.toContain('text=')
    expect(href('instagram')).not.toContain('text=')
  })

  it('open() shows the modal; the close button closes it and syncs the state', async () => {
    const wrapper = await mountDialog()
    const dialog = wrapper.get('[data-testid="contact-dialog"]').element as HTMLDialogElement
    const { isOpen, open } = useContactDialog()

    open()
    await nextTick()
    expect(dialog.open).toBe(true)

    await wrapper.get('[data-testid="contact-dialog-close"]').trigger('click')
    await nextTick()
    expect(dialog.open).toBe(false)
    expect(isOpen.value).toBe(false)
    wrapper.unmount()
  })

  it('native close (Esc, Android back) syncs the state and returns focus to the opener', async () => {
    const wrapper = await mountDialog()
    const dialog = wrapper.get('[data-testid="contact-dialog"]').element as HTMLDialogElement
    const opener = document.createElement('button')
    document.body.append(opener)
    const { isOpen, open } = useContactDialog()

    open(opener)
    await nextTick()
    dialog.close()
    await nextTick()

    expect(isOpen.value).toBe(false)
    expect(document.activeElement).toBe(opener)
    wrapper.unmount()
  })

  it('press on the backdrop closes; press inside the content does not', async () => {
    const wrapper = await mountDialog()
    const dialog = wrapper.get('[data-testid="contact-dialog"]')
    const { isOpen, open } = useContactDialog()

    open()
    await nextTick()
    await wrapper.get('p').trigger('pointerdown')
    await wrapper.get('p').trigger('click')
    expect(isOpen.value).toBe(true)

    // Начато внутри, отпущено на затемнении (выделение текста) — окно остаётся открытым
    await wrapper.get('p').trigger('pointerdown')
    await dialog.trigger('click')
    expect(isOpen.value).toBe(true)

    await dialog.trigger('pointerdown')
    await dialog.trigger('click')
    await nextTick()
    expect(isOpen.value).toBe(false)
    expect((dialog.element as HTMLDialogElement).open).toBe(false)
    wrapper.unmount()
  })
})
