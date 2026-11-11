// Тесты наборов классов отклика (шаг 5, app/config/feedback.ts) — правила раздела «Дизайн-значения» PLAN.md:
// отклик есть и при мыши (hover:), и при нажатии (active:, тач); плавно меняются только цвет, фон, рамка и масштаб,
// рамка фокуса появляется сразу; при reduced motion — без анимации.
import { describe, expect, it } from 'vitest'
import * as feedback from '~/config/feedback'

const classesOf = (value: string): string[] => value.split(/\s+/).filter(Boolean)

// Наборы отклика на наведение/нажатие (все, где есть hover: или active:)
const pointerSets = Object.entries(feedback)
  .filter(([, value]) => classesOf(value).some(name => name.startsWith('hover:') || name.startsWith('active:')))

describe('feedback.ts', () => {
  it('all exports are non-empty class strings', () => {
    for (const [name, value] of Object.entries(feedback)) {
      expect(typeof value, name).toBe('string')
      expect(classesOf(value).length, name).toBeGreaterThan(0)
    }
  })

  it('every hover: has a matching active: (feedback on touch devices too)', () => {
    expect(pointerSets.length).toBeGreaterThan(0)
    for (const [name, value] of pointerSets) {
      const classes = classesOf(value)
      const hovers = classes.filter(c => c.startsWith('hover:')).map(c => c.slice('hover:'.length)).sort()
      const actives = classes.filter(c => c.startsWith('active:')).map(c => c.slice('active:'.length)).sort()
      expect(actives, name).toEqual(hovers)
    }
  })

  it('interactiveClass: transitions only color, background, border and scale; outline not animated', () => {
    const classes = classesOf(feedback.interactiveClass)
    const transition = classes.find(c => c.startsWith('transition'))
    const match = /^transition-\[(.+)\]$/.exec(transition ?? '')
    expect(match, 'transition-[...] со списком свойств').not.toBeNull()
    const properties = (match?.[1] ?? '').split(',').sort()
    expect(properties).toEqual(['background-color', 'border-color', 'color', 'scale'])
    expect(properties.some(p => p.startsWith('outline'))).toBe(false)
  })

  it('interactiveClass: 150 ms, no animation with reduced motion, accent-colored focus ring', () => {
    const classes = classesOf(feedback.interactiveClass)
    expect(classes).toContain('duration-150')
    expect(classes).toContain('motion-reduce:transition-none')
    expect(classes).toContain('focus-visible:outline-2')
    expect(classes).toContain('focus-visible:outline-accent')
  })

  it('pressClass: press scale only without reduced motion', () => {
    const scale = classesOf(feedback.pressClass).filter(c => c.includes('scale-'))
    expect(scale.length).toBeGreaterThan(0)
    for (const name of scale) expect(name.startsWith('motion-safe:active:')).toBe(true)
  })

  it('pressed state = same background and border as hover (without prefixes)', () => {
    const strip = (value: string) => classesOf(value).filter(c => c.startsWith('hover:')).map(c => c.slice('hover:'.length))
    const expected = [...strip(feedback.tintFeedbackClass), ...strip(feedback.tintBorderFeedbackClass)].sort()
    expect(classesOf(feedback.tintPressedClass).sort()).toEqual(expected)
  })

  it('background and border tint: dark fuchsia with tint and tint-border opacity tokens', () => {
    expect(classesOf(feedback.tintFeedbackClass)).toContain('hover:bg-accent-hover/tint')
    expect(classesOf(feedback.tintBorderFeedbackClass)).toContain('hover:border-accent-hover/tint-border')
  })
})
