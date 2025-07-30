import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { FinanceContextType, Account, Category, Transaction, Goal, Budget, User } from '../types'; 
import { format } from 'date-fns';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
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

        const adaptedAccounts = (accRes.data || []).map(dbAccount => ({ id: dbAccount.id, name: dbAccount.nome, type: dbAccount.tipo, balance: dbAccount.saldo_inicial || 0, color: dbAccount.cor, isActive: true, createdAt: dbAccount.created_at, updatedAt: dbAccount.created_at }) as Account);
        const adaptedCategories = (catRes.data || []).map(c => ({...c, id: c.id, name: c.nome, type: c.tipo, color: c.cor, icon: c.icone, isActive: true}) as Category);
        const adaptedGoals = (goalsRes.data || []).map(g => ({...g, targetAmount: g.valor_alvo, currentAmount: g.valor_atual, targetDate: g.data_alvo, isCompleted: false, createdAt: g.created_at}) as Goal);
        const adaptedBudgets = (budgRes.data || []).map(b => ({...b, categoryId: b.categoria_id, amount: b.valor, spent: 0, alertThreshold: 0.8, createdAt: b.created_at}) as Budget);
        
        const adaptedDespesas = (despRes.data || []).map(t => ({...t, type: 'expense', amount: t.valor, accountId: t.conta_id, category: t.categoria_id, recurrence: 'none', updatedAt: t.created_at, createdAt: t.created_at, description: t.descricao, date: t.data }) as Transaction);
        const adaptedReceitas = (recRes.data || []).map(t => ({...t, type: 'income', amount: t.valor, accountId: t.conta_id, category: t.categoria_id, recurrence: 'none', updatedAt: t.created_at, createdAt: t.created_at, description: t.descricao, date: t.data }) as Transaction);
        
        setTransactions([...adaptedDespesas, ...adaptedReceitas]);
        setAccounts(adaptedAccounts);
        setCategories(adaptedCategories);
        setGoals(adaptedGoals);
        setBudgets(adaptedBudgets);

      } catch (error: any) {
        console.error("Erro ao buscar dados financeiros:", error.message);
        setFinanceError(error.message);
      } finally {
        setIsFinanceLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  // --- Funções CRUD ---

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) return false;
    const table = transaction.type === 'income' ? 'receitas' : 'despesas';
    try {
      const { data: dbRecord, error } = await supabase.from(table).insert({ valor: transaction.amount, descricao: transaction.description, data: transaction.date, conta_id: transaction.accountId, categoria_id: transaction.category, usuario_id: user.id }).select().single();
      if (error) throw error;
      const newTransaction: Transaction = { id: dbRecord.id, description: dbRecord.descricao, amount: dbRecord.valor, date: dbRecord.data, type: transaction.type, accountId: dbRecord.conta_id, category: dbRecord.categoria_id, createdAt: dbRecord.created_at, updatedAt: dbRecord.created_at, recurrence: transaction.recurrence };
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      setAccounts(prev => prev.map(acc => acc.id === transaction.accountId ? { ...acc, balance: acc.balance + amountChange } : acc));
      return true;
    } catch (error: any) { console.error("Erro ao adicionar transação:", error.message); return false; }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return false;
    const table = transactionToDelete.type === 'income' ? 'receitas' : 'despesas';
    try {
      const { error } = await supabase.from(table).delete().match({ id });
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      const amountChange = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
      setAccounts(prev => prev.map(acc => acc.id === transactionToDelete.accountId ? { ...acc, balance: acc.balance + amountChange } : acc));
      return true;
    } catch (error: any) { console.error("Erro ao apagar transação:", error.message); return false; }
  };
  
  const addAccount = async (account: Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: dbRecord, error } = await supabase.from('contas').insert({ nome: account.name, tipo: account.type, cor: account.color, saldo_inicial: 0, usuario_id: user.id }).select().single();
      if (error) throw error;
      const newAccount: Account = { id: dbRecord.id, name: dbRecord.nome, type: dbRecord.tipo, balance: dbRecord.saldo_inicial, color: dbRecord.cor, isActive: true, createdAt: dbRecord.created_at, updatedAt: dbRecord.created_at, };
      setAccounts(prev => [...prev, newAccount].sort((a, b) => a.name.localeCompare(b.name)));
      return true;
    } catch (error: any) { console.error("Erro detalhado ao adicionar conta:", error.message); return false; }
  };

  const updateAccount = async (id: string, updatedFields: Partial<Account>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: dbRecord, error } = await supabase.from('contas').update({ nome: updatedFields.name, tipo: updatedFields.type, cor: updatedFields.color }).eq('id', id).select().single();
      if (error) throw error;
      const updatedAccount: Account = { id: dbRecord.id, name: dbRecord.nome, type: dbRecord.tipo, balance: dbRecord.saldo_inicial, color: dbRecord.cor, isActive: true, createdAt: dbRecord.created_at, updatedAt: dbRecord.created_at, };
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc).sort((a, b) => a.name.localeCompare(b.name)));
      return true;
    } catch(error: any) { console.error("Erro detalhado ao atualizar conta:", error.message); return false; }
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    if(!user) return false;
    try {
      const { error } = await supabase.from('contas').delete().match({ id });
      if (error) throw error;
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      return true;
    } catch(error: any) { console.error("Erro detalhado ao apagar conta:", error.message); return false; }
  };
  
  const addCategory = async (category: Omit<Category, 'id' | 'isActive'>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.from('categorias').insert({ nome: category.name, tipo: category.type, icone: category.icon, cor: category.color, usuario_id: user.id }).select().single();
      if (error) throw error;
      const newCategory = { ...data, id: data.id, name: data.nome, type: data.tipo, color: data.cor, icon: data.icone, isActive: true } as Category;
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      return true;
    } catch (error: any) { console.error("Erro ao adicionar categoria:", error.message); return false; }
  };

  const updateCategory = async (id: string, updatedFields: Partial<Category>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.from('categorias').update({ nome: updatedFields.name, tipo: updatedFields.type, icone: updatedFields.icon, cor: updatedFields.color }).eq('id', id).select().single();
      if (error) throw error;
      const updatedCategory = { ...data, id: data.id, name: data.nome, type: data.tipo, color: data.cor, icon: data.icone, isActive: true } as Category;
      setCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat).sort((a, b) => a.name.localeCompare(b.name)));
      return true;
    } catch (error: any) { console.error("Erro ao atualizar categoria:", error.message); return false; }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('categorias').delete().match({ id });
      if (error) throw error;
      setCategories(prev => prev.filter(cat => cat.id !== id));
      return true;
    } catch (error: any) { console.error("Erro ao apagar categoria:", error.message); return false; }
  };

  const getTotalBalance = useCallback(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
  const getMonthlyIncome = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.date && t.type === 'income' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const getMonthlyExpenses = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.date && t.type === 'expense' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const value: FinanceContextType = {
    transactions, accounts, categories, budgets, goals, currentUser: user, isFinanceLoading, financeError,
    addTransaction,
    updateTransaction: () => { console.warn('updateTransaction não implementado'); return Promise.resolve() as unknown as void; },
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget: () => { console.warn('addBudget não implementado'); return Promise.resolve() as unknown as void; },
    updateBudget: () => console.warn('updateBudget não implementado'),
    deleteBudget: () => console.warn('deleteBudget não implementado'),
    addGoal: () => { console.warn('addGoal não implementado'); return Promise.resolve() as unknown as void; },
    updateGoal: () => console.warn('updateGoal não implementado'),
    deleteGoal: () => console.warn('deleteGoal não implementado'),
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    getCategorySpending: () => 0,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};