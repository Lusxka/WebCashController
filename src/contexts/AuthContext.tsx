import React, { createContext, useContext, useEffect, useState } from 'react'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  lastLogin?: string
  isEmailVerified: boolean
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: 'pt-BR' | 'en-US'
    currency: 'BRL' | 'USD' | 'EUR'
    notifications: {
      email: boolean
      push: boolean
      budgetAlerts: boolean
      paymentReminders: boolean
    }
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>
  resendVerification: () => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simular delay de rede para demonstração
  const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 1000))

  // Verificar se há usuário logado no localStorage
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const token = localStorage.getItem('webcash-token')
        const userData = localStorage.getItem('webcash-user')
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          // Verificar se o token não expirou (simulação)
          const tokenData = JSON.parse(atob(token.split('.')[1] || '{}'))
          const isExpired = tokenData.exp && Date.now() >= tokenData.exp * 1000
          
          if (!isExpired) {
            setUser(parsedUser)
          } else {
            // Token expirado, limpar dados
            localStorage.removeItem('webcash-token')
            localStorage.removeItem('webcash-user')
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        localStorage.removeItem('webcash-token')
        localStorage.removeItem('webcash-user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthState()
  }, [])

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true)
    await simulateNetworkDelay()

    try {
      // Validações básicas
      if (!email || !password) {
        return { success: false, error: 'Email e senha são obrigatórios' }
      }

      if (!email.includes('@')) {
        return { success: false, error: 'Email inválido' }
      }

      // Simular verificação de credenciais
      const users = JSON.parse(localStorage.getItem('webcash-registered-users') || '[]')
      const existingUser = users.find((u: any) => u.email === email)

      if (!existingUser) {
        return { success: false, error: 'Usuário não encontrado' }
      }

      if (existingUser.password !== password) {
        return { success: false, error: 'Senha incorreta' }
      }

      // Criar token JWT simulado
      const tokenPayload = {
        userId: existingUser.id,
        email: existingUser.email,
        exp: Math.floor(Date.now() / 1000) + (rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60) // 30 dias ou 1 dia
      }
      
      const token = `header.${btoa(JSON.stringify(tokenPayload))}.signature`

      const userData: User = {
        ...existingUser,
        lastLogin: new Date().toISOString()
      }

      // Salvar no localStorage
      localStorage.setItem('webcash-token', token)
      localStorage.setItem('webcash-user', JSON.stringify(userData))

      // Atualizar usuário na lista
      const updatedUsers = users.map((u: any) => 
        u.id === existingUser.id ? userData : u
      )
      localStorage.setItem('webcash-registered-users', JSON.stringify(updatedUsers))

      setUser(userData)
      return { success: true }

    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    await simulateNetworkDelay()

    try {
      // Validações
      if (!name || !email || !password) {
        return { success: false, error: 'Todos os campos são obrigatórios' }
      }

      if (!email.includes('@')) {
        return { success: false, error: 'Email inválido' }
      }

      if (password.length < 6) {
        return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' }
      }

      // Verificar se usuário já existe
      const users = JSON.parse(localStorage.getItem('webcash-registered-users') || '[]')
      const existingUser = users.find((u: any) => u.email === email)

      if (existingUser) {
        return { success: false, error: 'Email já está em uso' }
      }

      // Criar novo usuário
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role: 'user',
        createdAt: new Date().toISOString(),
        isEmailVerified: false,
        preferences: {
          theme: 'system',
          language: 'pt-BR',
          currency: 'BRL',
          notifications: {
            email: true,
            push: true,
            budgetAlerts: true,
            paymentReminders: true
          }
        }
      }

      // Salvar usuário
      const updatedUsers = [...users, { ...newUser, password }]
      localStorage.setItem('webcash-registered-users', JSON.stringify(updatedUsers))

      return { success: true }

    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('webcash-token')
    localStorage.removeItem('webcash-user')
    setUser(null)
  }

  const forgotPassword = async (email: string) => {
    await simulateNetworkDelay()

    try {
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Email inválido' }
      }

      const users = JSON.parse(localStorage.getItem('webcash-registered-users') || '[]')
      const existingUser = users.find((u: any) => u.email === email)

      if (!existingUser) {
        return { success: false, error: 'Email não encontrado' }
      }

      // Simular envio de email
      console.log(`Email de recuperação enviado para: ${email}`)
      return { success: true }

    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  const resetPassword = async (token: string, newPassword: string) => {
    await simulateNetworkDelay()

    try {
      if (!token || !newPassword) {
        return { success: false, error: 'Token e nova senha são obrigatórios' }
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' }
      }

      // Simular validação de token e atualização de senha
      return { success: true }

    } catch (error) {
      return { success: false, error: 'Token inválido ou expirado' }
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    await simulateNetworkDelay()

    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      const updatedUser = { ...user, ...data }
      
      // Atualizar no localStorage
      localStorage.setItem('webcash-user', JSON.stringify(updatedUser))
      
      // Atualizar na lista de usuários
      const users = JSON.parse(localStorage.getItem('webcash-registered-users') || '[]')
      const updatedUsers = users.map((u: any) => 
        u.id === user.id ? { ...u, ...data } : u
      )
      localStorage.setItem('webcash-registered-users', JSON.stringify(updatedUsers))

      setUser(updatedUser)
      return { success: true }

    } catch (error) {
      return { success: false, error: 'Erro ao atualizar perfil' }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await simulateNetworkDelay()

    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      if (!currentPassword || !newPassword) {
        return { success: false, error: 'Senhas são obrigatórias' }
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' }
      }

      // Verificar senha atual
      const users = JSON.parse(localStorage.getItem('webcash-registered-users') || '[]')
      const existingUser = users.find((u: any) => u.id === user.id)

      if (!existingUser || existingUser.password !== currentPassword) {
        return { success: false, error: 'Senha atual incorreta' }
      }

      // Atualizar senha
      const updatedUsers = users.map((u: any) => 
        u.id === user.id ? { ...u, password: newPassword } : u
      )
      localStorage.setItem('webcash-registered-users', JSON.stringify(updatedUsers))

      return { success: true }

    } catch (error) {
      return { success: false, error: 'Erro ao alterar senha' }
    }
  }

  const verifyEmail = async (token: string) => {
    await simulateNetworkDelay()

    try {
      if (!token) {
        return { success: false, error: 'Token inválido' }
      }

      if (user) {
        const updatedUser = { ...user, isEmailVerified: true }
        await updateProfile(updatedUser)
      }

      return { success: true }

    } catch (error) {
      return { success: false, error: 'Erro ao verificar email' }
    }
  }

  const resendVerification = async () => {
    await simulateNetworkDelay()

    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Simular reenvio de email
      console.log(`Email de verificação reenviado para: ${user.email}`)
      return { success: true }

    } catch (error) {
      return { success: false, error: 'Erro ao reenviar verificação' }
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerification
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}