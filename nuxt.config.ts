// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Чистое SPA для GitHub Pages (статический хостинг, без сервера)
  ssr: false,
  // Тестовый сайт (develop -> /dianamatrix/dev/) собирается с SITE_NOINDEX=true: поисковики его не индексируют.
  // В прод-сборке переменной нет — мета-тега нет.
  app: {
    head: {
      meta: process.env.SITE_NOINDEX === 'true' ? [{ name: 'robots', content: 'noindex' }] : [],
    },
  },
  css: ['~/assets/css/main.css'],
  // GitHub Pages отдаёт только существующие файлы (404.html — один, в корне, у прод-сборки).
  // Чтобы прямой заход на /about работал на обоих сайтах, generate создаёт about/index.html.
  nitro: {
    prerender: {
      routes: ['/about'],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // Автотесты из tests/ проверяются typecheck вместе с кодом приложения (алиасы ~/ и автоимпорты)
  typescript: {
    tsConfig: {
      include: ['../tests/**/*'],
    },
  },
})
