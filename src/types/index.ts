export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  accountId: string
  recurrence?: 'weekly' | 'monthly' | 'none'
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  name: string
  type: 'bank' | 'wallet' | 'cash' | 'credit_card'
  balance: number
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  isActive: boolean
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: 'monthly' | 'weekly'
  spent: number
  alertThreshold: number
  createdAt: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  description?: string
  isCompleted: boolean
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: string
}

export interface FinanceContextType {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  budgets: Budget[]
  goals: Goal[]
  currentUser: User | null
  
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  
  // Account methods
  addAccount: (account: Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => void
  updateAccount: (id: string, account: Partial<Account>) => void
  deleteAccount: (id: string) => void
  
  // Category methods
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  deleteCategory: (id: string) => void
  
  // Budget methods
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'createdAt'>) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  
  // Goal methods
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'isCompleted' | 'createdAt'>) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  
  // Utility methods
  getTotalBalance: () => number
  getMonthlyIncome: (month?: string) => number
  getMonthlyExpenses: (month?: string) => number
  getCategorySpending: (categoryId: string, period: 'monthly' | 'weekly') => number
}