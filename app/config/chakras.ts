// 7 чакр сверху вниз: id, цвет кольца, точки Физики/Энергии. Названия и зоны — в texts.ts.
// ringClass — полная строка класса, чтобы Tailwind нашёл его при сканировании.
import type { Chakra } from '../utils/matrix/types'

export const chakras: readonly Chakra[] = [
  { id: 'sahasrara', ringClass: 'stroke-chakra-violet', points: ['A', 'B'] },
  { id: 'ajna', ringClass: 'stroke-chakra-blue', points: ['A2', 'B2'] },
  { id: 'vishuddha', ringClass: 'stroke-chakra-cyan', points: ['A1', 'B1'] },
  { id: 'anahata', ringClass: 'stroke-chakra-green', points: ['A3', 'B3'] },
  { id: 'manipura', ringClass: 'stroke-chakra-yellow', points: ['E', 'E'] },
  { id: 'svadhisthana', ringClass: 'stroke-chakra-orange', points: ['C1', 'D1'] },
  { id: 'muladhara', ringClass: 'stroke-chakra-red', points: ['C', 'D'] },
]
