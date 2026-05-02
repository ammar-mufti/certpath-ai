import { create } from 'zustand'
import { getStoredToken, storeToken, clearToken, parseJwt, isTokenValid } from '../services/auth'

export interface AuthUser {
  id: string
  login: string
  name: string
  email: string
  avatar: string | null
  provider: 'github' | 'google' | 'email'
  isAdmin?: boolean
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  init: () => void
  setAuth: (user: AuthUser, token: string) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  init() {
    const token = getStoredToken()
    if (token && isTokenValid(token)) {
      const payload = parseJwt(token) as AuthUser | null
      if (payload) {
        set({
          token,
          user: {
            id: payload.id ?? `legacy_${payload.login}`,
            login: payload.login,
            name: payload.name ?? payload.login,
            email: payload.email ?? '',
            avatar: payload.avatar ?? null,
            provider: payload.provider ?? 'github',
            isAdmin: payload.isAdmin === true,
          },
          isLoading: false,
        })
        return
      }
    }
    clearToken()
    set({ isLoading: false })
  },

  setAuth(user: AuthUser, token: string) {
    storeToken(token)
    set({ token, user, isLoading: false })
  },

  setToken(token: string) {
    storeToken(token)
    const payload = parseJwt(token) as AuthUser | null
    if (payload) {
      set({
        token,
        isLoading: false,
        user: {
          id: payload.id ?? `legacy_${payload.login}`,
          login: payload.login,
          name: payload.name ?? payload.login,
          email: payload.email ?? '',
          avatar: payload.avatar ?? null,
          provider: payload.provider ?? 'github',
          isAdmin: payload.isAdmin === true,
        },
      })
    }
  },

  logout() {
    clearToken()
    set({ user: null, token: null })
  },
}))
