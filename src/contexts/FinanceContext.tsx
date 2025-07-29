import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { FinanceContextType, Account, Category, Transaction, Goal, Budget, User } from '../types'; 
import { format } from 'date-fns';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Estados para todos os dados financeiros
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Estados de carregamento e erro para os dados financeiros
  const [isFinanceLoading, setIsFinanceLoading] = useState(true);
  const [financeError, setFinanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsFinanceLoading(false);
      setAccounts([]); setCategories([]); setTransactions([]); setGoals([]); setBudgets([]);
      return;
    }

    const fetchData = async () => {
      setIsFinanceLoading(true);
      setFinanceError(null);
      try {
        const [accRes, catRes, despRes, recRes, goalsRes, budgRes] = await Promise.all([
          supabase.from('contas').select('*').eq('usuario_id', user.id),
          supabase.from('categorias').select('*').eq('usuario_id', user.id),
          supabase.from('despesas').select('*').eq('usuario_id', user.id),
          supabase.from('receitas').select('*').eq('usuario_id', user.id),
          supabase.from('metas').select('*').eq('usuario_id', user.id),
          supabase.from('orcamentos').select('*').eq('usuario_id', user.id),
        ]);

        if (accRes.error) throw accRes.error;
        if (catRes.error) throw catRes.error;
        if (despRes.error) throw despRes.error;
        if (recRes.error) throw recRes.error;
        if (goalsRes.error) throw goalsRes.error;
        if (budgRes.error) throw budgRes.error;

        // Adaptação dos nomes de colunas do DB para as propriedades do frontend
        const adaptedAccounts = (accRes.data || []).map(a => ({ ...a, balance: a.saldo_inicial || 0, type: a.tipo, isActive: true, updatedAt: a.created_at }) as Account);
        const adaptedCategories = (catRes.data || []).map(c => ({...c, isActive: true, icon: c.icone}) as Category);
        const adaptedDespesas = (despRes.data || []).map(t => ({...t, type: 'expense', amount: t.valor, accountId: t.conta_id, recurrence: 'none', updatedAt: t.created_at}) as Transaction);
        const adaptedReceitas = (recRes.data || []).map(t => ({...t, type: 'income', amount: t.valor, accountId: t.conta_id, recurrence: 'none', updatedAt: t.created_at}) as Transaction);
        const adaptedGoals = (goalsRes.data || []).map(g => ({...g, targetAmount: g.valor_alvo, currentAmount: g.valor_atual, targetDate: g.data_alvo, isCompleted: false}) as Goal);
        const adaptedBudgets = (budgRes.data || []).map(b => ({...b, categoryId: b.categoria_id, amount: b.valor, spent: 0, alertThreshold: 0.8}) as Budget);
        
        setAccounts(adaptedAccounts);
        setCategories(adaptedCategories);
        setTransactions([...adaptedDespesas, ...adaptedReceitas]);
        setGoals(adaptedGoals);
        setBudgets(adaptedBudgets);

      } catch (error: any) {
        console.error("Erro ao buscar dados financeiros:", error);
        setFinanceError(error.message);
      } finally {
        setIsFinanceLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  const getTotalBalance = useCallback(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
  const getMonthlyIncome = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.type === 'income' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const getMonthlyExpenses = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.type === 'expense' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const addAccount = async (account: Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => { /* ... */ };

  // AQUI ESTÁ A CORREÇÃO PRINCIPAL
  const value: FinanceContextType = {
    accounts,
    categories,
    transactions,
    goals,
    budgets,
    currentUser: user,
    isFinanceLoading,   // <-- Adicionado para corrigir o erro
    financeError,       // <-- Adicionado para corrigir o erro
    
    // Funções
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    addAccount,
    
    // Funções placeholder para o resto da interface
    updateAccount: () => console.warn('updateAccount não implementado'),
    deleteAccount: () => console.warn('deleteAccount não implementado'),
    addTransaction: () => console.warn('addTransaction não implementado'),
    updateTransaction: () => console.warn('updateTransaction não implementado'),
    deleteTransaction: () => console.warn('deleteTransaction não implementado'),
    addCategory: () => console.warn('addCategory não implementado'),
    updateCategory: () => console.warn('updateCategory não implementado'),
    deleteCategory: () => console.warn('deleteCategory não implementado'),
    addBudget: () => console.warn('addBudget não implementado'),
    updateBudget: () => console.warn('updateBudget não implementado'),
    deleteBudget: () => console.warn('deleteBudget não implementado'),
    addGoal: () => console.warn('addGoal não implementado'),
    updateGoal: () => console.warn('updateGoal não implementado'),
    deleteGoal: () => console.warn('deleteGoal não implementado'),
    getCategorySpending: () => 0,
  };

  // O Provider SEMPRE renderiza os filhos, delegando o controlo do UI de carregamento
  // para os componentes que consomem o contexto (como o Dashboard).
  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};