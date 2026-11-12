// Тесты круга схемы (шаг 7): число или «–», кольцо чакры или тонкое кольцо угла, кольцо не выходит за внешний диаметр.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MatrixNode from '~/components/MatrixNode.vue'
import { texts } from '~/content/texts'

const mountNode = (props: InstanceType<typeof MatrixNode>['$props']) =>
  mountSuspended(MatrixNode, { props })

describe('MatrixNode', () => {
  it('shows the value at the circle center', async () => {
    const wrapper = await mountNode({ value: 14, cx: 10, cy: 20, kind: 'outer', ringClass: 'stroke-chakra-violet' })
    const text = wrapper.get('text')
    expect(text.text()).toBe('14')
    expect(text.attributes('x')).toBe('10')
    expect(text.attributes('y')).toBe('20')
    const circle = wrapper.get('circle')
    expect(circle.attributes('cx')).toBe('10')
    expect(circle.attributes('cy')).toBe('20')
  })

  it('shows the empty value without data', async () => {
    const wrapper = await mountNode({ cx: 0, cy: 0, kind: 'center', ringClass: 'stroke-chakra-yellow' })
    expect(wrapper.get('text').text()).toBe(texts.matrix.emptyValue)
  })

  it('uses the chakra ring class for non-corner nodes', async () => {
    const wrapper = await mountNode({ value: 8, cx: 0, cy: 0, kind: 'middle', ringClass: 'stroke-chakra-cyan' })
    expect(wrapper.get('circle').classes()).toContain('stroke-chakra-cyan')
  })

  it('corner node has a thin matrix-line ring and no chakra color', async () => {
    const corner = await mountNode({ value: 21, cx: 0, cy: 0, kind: 'corner' })
    const middle = await mountNode({ value: 8, cx: 0, cy: 0, kind: 'middle', ringClass: 'stroke-chakra-cyan' })
    const circle = corner.get('circle')
    expect(circle.classes()).toContain('stroke-matrix-line')
    expect(circle.classes().some(name => name.startsWith('stroke-chakra-'))).toBe(false)
    expect(Number(circle.attributes('stroke-width'))).toBeLessThan(Number(middle.get('circle').attributes('stroke-width')))
  })

  it('small node has a thin matrix-line ring, no chakra color and is smaller than middle', async () => {
    const small = await mountNode({ value: 12, cx: 0, cy: 0, kind: 'small' })
    const middle = await mountNode({ value: 8, cx: 0, cy: 0, kind: 'middle', ringClass: 'stroke-chakra-cyan' })
    const circle = small.get('circle')
    expect(circle.classes()).toContain('stroke-matrix-line')
    expect(circle.classes().some(name => name.startsWith('stroke-chakra-'))).toBe(false)
    expect(Number(circle.attributes('stroke-width'))).toBeLessThan(Number(middle.get('circle').attributes('stroke-width')))
    expect(Number(circle.attributes('r'))).toBeLessThan(Number(middle.get('circle').attributes('r')))
  })

  it('small node with a chakra ring keeps the chakra color and the same outer size as the neutral small node', async () => {
    const neutral = await mountNode({ value: 12, cx: 0, cy: 0, kind: 'small' })
    const colored = await mountNode({ value: 12, cx: 0, cy: 0, kind: 'small', ringClass: 'stroke-chakra-green' })
    const middle = await mountNode({ value: 8, cx: 0, cy: 0, kind: 'middle', ringClass: 'stroke-chakra-cyan' })
    const circle = colored.get('circle')
    expect(circle.classes()).toContain('stroke-chakra-green')
    expect(circle.classes()).not.toContain('stroke-matrix-line')
    const outerRadius = (wrapper: typeof neutral) => {
      const element = wrapper.get('circle')
      return Number(element.attributes('r')) + Number(element.attributes('stroke-width')) / 2
    }
    expect(outerRadius(colored)).toBe(outerRadius(neutral))
    expect(outerRadius(colored)).toBeLessThan(outerRadius(middle))
  })

  // Обводка рисуется по середине контура: r + stroke/2 = внешний радиус, одинаковый у middle и corner
  it('ring stays inside the outer diameter (same for middle and corner)', async () => {
    const outerRadius = async (kind: 'middle' | 'corner') => {
      const circle = (await mountNode({ cx: 0, cy: 0, kind })).get('circle')
      return Number(circle.attributes('r')) + Number(circle.attributes('stroke-width')) / 2
    }
    expect(await outerRadius('middle')).toBe(await outerRadius('corner'))
  })
})
