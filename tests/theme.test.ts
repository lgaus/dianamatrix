/// <reference types="node" />
// Тесты темы (шаг 2): токены в theme.css соответствуют разделу «Дизайн-значения» PLAN.md,
// main.css подключает Tailwind, шрифты и тему.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// В окружении nuxt import.meta.url не указывает на файл, поэтому путь — от корня проекта (vitest запускается из него)
const readProjectFile = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8')

const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '')

// Содержимое первого блока `<selector> { ... }` (без вложенных блоков)
const getBlock = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{([^{}]*)\\}`).exec(css)
  if (!match?.[1]) throw new Error(`Block "${selector}" not found`)
  return match[1]
}

// Объявления custom properties блока: имя -> значение
const getDeclarations = (block: string): Map<string, string> => {
  const result = new Map<string, string>()
  for (const match of block.matchAll(/(--[\w*-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match
    if (name && value) result.set(name, value.trim())
  }
  return result
}

const themeCss = stripComments(readProjectFile('app/assets/css/theme.css'))
const mainCss = stripComments(readProjectFile('app/assets/css/main.css'))
const themeTokens = getDeclarations(getBlock(themeCss, '@theme'))
const rootVariables = getDeclarations(getBlock(themeCss, ':root'))

// Эталон — раздел «Дизайн-значения» PLAN.md
const expectedColors: Record<string, string> = {
  'accent': '#D1246B',
  'ink': '#2A1520',
  'ink-muted': '#6E5563',
  'line': '#F7E1EA',
  'page': '#FFF6FA',
  'line-input': '#F0CFDD',
  'surface': '#FFFFFF',
  'photo-placeholder': '#F8D9E6',
  'cream': '#F9E27D',
  'matrix-line': '#C2387A',
  'aura-1': '#FF8CC6',
  'aura-2': '#FFB3D9',
  'aura-3': '#E0B8FF',
  'aura-base': '#FFEAF3',
  'chakra-violet': '#8B3DFF',
  'chakra-blue': '#2E6BFF',
  'chakra-cyan': '#00B2E8',
  'chakra-green': '#12B76A',
  'chakra-yellow': '#FFC400',
  'chakra-orange': '#FF8A00',
  'chakra-red': '#FF3355',
}

// Первое семейство из списка font-family, без кавычек
const firstFontFamily = (value: string | undefined): string =>
  (value ?? '').split(',')[0]?.trim().replace(/^["']|["']$/g, '') ?? ''

// Имя семейства, которое объявляет пакет Fontsource в своём @font-face
const fontsourceFamily = (packageName: string): string => {
  const css = readProjectFile(`node_modules/${packageName}/index.css`)
  const match = /font-family:\s*['"]([^'"]+)['"]/.exec(css)
  return match?.[1] ?? ''
}

describe('theme.css: colors', () => {
  it('disables the default Tailwind palette', () => {
    expect(themeTokens.get('--color-*')).toBe('initial')
  })

  it.each(Object.entries(expectedColors))('--color-%s is %s', (token, hex) => {
    expect(themeTokens.get(`--color-${token}`)?.toUpperCase()).toBe(hex)
  })

  it('has no color tokens beyond the design values', () => {
    const colorTokens = [...themeTokens.keys()]
      .filter(name => name.startsWith('--color-') && name !== '--color-*')
      .map(name => name.slice('--color-'.length))
      .sort()
    expect(colorTokens).toEqual(Object.keys(expectedColors).sort())
  })

  it('has no hex colors outside color tokens', () => {
    const hexOutsideTokens = [...themeTokens.entries(), ...rootVariables.entries()]
      .filter(([name, value]) => !name.startsWith('--color-') && /#[0-9a-f]{3,8}\b/i.test(value))
    expect(hexOutsideTokens).toEqual([])
  })
})

describe('theme.css: fonts and effects', () => {
  it('disables the default Tailwind fonts', () => {
    expect(themeTokens.get('--font-*')).toBe('initial')
  })

  it('has only --font-sans and --font-display font tokens', () => {
    const fontTokens = [...themeTokens.keys()]
      .filter(name => name.startsWith('--font-') && name !== '--font-*')
      .sort()
    expect(fontTokens).toEqual(['--font-display', '--font-sans'])
  })

  it('--font-sans starts with Nunito from Fontsource', () => {
    const family = firstFontFamily(themeTokens.get('--font-sans'))
    expect(family).toMatch(/^Nunito/)
    expect(family).toBe(fontsourceFamily('@fontsource-variable/nunito'))
  })

  it('--font-display starts with Comfortaa from Fontsource', () => {
    const family = firstFontFamily(themeTokens.get('--font-display'))
    expect(family).toMatch(/^Comfortaa/)
    expect(family).toBe(fontsourceFamily('@fontsource-variable/comfortaa'))
  })

  it('--tracking-heading is -0.045em', () => {
    expect(themeTokens.get('--tracking-heading')).toBe('-0.045em')
  })

  it('--opacity-grain is 0.1', () => {
    expect(Number(themeTokens.get('--opacity-grain'))).toBe(0.1)
  })

  it('--grain-blend-mode is soft-light', () => {
    expect(rootVariables.get('--grain-blend-mode')).toBe('soft-light')
  })

  it('contains only tokens, no @import', () => {
    expect(themeCss).not.toMatch(/@import/)
  })
})

describe('main.css: entry point', () => {
  const imports = [...mainCss.matchAll(/@import\s+["']([^"']+)["']/g)].map(match => match[1])

  it('imports tailwindcss first', () => {
    expect(imports[0]).toBe('tailwindcss')
  })

  it('imports both fonts and the theme', () => {
    expect(imports).toEqual(expect.arrayContaining([
      '@fontsource-variable/comfortaa',
      '@fontsource-variable/nunito',
      './theme.css',
    ]))
  })

  it('has every @import before other rules', () => {
    // Убираем начальную серию @import; дальше @import встречаться не должен
    const afterLeadingImports = mainCss.replace(/^(\s*@import[^;]+;)+/, '')
    expect(afterLeadingImports).not.toMatch(/@import/)
  })
})
