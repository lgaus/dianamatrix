// Перенос строки, которая не помещается в одну строку (навигация календаря при крупном шрифте в настройках).
// Composable только решает, помещается ли строка; как она выглядит с переносом — решает компонент
// (по атрибуту data-wrapped у строки).
// Ширина строки «в одну строку» — min-content невидимой копии строки без data-wrapped: у самой строки при переносе
// другая раскладка. Копия вставляется рядом со строкой и сразу удаляется (не отрисовывается).
// Доступная ширина — max-width контейнера (boundary) без его внутренних отступов и рамок: контейнер растёт
// до ширины содержимого (min-content), и строка, которая шире, вытолкнула бы его за max-width.
// Без max-width у контейнера строка не переносится.
// Пересчёт: при монтировании (до первой отрисовки — без мигания), при изменении размера контейнера (в том числе
// от размера шрифта в настройках: размеры в rem) и окна. Из ResizeObserver и resize — в следующем кадре:
// смена раскладки внутри обработчика ResizeObserver дала бы ошибку цикла.
import type { Ref } from 'vue'

// Допуск округления (px): строка ровно во всю ширину переноса не требует
const FIT_TOLERANCE = 0.5

const px = (value: string) => Number.parseFloat(value) || 0

export const useRowWrap = (row: Ref<HTMLElement | undefined>, boundary: Ref<HTMLElement | undefined>) => {
  const isWrapped = ref(false)

  // Ширина, доступная строке при максимальной ширине контейнера; Infinity — ограничения нет
  const availableWidth = (container: HTMLElement) => {
    const style = getComputedStyle(container)
    const maxWidth = Number.parseFloat(style.maxWidth)
    if (!Number.isFinite(maxWidth)) return Number.POSITIVE_INFINITY
    return maxWidth - px(style.paddingLeft) - px(style.paddingRight) - px(style.borderLeftWidth) - px(style.borderRightWidth)
  }

  // Ширина строки без переноса: копия без data-wrapped, вне потока, шириной min-content
  const oneLineWidth = (element: HTMLElement) => {
    const probe = element.cloneNode(true) as HTMLElement
    probe.removeAttribute('data-wrapped')
    probe.setAttribute('aria-hidden', 'true')
    probe.inert = true
    Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', width: 'min-content', left: '0', top: '0' })
    element.after(probe)
    const width = px(getComputedStyle(probe).width)
    probe.remove()
    return width
  }

  const update = () => {
    if (!row.value || !boundary.value) return
    isWrapped.value = oneLineWidth(row.value) > availableWidth(boundary.value) + FIT_TOLERANCE
  }

  let frame = 0
  const scheduleUpdate = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(update)
  }

  let observer: ResizeObserver | undefined

  onMounted(() => {
    update()
    window.addEventListener('resize', scheduleUpdate)
    if (typeof ResizeObserver !== 'undefined' && boundary.value) {
      observer = new ResizeObserver(scheduleUpdate)
      observer.observe(boundary.value)
    }
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', scheduleUpdate)
    observer?.disconnect()
  })

  return { isWrapped: readonly(isWrapped) }
}
