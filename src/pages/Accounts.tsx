import React, { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { 
  Plus, 
  Edit2, 
  Trash2,
  Wallet,
  CreditCard,
  Banknote,
  Building2
} from 'lucide-react'

const Accounts: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as 'bank' | 'wallet' | 'cash' | 'credit_card',
    color: '#3B82F6'
  })

  const accountTypes = [
    { value: 'bank', label: 'Conta Bancária', icon: Building2 },
    { value: 'wallet', label: 'Carteira Digital', icon: Wallet },
    { value: 'cash', label: 'Dinheiro', icon: Banknote },
    { value: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard }
  ]

  const colors = [
    '#3B82F6', '#059669', '#DC2626', '#7C3AED', 
    '#EA580C', '#0891B2', '#BE185D', '#65A30D'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Por favor, insira o nome da conta')
      return
    }

    if (editingAccount) {
      updateAccount(editingAccount, formData)
      setEditingAccount(null)
    } else {
      addAccount(formData)
    }

    setFormData({
      name: '',
      type: 'bank',
      color: '#3B82F6'
    })
    setShowAddModal(false)
  }

  const handleEdit = (account: any) => {
    setFormData({
      name: account.name,
      type: account.type,
      color: account.color
    })
    setEditingAccount(account.id)
    setShowAddModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta? Todas as transações relacionadas também serão removidas.')) {
      deleteAccount(id)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bank',
      color: '#3B82F6'
    })
    setEditingAccount(null)
    setShowAddModal(false)
  }

  const getAccountIcon = (type: string) => {
    const accountType = accountTypes.find(t => t.value === type)
    const Icon = accountType?.icon || Wallet
    return Icon
  }

  const getAccountTypeLabel = (type: string) => {
    return accountTypes.find(t => t.value === type)?.label || 'Conta'
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas contas e carteiras
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Conta
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 mb-1">Saldo Total</p>
            <p className="text-3xl font-bold">
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-primary-200 text-sm mt-1">
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''} ativa{accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-full">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => {
          const Icon = getAccountIcon(account.type)
          
          return (
            <div key={account.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: account.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {account.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {getAccountTypeLabel(account.type)}
                </p>
                <p className={`text-xl font-bold ${
                  account.balance >= 0 
                    ? 'text-secondary-600 dark:text-secondary-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              {!account.isActive && (
                <div className="mt-3 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 text-center">
                  Conta Inativa
                </div>
              )}
            </div>
          )
        })}
        
        {accounts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Wallet className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma conta encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comece adicionando sua primeira conta para gerenciar suas finanças
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Adicionar Primeira Conta
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Conta *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Conta Corrente, Nubank..."
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Conta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {accountTypes.map(type => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type.value as any })}
                          className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                            formData.type === type.value
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cor
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          formData.color === color
                            ? 'border-gray-400 dark:border-gray-300 scale-110'
                            : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingAccount ? 'Salvar' : 'Criar Conta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts