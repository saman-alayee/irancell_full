export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    resolve: {
      dedupe: ['vue', 'vue-router'],
    },
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    apiBaseInternal: process.env.API_BASE_INTERNAL || 'http://127.0.0.1:3001/api',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:3001/api',
    },
  },
  nitro: {
    devProxy: {
      '/api': { target: 'http://127.0.0.1:3001/api', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:3001/uploads', changeOrigin: true },
    },
  },
  app: {
    head: {
      title: 'فروشگاه ۳۱۰۳۸ ایرانسل',
      titleTemplate: '%s',
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'فروشگاه محصولات دیجیتال ایرانسل — شماره VIP و محصولات جانبی' },
      ],
      link: [
        { rel: 'icon', type: 'image/jpeg', href: '/favicon.jfif' },
        { rel: 'apple-touch-icon', href: '/irancell-logo.jfif' },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
        },
      ],
    },
  },
})
