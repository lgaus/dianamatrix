// Тесты useHideOnScroll (шаг 5): скрытие при прокрутке вниз, показ при прокрутке вверх,
// наверху страницы всегда виден, порог от дрожания, reveal() показывает сразу, слушатель снимается при размонтировании.
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { useHideOnScroll } from '~/composables/useHideOnScroll'
import type { HideOnScrollState } from '~/composables/useHideOnScroll'

// Прокрутка окна с событием scroll (в happy-dom scroll само не рассылается)
const scrollWindowTo = async (y: number): Promise<void> => {
  window.scrollTo(0, y)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
}

// Тестовый компонент: отдаёт состояние composable наружу
const mountWithComposable = async (threshold?: number) => {
  let state: HideOnScrollState | undefined
  const TestComponent = defineComponent({
    setup() {
      state = useHideOnScroll(threshold === undefined ? undefined : { threshold })
      return () => h('div')
    },
  })
  const wrapper = await mountSuspended(TestComponent)
  if (!state) throw new Error('composable not initialised')
  return { wrapper, state }
}

let mounted: VueWrapper | undefined

afterEach(async () => {
  mounted?.unmount()
  mounted = undefined
  await scrollWindowTo(0)
})

describe('useHideOnScroll', () => {
  it('сначала виден', async () => {
    const { wrapper, state } = await mountWithComposable()
    mounted = wrapper

    expect(state.isHidden.value).toBe(false)
  })

  it('прячется при прокрутке вниз и показывается при прокрутке вверх', async () => {
    const { wrapper, state } = await mountWithComposable()
    mounted = wrapper

    await scrollWindowTo(300)
    expect(state.isHidden.value).toBe(true)

    await scrollWindowTo(200)
    expect(state.isHidden.value).toBe(false)

    await scrollWindowTo(500)
    expect(state.isHidden.value).toBe(true)
  })

  it('наверху страницы виден всегда', async () => {
    const { wrapper, state } = await mountWithComposable()
    mounted = wrapper

    await scrollWindowTo(300)
    expect(state.isHidden.value).toBe(true)

    await scrollWindowTo(0)
    expect(state.isHidden.value).toBe(false)
  })

  it('сдвиг меньше порога не меняет состояние', async () => {
    const { wrapper, state } = await mountWithComposable(10)
    mounted = wrapper

    await scrollWindowTo(300)
    expect(state.isHidden.value).toBe(true)

    // Вверх меньше чем на порог — остаётся скрытым
    await scrollWindowTo(295)
    expect(state.isHidden.value).toBe(true)

    // Мелкие сдвиги вверх копятся от последней точки срабатывания: в сумме больше порога — показывается
    await scrollWindowTo(289)
    expect(state.isHidden.value).toBe(false)
  })

  it('reveal() показывает сразу, дальнейшая прокрутка вниз снова прячет', async () => {
    const { wrapper, state } = await mountWithComposable()
    mounted = wrapper

    await scrollWindowTo(300)
    expect(state.isHidden.value).toBe(true)

    state.reveal()
    await nextTick()
    expect(state.isHidden.value).toBe(false)

    await scrollWindowTo(400)
    expect(state.isHidden.value).toBe(true)
  })

  it('после размонтирования прокрутка не меняет состояние', async () => {
    const { wrapper, state } = await mountWithComposable()

    wrapper.unmount()
    await scrollWindowTo(500)
    expect(state.isHidden.value).toBe(false)
  })
})
