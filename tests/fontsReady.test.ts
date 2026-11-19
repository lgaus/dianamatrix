/// <reference types="node" />
// Тесты плагина fonts-ready (issue #59): приложение монтируется после загрузки шрифтов,
// но не ждёт дольше 3 с и не падает при ошибке загрузки.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fontsReady from '../app/plugins/fonts-ready.client'

const readProjectFile = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

// Первое семейство из переменной темы: --font-sans: "Nunito Variable", ... -> Nunito Variable
const themeCss = readProjectFile('app/assets/css/theme.css').replace(/\/\*[\s\S]*?\*\//g, '')
const themeFamily = (variable: string): string => {
  const match = new RegExp(`${variable}\\s*:\\s*["']([^"']+)["']`).exec(themeCss)
  if (!match?.[1]) throw new Error(`Variable "${variable}" not found`)
  return match[1]
}

const runSetup = async (): Promise<void> => {
  await (fontsReady as unknown as (app: unknown) => Promise<void>)({})
}

const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts')
const setFonts = (load: (font: string, text?: string) => Promise<unknown>) => {
  Object.defineProperty(document, 'fonts', { value: { load }, configurable: true })
}

describe('fonts-ready plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts)
    else Reflect.deleteProperty(document, 'fonts')
  })

  it('loads the theme font families with a Latin + Cyrillic sample', async () => {
    const load = vi.fn(() => Promise.resolve([]))
    setFonts(load)
    await runSetup()
    const calls = load.mock.calls as unknown as [string, string][]
    const families = calls.map(([font]) => /"([^"]+)"/.exec(font)?.[1])
    expect(families.sort()).toEqual([themeFamily('--font-sans'), themeFamily('--font-display')].sort())
    for (const [, text] of calls) {
      expect(text).toMatch(/[A-Za-z]/)
      expect(text).toMatch(/[А-Яа-яЁё]/)
    }
  })

  it('resolves after the fonts have loaded', async () => {
    const resolvers: Array<(value: unknown) => void> = []
    setFonts(() => new Promise(resolve => { resolvers.push(resolve) }))
    let done = false
    const promise = runSetup().then(() => { done = true })
    await vi.advanceTimersByTimeAsync(100)
    expect(done).toBe(false)
    resolvers.forEach(resolve => resolve([]))
    await promise
    expect(done).toBe(true)
  })

  it('resolves after 3000 ms if the fonts never load', async () => {
    setFonts(() => new Promise(() => {}))
    let done = false
    const promise = runSetup().then(() => { done = true })
    await vi.advanceTimersByTimeAsync(2999)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await promise
    expect(done).toBe(true)
  })

  it('does not throw when loading rejects', async () => {
    setFonts(() => Promise.reject(new Error('network')))
    await expect(runSetup()).resolves.toBeUndefined()
  })
})
