// Контакты для записи на разбор (окно контактов). Порядок массива — порядок строк в окне.
// Названия мессенджеров и готовое сообщение — в texts.ts (contacts).
// TODO: заменить заглушки [ник] и [номер] настоящими данными

import type { texts } from '~/content/texts'

export type ContactId = keyof typeof texts.contacts.names

export interface Contact {
  id: ContactId
  // Ник или номер, который видно в окне
  handle: string
  // Адрес чата; message — готовое сообщение (только где мессенджер умеет его подставить)
  href: (message: string) => string
}

const telegramUser = '[ник]'
// Номер WhatsApp в международном формате, в адрес попадают только цифры
const whatsappNumber = '[номер]'
const vkId = '[ник]'
const instagramUser = '[ник]'

export const contacts: readonly Contact[] = [
  // Подстановка текста в чат с пользователем Telegram (?text=) — проверить на телефоне
  { id: 'telegram', handle: telegramUser, href: message => `https://t.me/${encodeURIComponent(telegramUser)}?text=${encodeURIComponent(message)}` },
  { id: 'whatsapp', handle: whatsappNumber, href: message => `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}` },
  // VK и Instagram не умеют подставлять текст
  { id: 'vk', handle: vkId, href: () => `https://vk.me/${encodeURIComponent(vkId)}` },
  { id: 'instagram', handle: instagramUser, href: () => `https://ig.me/m/${encodeURIComponent(instagramUser)}` },
]
