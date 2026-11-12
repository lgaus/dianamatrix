// Окно контактов: одно на сайт (ContactDialog в app.vue), его открывают все кнопки «Записаться на разбор».
// Состояние общее (useState): кнопки в шапке, меню и блоке разбора меняют его, окно следит за ним.
export const useContactDialog = () => {
  const isOpen = useState('contact-dialog-open', () => false)
  // Элемент, на который вернуть фокус после закрытия: кнопка, которой открыли (из меню — бургер)
  const returnFocusTarget = useState<EventTarget | null>('contact-dialog-return-focus', () => null)

  const open = (returnFocusTo: EventTarget | null = null) => {
    returnFocusTarget.value = returnFocusTo
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return { isOpen, returnFocusTarget, open, close }
}
