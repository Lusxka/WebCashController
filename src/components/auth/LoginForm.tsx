import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

interface LoginFormProps {
  onSwitchToRegister: () => void
  onSwitchToForgotPassword: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: 'lucasryanspo@gmail.com', // Valor inicial para facilitar
    password: '',
    rememberMe: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(formData.email, formData.password)
      if (!result.success) {
        setError(result.error || 'Email ou senha inválidos.')
      }
    } catch (err) {
      setError("Falha na comunicação. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Entre na sua conta WebCash
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="input-field pl-10" placeholder="seu@email.com" disabled={isSubmitting} />
          </div>
        </div>

        <div>
          <label htmlFor="password">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className="input-field pl-10 pr-10" placeholder="Sua senha" disabled={isSubmitting} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="rememberMe" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleChange} className="h-4 w-4" />
            <label htmlFor="rememberMe" className="ml-2 block text-sm">Lembrar de mim</label>
          </div>
          <button type="button" onClick={onSwitchToForgotPassword} className="text-sm text-primary-600 hover:underline">Esqueceu a senha?</button>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
          {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>) : ('Entrar')}
        </button>

        <div className="text-center">
          <p className="text-sm">Não tem uma conta?{' '}
            <button type="button" onClick={onSwitchToRegister} className="text-primary-600 font-medium hover:underline">Criar conta</button>
          </p>
        </div>
      </form>
    </div>
  )
}

export default LoginForm;