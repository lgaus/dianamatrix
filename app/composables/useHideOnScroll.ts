// Скрытие элемента при прокрутке вниз и показ при прокрутке вверх (шапка на телефоне).
// Composable только считает состояние; на каких ширинах прятать и как анимировать — решает компонент.
import type { Ref } from 'vue'

interface HideOnScrollOptions {
  // Минимальный сдвиг прокрутки (px), после которого меняется состояние: защита от дрожания
  threshold?: number
}

export interface HideOnScrollState {
  // Элемент должен быть спрятан (только для чтения: меняется прокруткой и reveal())
  isHidden: Readonly<Ref<boolean>>
  // Показать сразу; следующая прокрутка вниз снова прячет
  reveal: () => void
}

export const useHideOnScroll = ({ threshold = 10 }: HideOnScrollOptions = {}): HideOnScrollState => {
  const isHidden = ref(false)
  // Позиция, от которой считается сдвиг: обновляется только после срабатывания порога
  let lastScrollY = 0

  const onScroll = () => {
    const scrollY = window.scrollY

    // Наверху страницы (и при «оттягивании» в iOS, где scrollY < 0) элемент всегда виден
    if (scrollY <= 0) {
      isHidden.value = false
      lastScrollY = 0
      return
    }

    const delta = scrollY - lastScrollY
    if (Math.abs(delta) < threshold) return

    isHidden.value = delta > 0
    lastScrollY = scrollY
  }

  // Показать сразу (например, когда фокус клавиатуры попал внутрь скрытого элемента)
  const reveal = () => {
    isHidden.value = false
    lastScrollY = window.scrollY
  }

  onMounted(() => {
    lastScrollY = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
  })

  return { isHidden: readonly(isHidden), reveal }
}
