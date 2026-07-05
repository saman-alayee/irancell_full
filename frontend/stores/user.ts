import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: null as string | null,
    user: null as {
      id: string
      firstName: string
      lastName: string
      fatherName?: string
      nationalId?: string
      mobile: string
      secondMobile?: string
      email?: string
    } | null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    fullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
  },

  actions: {
    loadFromStorage() {
      if (import.meta.client) {
        this.token = localStorage.getItem('user_token')
        const user = localStorage.getItem('user_data')
        if (user) this.user = JSON.parse(user)
      }
    },

    async sendOtp(mobile: string, purpose: 'register' | 'login') {
      const { apiFetch } = useApi()
      return apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ mobile, purpose }),
      })
    },

    async register(data: {
      firstName: string
      lastName: string
      fatherName: string
      nationalId: string
      mobile: string
      secondMobile: string
      email?: string
      password: string
      code: string
    }) {
      const { apiFetch } = useApi()
      const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) })
      this.setSession(res.data.token, res.data.user)
    },

    async login(mobile: string, password: string) {
      const { apiFetch } = useApi()
      const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ mobile, password }) })
      this.setSession(res.data.token, res.data.user)
    },

    async loginWithOtp(mobile: string, code: string) {
      const { apiFetch } = useApi()
      const res = await apiFetch('/auth/login/otp', { method: 'POST', body: JSON.stringify({ mobile, code }) })
      this.setSession(res.data.token, res.data.user)
    },

    setSession(token: string, user: any) {
      this.token = token
      this.user = user
      if (import.meta.client) {
        localStorage.setItem('user_token', token)
        localStorage.setItem('user_data', JSON.stringify(user))
      }
    },

    logout() {
      this.token = null
      this.user = null
      if (import.meta.client) {
        localStorage.removeItem('user_token')
        localStorage.removeItem('user_data')
      }
    },
  },
})
