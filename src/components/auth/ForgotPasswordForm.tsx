import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSwitchToLogin }) => {
  const { forgotPassword, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email é obrigatório')
      return
    }

    const result = await forgotPassword(email)
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Erro ao enviar email de recuperação')
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Email enviado!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Enviamos um link de recuperação para <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Verifique sua caixa de entrada e spam. O link expira em 1 hora.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onSwitchToLogin}
            className="btn-primary w-full"
          >
            Voltar ao login
          </button>
          
          <button
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
            className="btn-secondary w-full"
          >
            Enviar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Esqueceu a senha?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Digite seu email para receber um link de recuperação
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              className="input-field pl-10"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar link de recuperação'
          )}
        </button>

        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </button>
      </form>
    </div>
  )
}

export default ForgotPasswordForm