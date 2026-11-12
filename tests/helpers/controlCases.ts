// Контрольные значения расчёта (шаг 4): общие для тестов формул и связки (useMatrix).
// Эталоны посчитаны вручную по правилам PLAN.md.
import type { BirthDate, HealthMap, MatrixPoints, Purpose } from '~/utils/matrix/types'

export interface ControlCase {
  date: BirthDate
  points: MatrixPoints
  health: HealthMap
  purpose: Purpose
}

export const controlCases: Record<string, ControlCase> = {
  '14.07.1992': {
    date: { day: 14, month: 7, year: 1992 },
    points: {
      A: 14, B: 7, C: 21, D: 6, E: 12,
      F: 21, G: 10, H: 9, I: 20,
      A1: 8, A2: 22, A3: 20,
      B1: 19, B2: 8, B3: 4,
      C1: 6, D1: 18,
    },
    health: {
      sahasrara: { physics: 14, energy: 7, emotions: 21 },
      ajna: { physics: 22, energy: 8, emotions: 3 },
      vishuddha: { physics: 8, energy: 19, emotions: 9 },
      anahata: { physics: 20, energy: 4, emotions: 6 },
      manipura: { physics: 12, energy: 12, emotions: 6 },
      svadhisthana: { physics: 6, energy: 18, emotions: 6 },
      muladhara: { physics: 21, energy: 6, emotions: 9 },
      total: { physics: 4, energy: 11, emotions: 6 },
    },
    purpose: {
      sky: 13, earth: 8, personal: 21,
      male: 3, female: 3, social: 6,
      spiritual: 9, planetary: 15,
    },
  },
  '11.02.1999': {
    date: { day: 11, month: 2, year: 1999 },
    points: {
      A: 11, B: 2, C: 10, D: 5, E: 10,
      F: 13, G: 12, H: 15, I: 16,
      A1: 21, A2: 5, A3: 4,
      B1: 12, B2: 14, B3: 22,
      C1: 20, D1: 15,
    },
    health: {
      sahasrara: { physics: 11, energy: 2, emotions: 13 },
      ajna: { physics: 5, energy: 14, emotions: 19 },
      vishuddha: { physics: 21, energy: 12, emotions: 6 },
      anahata: { physics: 4, energy: 22, emotions: 8 },
      manipura: { physics: 10, energy: 10, emotions: 20 },
      svadhisthana: { physics: 20, energy: 15, emotions: 8 },
      muladhara: { physics: 10, energy: 5, emotions: 15 },
      total: { physics: 9, energy: 8, emotions: 17 },
    },
    purpose: {
      sky: 7, earth: 21, personal: 10,
      male: 10, female: 10, social: 20,
      spiritual: 3, planetary: 5,
    },
  },
}
