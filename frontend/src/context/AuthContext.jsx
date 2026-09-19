import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    try {
      const res = await authApi.me()
      setUser(res.data.data)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    const { token, refreshToken, user: u } = res.data.data
    localStorage.setItem('token', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    setUser(u)
    return u
  }

  const register = async (email, password, fullName) => {
    const res = await authApi.register({ email, password, fullName })
    const data = res.data?.data
    // If backend returns a token (auto-verified), log in immediately
    if (data?.token) {
      localStorage.setItem('token', data.token)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      setUser(data.user)
    }
    return data
  }

  const verifyOtp = async (email, otp) => {
    const res = await authApi.verifyOtp({ email, otp })
    const { token, refreshToken, user: u } = res.data.data
    localStorage.setItem('token', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    setUser(u)
    return u
  }

  const loginWithGoogle = async (idToken) => {
    const res = await authApi.google({ idToken })
    const { token, refreshToken, user: u } = res.data.data
    localStorage.setItem('token', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    setUser(u)
    return u
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {}
    }
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
