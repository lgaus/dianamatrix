// Тесты useMatrix (шаг 11): до расчёта всё undefined; calculate даёт контрольные точки, карту здоровья и предназначение;
// повторный расчёт заменяет прежний; имя и дата отдаются как есть; прокрутка к схеме после расчёта (перенесена из формы).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { MATRIX_CHART_ID } from '~/components/MatrixChart.vue'
import { useMatrix } from '~/composables/useMatrix'
import { controlCases } from './helpers/controlCases'

const first = controlCases['14.07.1992']!
const second = controlCases['11.02.1999']!

let wrapper: VueWrapper | undefined

// Тестовый компонент: отдаёт состояние composable наружу
const mountWithComposable = async () => {
  let state: ReturnType<typeof useMatrix> | undefined
  wrapper = await mountSuspended(defineComponent({
    setup() {
      state = useMatrix()
      return () => h('div')
    },
  }))
  if (!state) throw new Error('composable not initialised')
  return state
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('useMatrix: calculation', () => {
  it('before calculate everything is undefined', async () => {
    const state = await mountWithComposable()

    expect(state.points.value).toBeUndefined()
    expect(state.health.value).toBeUndefined()
    expect(state.purpose.value).toBeUndefined()
    expect(state.birthDate.value).toBeUndefined()
    expect(state.name.value).toBeUndefined()
  })

  it.each([['14.07.1992', first], ['11.02.1999', second]])('calculate(%s) gives control values', async (_, control) => {
    const state = await mountWithComposable()
    state.calculate({ name: undefined, birthDate: control.date })

    expect(state.points.value).toEqual(control.points)
    expect(state.health.value).toEqual(control.health)
    expect(state.purpose.value).toEqual(control.purpose)
  })

  it('second calculate replaces the first result', async () => {
    const state = await mountWithComposable()
    state.calculate({ name: 'Анна', birthDate: first.date })
    state.calculate({ name: undefined, birthDate: second.date })

    expect(state.points.value).toEqual(second.points)
    expect(state.health.value).toEqual(second.health)
    expect(state.purpose.value).toEqual(second.purpose)
    expect(state.birthDate.value).toEqual(second.date)
    expect(state.name.value).toBeUndefined()
  })

  it('name and birth date are passed through', async () => {
    const state = await mountWithComposable()
    state.calculate({ name: 'Анна', birthDate: first.date })

    expect(state.name.value).toBe('Анна')
    expect(state.birthDate.value).toEqual(first.date)
  })

  it('state is per instance: a new instance starts empty', async () => {
    const state = await mountWithComposable()
    state.calculate({ name: undefined, birthDate: first.date })
    wrapper?.unmount()
    const next = await mountWithComposable()

    expect(next.points.value).toBeUndefined()
  })
})

// Прокрутка к схеме после расчёта: элемент с id схемы (MATRIX_CHART_ID), scrollIntoView заглушен
describe('useMatrix: reveal matrix', () => {
  let matrix: HTMLElement

  beforeEach(() => {
    matrix = document.createElement('section')
    matrix.id = MATRIX_CHART_ID
    document.body.append(matrix)
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
  })

  afterEach(() => {
    matrix.remove()
    vi.restoreAllMocks()
  })

  it('calculate → matrix centered', async () => {
    const state = await mountWithComposable()
    state.calculate({ name: undefined, birthDate: first.date })

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts).toEqual([matrix])
  })

  it('repeated calculate with the same date scrolls again', async () => {
    const state = await mountWithComposable()
    state.calculate({ name: undefined, birthDate: first.date })
    state.calculate({ name: undefined, birthDate: first.date })

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2)
  })

  it('matrix taller than area under header → top under header (start)', async () => {
    Object.assign(document.documentElement.style, { scrollPaddingTop: '60px', scrollPaddingBottom: '8px' })
    vi.spyOn(matrix, 'offsetHeight', 'get').mockReturnValue(window.innerHeight - 60 - 8 + 1)
    const state = await mountWithComposable()
    state.calculate({ name: undefined, birthDate: first.date })
    Object.assign(document.documentElement.style, { scrollPaddingTop: '', scrollPaddingBottom: '' })

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
  })

  it('lg breakpoint matches (matrix beside form) → no scroll', async () => {
    document.documentElement.style.setProperty('--breakpoint-lg', '64rem')
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query === '(width >= 64rem)',
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList)
    const state = await mountWithComposable()
    state.calculate({ name: undefined, birthDate: first.date })
    document.documentElement.style.removeProperty('--breakpoint-lg')

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
