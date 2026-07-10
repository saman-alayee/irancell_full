export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const userStore = useUserStore()
  if (import.meta.client) userStore.loadFromStorage()

  if (userStore.isLoggedIn) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    if (redirect.startsWith('/')) return navigateTo(redirect)
    return navigateTo('/')
  }
})
