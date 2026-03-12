import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import axios from 'axios'

interface AuthUser {
  userId: number
  username: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: () => void
  logout: () => void
  isAdmin: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const userManager = new UserManager({
  authority: 'http://localhost:8080',
  client_id: 'zeus-web',
  redirect_uri: 'http://localhost:5173/callback',
  scope: 'openid profile',
  response_type: 'code',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    userManager.getUser().then(oidcUser => {
      if (oidcUser && !oidcUser.expired) {
        setUser({
          userId: oidcUser.profile.userId as number,
          username: oidcUser.profile.sub,
          role: oidcUser.profile.role as string,
        })
      }
      setLoading(false)
    })
  }, [])

  // Attach access token to every axios request
  useEffect(() => {
    const interceptorId = axios.interceptors.request.use(async (config) => {
      const oidcUser = await userManager.getUser()
      if (oidcUser?.access_token) {
        config.headers = config.headers ?? {}
        config.headers['Authorization'] = `Bearer ${oidcUser.access_token}`
      }
      return config
    })
    return () => axios.interceptors.request.eject(interceptorId)
  }, [])

  // Clear auth state on 401
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await userManager.removeUser()
          setUser(null)
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptorId)
  }, [])

  const login = () => {
    userManager.signinRedirect()
  }

  const logout = async () => {
    await userManager.removeUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === 'ADMIN',
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
