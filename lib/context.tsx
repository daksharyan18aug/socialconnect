'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  userId: string
  username: string
  token: string
}

interface AuthContextType {
  user: User | null
  login: (data: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('sc_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const login = (data: User) => {
    setUser(data)
    localStorage.setItem('sc_user', JSON.stringify(data))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('sc_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)