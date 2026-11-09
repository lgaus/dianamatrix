// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Reines SPA für GitHub Pages (statisches Hosting, kein Server)
  ssr: false,
  // Тестовый сайт (develop -> /dianamatrix/dev/) собирается с SITE_NOINDEX=true: поисковики его не индексируют.
  // В прод-сборке переменной нет — мета-тега нет.
  app: {
    head: {
      meta: process.env.SITE_NOINDEX === 'true' ? [{ name: 'robots', content: 'noindex' }] : [],
    },
  },
  css: ['~/assets/css/main.css'],
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
