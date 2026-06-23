'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  username: string
}

interface AdminContextType {
  user: AdminUser | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedAdmin = localStorage.getItem('hippism_admin')
        if (storedAdmin) {
          setUser(JSON.parse(storedAdmin))
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const adminUser = { username }
        setUser(adminUser)
        localStorage.setItem('hippism_admin', JSON.stringify(adminUser))
        return { success: true }
      }

      return { success: false, error: data.error || 'Invalid credentials' }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('hippism_admin')
    router.push('/admin/login')
  }

  return (
    <AdminContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
