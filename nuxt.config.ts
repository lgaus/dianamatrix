// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Reines SPA für GitHub Pages (statisches Hosting, kein Server)
  ssr: false,
})
