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
  'accent-hover': '#A11C52',
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

// Цвета, производные от других токенов (без своего hex)
const derivedColors = ['shadow', 'accent-shaded']

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
    expect(colorTokens).toEqual([...Object.keys(expectedColors), ...derivedColors].sort())
  })

  // Цвет тени — не отдельный hex, а ink с прозрачностью в процентах
  it('--color-shadow is ink with transparency', () => {
    expect(themeTokens.get('--color-shadow'))
      .toMatch(/^color-mix\(in \w+,\s*var\(--color-ink\)\s+\d+(\.\d+)?%,\s*transparent\)$/)
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

  // Модификатор цвета bg-accent-hover/tint: Tailwind подставляет значение в color-mix(), поэтому оно в процентах
  it('--opacity-tint is 10% (percent, for color-mix)', () => {
    expect(themeTokens.get('--opacity-tint')).toBe('10%')
  })

  // Модификатор цвета border-accent-hover/tint-border (затемнённая рамка кнопок с фоном), тоже в процентах
  it('--opacity-tint-border is 25% (percent, for color-mix)', () => {
    expect(themeTokens.get('--opacity-tint-border')).toBe('25%')
  })

  // Модификатор цвета text-ink-muted/disabled (текст неактивных кнопок с фоном), в процентах
  it('--opacity-disabled is a percent (for color-mix)', () => {
    expect(themeTokens.get('--opacity-disabled')).toMatch(/^\d+%$/)
  })

  // Модификаторы цвета линий схемы матрицы: stroke-matrix-line/matrix-edge (контур) и /matrix-axis (оси), в процентах
  it('--opacity-matrix-edge and --opacity-matrix-axis are percents, edge more opaque than axis', () => {
    const edge = themeTokens.get('--opacity-matrix-edge') ?? ''
    const axis = themeTokens.get('--opacity-matrix-axis') ?? ''
    expect(edge).toMatch(/^\d+%$/)
    expect(axis).toMatch(/^\d+%$/)
    expect(Number.parseFloat(edge)).toBeGreaterThan(Number.parseFloat(axis))
  })

  it('has only the known opacity tokens', () => {
    const opacityTokens = [...themeTokens.keys()]
      .filter(name => name.startsWith('--opacity-'))
      .sort()
    expect(opacityTokens).toEqual([
      '--opacity-backdrop',
      '--opacity-disabled',
      '--opacity-grain',
      '--opacity-matrix-axis',
      '--opacity-matrix-edge',
      '--opacity-tint',
      '--opacity-tint-border',
    ])
  })

  it('--shadow-menu is the only shadow token and uses the shadow color', () => {
    const shadowTokens = [...themeTokens.keys()].filter(name => name.startsWith('--shadow-'))
    expect(shadowTokens).toEqual(['--shadow-menu'])
    expect(themeTokens.get('--shadow-menu')).toMatch(/var\(--color-shadow\)$/)
  })

  it('custom breakpoints: --breakpoint-xs 30rem (480 px), --breakpoint-phablet 34.375rem (550 px)', () => {
    const breakpointTokens = [...themeTokens.keys()].filter(name => name.startsWith('--breakpoint-'))
    expect(breakpointTokens).toEqual(['--breakpoint-xs', '--breakpoint-phablet'])
    expect(themeTokens.get('--breakpoint-xs')).toBe('30rem')
    expect(themeTokens.get('--breakpoint-phablet')).toBe('34.375rem')
  })

  it('--radius-block is 28px, --radius-card is 20px, --radius-arch is 50%', () => {
    expect(themeTokens.get('--radius-block')).toBe('28px')
    expect(themeTokens.get('--radius-card')).toBe('20px')
    expect(themeTokens.get('--radius-arch')).toBe('50%')
  })

  // Затемнение под окном контактов — модификатор цвета backdrop:bg-ink/backdrop, в процентах
  it('--opacity-backdrop is a percent (for color-mix)', () => {
    expect(themeTokens.get('--opacity-backdrop')).toMatch(/^\d+%$/)
  })

  // Арка-фото блока «Личный разбор»: верх — круг. Эллиптический процент под пропорции 340×420 (по высоте 170/420)
  it('--radius-photo keeps a circular top for a 340×420 photo', () => {
    const [horizontal, vertical] = (themeTokens.get('--radius-photo') ?? '').split(/\s+/).map(Number.parseFloat)
    expect(horizontal).toBe(50)
    expect((vertical ?? 0) * 420 / 100).toBeCloseTo(170, 1)
  })

  // Заголовок блока «Личный разбор» на телефоне (до xs) 22 px; в rem, чтобы рос с размером шрифта браузера
  it('--text-title-xs is 22px in rem', () => {
    expect(themeTokens.get('--text-title-xs')).toBe('1.375rem')
  })

  it('--text-logo is 19px, --text-nav is 15px', () => {
    expect(themeTokens.get('--text-logo')).toBe('19px')
    expect(themeTokens.get('--text-nav')).toBe('15px')
  })

  // Подпись схемы на телефоне 13 px; в rem, чтобы росла с размером шрифта браузера
  it('--text-caption-sm is 13px in rem', () => {
    expect(themeTokens.get('--text-caption-sm')).toBe('0.8125rem')
  })

  // Ячейки карты здоровья с phablet (550 px) 15 px; в rem, чтобы росли с размером шрифта браузера
  it('--text-cell is 15px in rem', () => {
    expect(themeTokens.get('--text-cell')).toBe('0.9375rem')
  })

  // Крупные числа «Предназначения» 32 px; в rem, чтобы росли с размером шрифта браузера
  it('--text-number is 32px in rem', () => {
    expect(themeTokens.get('--text-number')).toBe('2rem')
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

describe('main.css: html base styles (step 5)', () => {
  // Блок html { ... } внутри @layer base (getBlock ищет блок без вложенных)
  const htmlDeclarations = new Map(
    [...getBlock(mainCss, 'html').matchAll(/([\w-]+)\s*:\s*([^;]+);/g)]
      .map(([, name, value]) => [name ?? '', (value ?? '').trim()]),
  )

  it('reserves the scrollbar gutter (header does not shift between / and /about)', () => {
    expect(htmlDeclarations.get('scrollbar-gutter')).toBe('stable')
  })

  it('page background is the page token (gutter of a short page is not white)', () => {
    expect(htmlDeclarations.get('background-color')).toBe('var(--color-page)')
  })
})
