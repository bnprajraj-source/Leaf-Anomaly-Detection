import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe, loginUser, registerUser } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('leaf_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const userData = await getMe()
      setUser(userData)
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('credentials')) {
        localStorage.removeItem('leaf_token')
      }
      // If backend is down (503), keep the token — user can retry later
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const data = await loginUser(email, password)
    localStorage.setItem('leaf_token', data.token)
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password)
    localStorage.setItem('leaf_token', data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('leaf_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
