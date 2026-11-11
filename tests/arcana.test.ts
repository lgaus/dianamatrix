// Тесты расшифровок арканов (шаг 3): только структура — ключи 1..22 и непустая строка description.
// Тексты расшифровок не проверяются, их можно менять как угодно.
import { describe, expect, it } from 'vitest'
import { arcana } from '~/content/arcana'

const expectedKeys = Array.from({ length: 22 }, (_, index) => String(index + 1))

describe('arcana', () => {
  it('has exactly the keys 1..22', () => {
    expect(Object.keys(arcana)).toEqual(expectedKeys)
  })

  it.each(expectedKeys)('arcana %s has a non-empty description', (key) => {
    const { description } = arcana[Number(key) as keyof typeof arcana]
    expect(typeof description).toBe('string')
    expect(description.trim()).not.toBe('')
  })
})
