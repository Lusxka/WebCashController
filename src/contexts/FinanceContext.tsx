import React, { createContext, useContext, useEffect, useState } from 'react'
import { Transaction, Account, Category, Budget, Goal, User, FinanceContextType } from '../types'
import { format } from 'date-fns'

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Alimentação', type: 'expense', color: '#EF4444', icon: '🍽️', isActive: true },
  { id: '2', name: 'Transporte', type: 'expense', color: '#F97316', icon: '🚗', isActive: true },
  { id: '3', name: 'Moradia', type: 'expense', color: '#8B5CF6', icon: '🏠', isActive: true },
  { id: '4', name: 'Saúde', type: 'expense', color: '#10B981', icon: '⚕️', isActive: true },
  { id: '5', name: 'Educação', type: 'expense', color: '#3B82F6', icon: '📚', isActive: true },
  { id: '6', name: 'Lazer', type: 'expense', color: '#EC4899', icon: '🎮', isActive: true },
  { id: '7', name: 'Compras', type: 'expense', color: '#F59E0B', icon: '🛍️', isActive: true },
  { id: '8', name: 'Salário', type: 'income', color: '#059669', icon: '💰', isActive: true },
  { id: '9', name: 'Freelance', type: 'income', color: '#0891B2', icon: '💼', isActive: true },
  { id: '10', name: 'Investimentos', type: 'income', color: '#7C3AED', icon: '📈', isActive: true },
]

