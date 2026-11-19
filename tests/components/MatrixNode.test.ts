// Тесты круга схемы (шаги 7, 10): число или «–», кольцо чакры или тонкое кольцо цвета линий, ярусы размеров, кольцо не меняет внешний диаметр.
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MatrixNode from '~/components/MatrixNode.vue'
import { texts } from '~/content/texts'

const mountNode = (props: InstanceType<typeof MatrixNode>['$props']) =>
  mountSuspended(MatrixNode, { props })
// Внешний радиус круга с кольцом: обводка рисуется по середине контура
const outerRadius = (wrapper: Awaited<ReturnType<typeof mountNode>>) => {
  const circle = wrapper.get('circle')
  return Number(circle.attributes('r')) + Number(circle.attributes('stroke-width')) / 2
}

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
    const wrapper = await mountNode({ cx: 0, cy: 0, kind: 'outer', ringClass: 'stroke-chakra-yellow' })
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

  it('inner node with a chakra ring keeps the chakra color and the same outer size as the neutral inner node', async () => {
    const neutral = await mountNode({ value: 12, cx: 0, cy: 0, kind: 'inner' })
    const colored = await mountNode({ value: 12, cx: 0, cy: 0, kind: 'inner', ringClass: 'stroke-chakra-green' })
    const circle = colored.get('circle')
    expect(circle.classes()).toContain('stroke-chakra-green')
    expect(circle.classes()).not.toContain('stroke-matrix-line')
    expect(neutral.get('circle').classes()).toContain('stroke-matrix-line')
    // Кольцо чакры толще тонкого, чтобы цвет читался
    expect(Number(circle.attributes('stroke-width'))).toBeGreaterThan(Number(neutral.get('circle').attributes('stroke-width')))
    expect(outerRadius(colored)).toBe(outerRadius(neutral))
  })

  // Ярусы: главные пять (E, A–D) > углы F–I > вторые точки троечек > третьи точки троечек; шрифт уменьшается вместе с кругом
  it('node sizes and fonts shrink by tier: outer, corner, middle, inner', async () => {
    const kinds = ['outer', 'corner', 'middle', 'inner'] as const
    const wrappers = await Promise.all(kinds.map(kind => mountNode({ value: 22, cx: 0, cy: 0, kind })))
    const radii = wrappers.map(outerRadius)
    const fonts = wrappers.map(wrapper => Number(wrapper.get('text').attributes('font-size')))
    for (let index = 1; index < kinds.length; index++) {
      expect(radii[index], kinds[index]).toBeLessThan(radii[index - 1]!)
      expect(fonts[index], kinds[index]).toBeLessThan(fonts[index - 1]!)
    }
  })

  // Обводка рисуется по середине контура: r + stroke/2 = внешний радиус; у узла без чакры (C2) он тот же, что у узла с чакрой (A2)
  it('ring stays inside the outer diameter with and without a chakra ring', async () => {
    const colored = await mountNode({ cx: 0, cy: 0, kind: 'middle', ringClass: 'stroke-chakra-blue' })
    const neutral = await mountNode({ cx: 0, cy: 0, kind: 'middle' })
    expect(outerRadius(neutral)).toBe(outerRadius(colored))
    expect(Number(neutral.get('circle').attributes('stroke-width'))).toBeLessThan(Number(colored.get('circle').attributes('stroke-width')))
  })
})
