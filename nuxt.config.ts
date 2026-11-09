// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Reines SPA für GitHub Pages (statisches Hosting, kein Server)
  ssr: false,
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
