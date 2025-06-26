import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthLayout from './AuthLayout'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'

type AuthMode = 'login' | 'register' | 'forgot-password'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  // Criar usuário demo se não existir
  React.useEffect(() => {
    const users = JSON.parse(localStorage.getItem('webcash-registered-users') || '[]')
    const demoUser = users.find((u: any) => u.email === 'demo@webcash.com')
    
    if (!demoUser) {
      const newDemoUser = {
        id: 'demo-user-id',
        name: 'Usuário Demo',
        email: 'demo@webcash.com',
        password: 'demo123',
        role: 'user',
        createdAt: new Date().toISOString(),
        isEmailVerified: true,
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
      
      const updatedUsers = [...users, newDemoUser]
      localStorage.setItem('webcash-registered-users', JSON.stringify(updatedUsers))
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl font-bold text-white">W</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando WebCash...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        {authMode === 'login' && (
          <LoginForm
            onSwitchToRegister={() => setAuthMode('register')}
            onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
          />
        )}
        {authMode === 'register' && (
          <RegisterForm
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
        {authMode === 'forgot-password' && (
          <ForgotPasswordForm
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </AuthLayout>
    )
  }

  return <>{children}</>
}

export default AuthGuard