const defaultAccounts: Account[] = [
  {
    id: '1',
    name: 'Conta Corrente',
    type: 'bank',
    balance: 2500.00,
    color: '#3B82F6',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Carteira',
    type: 'cash',
    balance: 150.00,
    color: '#059669',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const generateSampleTransactions = (): Transaction[] => {
  const transactions: Transaction[] = []
  const today = new Date()
  
  // Last 30 days of sample transactions
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Random income transaction every 7-10 days
    if (i % 8 === 0) {
      transactions.push({
        id: `income-${i}`,
        type: 'income',
        amount: 3000,
        description: 'Salário',
        category: '8',
        date: format(date, 'yyyy-MM-dd'),
        accountId: '1',
        recurrence: 'monthly',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      })
    }
    
    // Random expense transactions
    if (Math.random() > 0.4) {
      const categories = ['1', '2', '3', '4', '5', '6', '7']
      const amounts = [25.50, 45.00, 120.00, 80.00, 35.00, 200.00, 60.00]
      const descriptions = ['Supermercado', 'Combustível', 'Aluguel', 'Farmácia', 'Curso online', 'Cinema', 'Roupas']
      
      const randomIndex = Math.floor(Math.random() * categories.length)
      
      transactions.push({
        id: `expense-${i}-${randomIndex}`,
        type: 'expense',
        amount: amounts[randomIndex],
        description: descriptions[randomIndex],
        category: categories[randomIndex],
        date: format(date, 'yyyy-MM-dd'),
        accountId: Math.random() > 0.8 ? '2' : '1',
        recurrence: 'none',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      })
    }
  }
  
  return transactions
}

interface FinanceProviderProps {
  children: React.ReactNode
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('webcash-transactions')
    return saved ? JSON.parse(saved) : generateSampleTransactions()
  })
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('webcash-accounts')
    return saved ? JSON.parse(saved) : defaultAccounts
  })
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('webcash-categories')
    return saved ? JSON.parse(saved) : defaultCategories
  })
  
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('webcash-budgets')
    return saved ? JSON.parse(saved) : []
  })
  
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('webcash-goals')
    return saved ? JSON.parse(saved) : []
  })
  
  const [currentUser] = useState<User>({
    id: '1',
    name: 'Usuário',
    email: 'usuario@webcash.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  })

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('webcash-transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('webcash-accounts', JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem('webcash-categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('webcash-budgets', JSON.stringify(budgets))
  }, [budgets])

  useEffect(() => {
    localStorage.setItem('webcash-goals', JSON.stringify(goals))
  }, [goals])

  // Transaction methods
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setTransactions(prev => [newTransaction, ...prev])
    
    // Update account balance
    const account = accounts.find(acc => acc.id === transaction.accountId)
    if (account) {
      const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount
      setAccounts(prev => prev.map(acc => 
        acc.id === transaction.accountId 
          ? { ...acc, balance: acc.balance + balanceChange, updatedAt: new Date().toISOString() }
          : acc
      ))
    }
  }

  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id 
        ? { ...transaction, ...updatedTransaction, updatedAt: new Date().toISOString() }
        : transaction
    ))
  }

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id)
    if (transaction) {
      // Revert account balance
      const account = accounts.find(acc => acc.id === transaction.accountId)
      if (account) {
        const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount
        setAccounts(prev => prev.map(acc => 
          acc.id === transaction.accountId 
            ? { ...acc, balance: acc.balance + balanceChange, updatedAt: new Date().toISOString() }
            : acc
        ))
      }
    }
    setTransactions(prev => prev.filter(transaction => transaction.id !== id))
  }

  // Account methods
  const addAccount = (account: Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setAccounts(prev => [...prev, newAccount])
  }

  const updateAccount = (id: string, updatedAccount: Partial<Account>) => {
    setAccounts(prev => prev.map(account => 
      account.id === id 
        ? { ...account, ...updatedAccount, updatedAt: new Date().toISOString() }
        : account
    ))
  }

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id))
    // Also remove transactions from this account
    setTransactions(prev => prev.filter(transaction => transaction.accountId !== id))
  }

  // Category methods
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString()
    }
    setCategories(prev => [...prev, newCategory])
  }

  const updateCategory = (id: string, updatedCategory: Partial<Category>) => {
    setCategories(prev => prev.map(category => 
      category.id === id ? { ...category, ...updatedCategory } : category
    ))
  }

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id))
  }

  // Budget methods
  const addBudget = (budget: Omit<Budget, 'id' | 'spent' | 'createdAt'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      spent: 0,
      createdAt: new Date().toISOString()
    }
    setBudgets(prev => [...prev, newBudget])
  }

  const updateBudget = (id: string, updatedBudget: Partial<Budget>) => {
    setBudgets(prev => prev.map(budget => 
      budget.id === id ? { ...budget, ...updatedBudget } : budget
    ))
  }

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id))
  }

  // Goal methods
  const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount' | 'isCompleted' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      currentAmount: 0,
      isCompleted: false,
      createdAt: new Date().toISOString()
    }
    setGoals(prev => [...prev, newGoal])
  }

  const updateGoal = (id: string, updatedGoal: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updatedGoal } : goal
    ))
  }

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id))
  }

  // Utility methods
  const getTotalBalance = () => {
    return accounts.filter(acc => acc.isActive).reduce((total, account) => total + account.balance, 0)
  }

  const getMonthlyIncome = (month?: string) => {
    const targetMonth = month || format(new Date(), 'yyyy-MM')
    return transactions
      .filter(t => t.type === 'income' && t.date.startsWith(targetMonth))
      .reduce((total, t) => total + t.amount, 0)
  }

  const getMonthlyExpenses = (month?: string) => {
    const targetMonth = month || format(new Date(), 'yyyy-MM')
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(targetMonth))
      .reduce((total, t) => total + t.amount, 0)
  }

  const getCategorySpending = (categoryId: string, period: 'monthly' | 'weekly') => {
    const now = new Date()
    const startDate = period === 'monthly' 
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return transactions
      .filter(t => 
        t.category === categoryId && 
        t.type === 'expense' && 
        new Date(t.date) >= startDate
      )
      .reduce((total, t) => total + t.amount, 0)
  }

  const value: FinanceContextType = {
    transactions,
    accounts,
    categories, 
    budgets,
    goals,
    currentUser,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    getCategorySpending
  }

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}