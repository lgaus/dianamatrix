/*
  Ждём загрузки шрифтов перед монтированием приложения.
  Fontsource объявляет шрифты с font-display: swap, а сайт — SPA: браузер начинает качать шрифт,
  только когда текст уже отрисован. Без ожидания на долю секунды виден системный шрифт
  (жирнее и крупнее), затем текст «прыгает» на Nunito/Comfortaa.
  Текст 'AaАа' — чтобы загрузились и латинский, и кириллический поднаборы (unicode-range).
  Не дольше 3 с (как период блокировки браузера при font-display: block): при медленной сети
  приложение всё равно монтируется, дальше работает обычный swap.
*/
const FONTS = ['1em "Nunito Variable"', '1em "Comfortaa Variable"']
const SAMPLE_TEXT = 'AaАа'
const TIMEOUT_MS = 3000

export default defineNuxtPlugin(async () => {
  const fontsLoaded = Promise.all(FONTS.map(font => document.fonts.load(font, SAMPLE_TEXT)))
  const timeout = new Promise(resolve => setTimeout(resolve, TIMEOUT_MS))
  // Ошибка загрузки шрифта не должна ломать сайт
  await Promise.race([fontsLoaded, timeout]).catch(() => {})
})
