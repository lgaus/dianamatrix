import { MATRIX_CHART_ID } from '~/components/MatrixChart.vue'
import { chakras } from '~/config/chakras'
import { calculateHealth, calculatePoints, calculatePurpose } from '~/utils/matrix/formulas'
import type { MatrixInput } from '~/utils/matrix/types'

// Связка формы с результатом: данные последнего расчёта → точки схемы, карта здоровья, предназначение.
// Состояние живёт на странице (не в useState): при переходе на другую страницу и обратно сбрасывается вместе с формой.
// Обновляется только по calculate(); до первого расчёта все значения undefined (в блоках — «–»).
export function useMatrix() {
  const input = shallowRef<MatrixInput>()

  const points = computed(() => input.value && calculatePoints(input.value.birthDate))
  const health = computed(() => points.value && calculateHealth(points.value, chakras))
  const purpose = computed(() => points.value && calculatePurpose(points.value))
  const birthDate = computed(() => input.value?.birthDate)
  const name = computed(() => input.value?.name)

  // После расчёта на телефоне и планшете (схема под формой) страница всегда прокручивается так, чтобы схема встала
  // по центру области под шапкой (block: 'center' учитывает scroll-padding у html: сверху шапка, снизу зазор).
  // Схема выше этой области — верх схемы сразу под шапкой (block: 'start'), иначе центр увёл бы её верх под шапку.
  // От перелома lg (--breakpoint-lg из темы) схема рядом с формой — прокрутки нет никогда, даже если схема выше окна.
  // Плавно; при prefers-reduced-motion — сразу
  const revealMatrix = () => {
    const root = getComputedStyle(document.documentElement)
    const matrix = document.getElementById(MATRIX_CHART_ID)
    if (!matrix || window.matchMedia(`(width >= ${root.getPropertyValue('--breakpoint-lg')})`).matches) return
    const area = window.innerHeight - parseFloat(root.scrollPaddingTop) - parseFloat(root.scrollPaddingBottom)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    matrix.scrollIntoView({ block: matrix.offsetHeight > area ? 'start' : 'center', behavior: reduceMotion ? 'instant' : 'smooth' })
  }

  // Расчёт по данным формы и показ схемы. Высота схемы постоянна, ждать отрисовки не нужно
  const calculate = (data: MatrixInput) => {
    input.value = data
    revealMatrix()
  }

  return { points, health, purpose, birthDate, name, calculate }
}
