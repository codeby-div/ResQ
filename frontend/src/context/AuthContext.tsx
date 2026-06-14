import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import axios from "axios"

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" })

interface User {
  id: number
  username: string
  role: string
  display_name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<User>
  register: (username: string, password: string, role: string, display_name?: string) => Promise<User>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(sessionStorage.getItem("resq_token"))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUser(r.data))
      .catch(() => { sessionStorage.removeItem("resq_token"); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/auth/login", { username, password })
    sessionStorage.setItem("resq_token", data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const register = async (username: string, password: string, role: string, display_name?: string) => {
    const { data } = await api.post("/auth/register", { username, password, role, display_name: display_name || username })
    sessionStorage.setItem("resq_token", data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    sessionStorage.removeItem("resq_token")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
