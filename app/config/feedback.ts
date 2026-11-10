// Отклик интерактивных элементов (наведение, нажатие, фокус) — см. PLAN.md, «Дизайн-значения».
// Полные строки классов: Tailwind находит их при сканировании файла.
// hover: в Tailwind v4 срабатывает только при наличии мыши (@media (hover: hover)), на тач-устройствах отклик даёт active:.

// Плавность 150 мс только у цвета текста, фона, рамки и масштаба (без анимации при reduced motion).
// outline в списке нет: рамка фокуса появляется сразу, без перетекания цвета.
// Видимый фокус — рамка цвета акцента.
export const interactiveClass = 'transition-[color,background-color,border-color,scale] duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-accent'

// Рамка фокуса снаружи элемента (отдельные элементы) и внутри (строки меню, чтобы не залезать на соседние)
export const outerFocusClass = 'focus-visible:outline-offset-2'
export const innerFocusClass = 'focus-visible:-outline-offset-2'

// Нажатие кнопок
export const pressClass = 'cursor-pointer motion-safe:active:scale-97'

// Элементы без фона (текст, иконка): текст цвета ink становится акцентным
export const inkTextFeedbackClass = 'hover:text-accent active:text-accent'

// Элементы с фоном (кнопки, строки меню): фон подкрашивается полупрозрачной тёмной фуксией
export const tintFeedbackClass = 'hover:bg-accent-hover/tint active:bg-accent-hover/tint'

// Кнопки с фоном и рамкой: рамка затемняется, иначе она сливается с подкрашенным фоном
export const tintBorderFeedbackClass = 'hover:border-accent-hover/tint-border active:border-accent-hover/tint-border'

// Состояние «нажата» (бургер при открытом меню): подкрашенный фон и затемнённая рамка постоянно
export const tintPressedClass = 'bg-accent-hover/tint border-accent-hover/tint-border'

// Акцентный текст на подкрашенном фоне темнеет до accent-hover: контраст accent на подкраске ниже 4.5:1
export const accentTextFeedbackClass = 'hover:text-accent-hover active:text-accent-hover'
