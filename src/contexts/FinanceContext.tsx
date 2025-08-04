import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { FinanceContextType, Account, Category, Transaction, Goal, Budget } from '../types';
import { format } from 'date-fns';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) throw new Error('useFinance must be used within a FinanceProvider');
    return context;
};

// Tipos para os dados de criação
type NewAccountData = { name: string; type: Account['type']; color: string; initialBalance: number; };
type NewCategoryData = Omit<Category, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;
type NewTransactionData = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
type NewGoalData = Pick<Goal, 'name' | 'targetAmount' | 'targetDate'>;

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

                const errors = [accRes.error, catRes.error, despRes.error, recRes.error, goalsRes.error, budgRes.error].filter(Boolean);
                if (errors.length > 0) throw errors[0];

                const adaptedAccounts = (accRes.data || []).map(db => ({ id: db.id, name: db.nome, type: db.tipo, balance: db.saldo_inicial || 0, color: db.cor, isActive: true, createdAt: db.created_at, updatedAt: db.updated_at }) as Account);
                const adaptedCategories = (catRes.data || []).map(db => ({ id: db.id, name: db.nome, type: db.tipo, color: db.cor, icon: db.icone, isActive: true, createdAt: db.created_at, updatedAt: db.updated_at }) as Category);
                const adaptedGoals = (goalsRes.data || []).map(db => ({ id: db.id, name: db.nome, targetAmount: db.valor_alvo, currentAmount: db.valor_atual, targetDate: db.data_alvo, isCompleted: db.valor_atual >= db.valor_alvo, createdAt: db.created_at, updatedAt: db.updated_at }) as Goal);
                const adaptedBudgets = (budgRes.data || []).map(db => ({ ...db, categoryId: db.categoria_id, amount: db.valor, spent: 0, alertThreshold: 0.8, createdAt: db.created_at }) as Budget);
                const adaptedDespesas = (despRes.data || []).map(db => ({ ...db, type: 'expense', amount: db.valor, accountId: db.conta_id, category: db.categoria_id, recurrence: 'none', description: db.descricao, date: db.data }) as Transaction);
                const adaptedReceitas = (recRes.data || []).map(db => ({ ...db, type: 'income', amount: db.valor, accountId: db.conta_id, category: db.categoria_id, recurrence: 'none', description: db.descricao, date: db.data }) as Transaction);
                const allTransactions = [...adaptedDespesas, ...adaptedReceitas];

                const accountsWithRealBalance = adaptedAccounts.map(account => {
                    const balance = allTransactions.filter(t => String(t.accountId) === String(account.id)).reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, account.balance);
                    return { ...account, balance };
                });

                setTransactions(allTransactions);
                setAccounts(accountsWithRealBalance);
                setCategories(adaptedCategories);
                setGoals(adaptedGoals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
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

    const addAccount = async (accountData: NewAccountData) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { data, error } = await supabase.from('contas').insert({ nome: accountData.name, tipo: accountData.type, cor: accountData.color, saldo_inicial: accountData.initialBalance, usuario_id: user.id }).select().single();
        if (error) throw error;
        const newAccount: Account = { id: data.id, name: data.nome, type: data.tipo, balance: data.saldo_inicial, color: data.cor, isActive: true, createdAt: data.created_at, updatedAt: data.updated_at };
        setAccounts(prev => [...prev, newAccount]);
    };
    const updateAccount = async (id: string, updatedFields: Partial<Account>) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { data, error } = await supabase.from('contas').update({ nome: updatedFields.name, tipo: updatedFields.type, cor: updatedFields.color }).eq('id', id).select().single();
        if (error) throw error;
        setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, name: data.nome, type: data.tipo, color: data.cor, updatedAt: data.updated_at } : acc));
    };
    const deleteAccount = async (id: string) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { error } = await supabase.from('contas').delete().match({ id });
        if (error) throw error;
        setAccounts(prev => prev.filter(acc => acc.id !== id));
    };
    const addCategory = async (categoryData: NewCategoryData) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { data, error } = await supabase.from('categorias').insert({ nome: categoryData.name, tipo: categoryData.type, icone: categoryData.icon, cor: categoryData.color, usuario_id: user.id }).select().single();
        if (error) throw error;
        const newCategory: Category = { id: data.id, name: data.nome, type: data.tipo, icon: data.icone, color: data.cor, isActive: true, createdAt: data.created_at, updatedAt: data.updated_at };
        setCategories(prev => [...prev, newCategory]);
    };
    const updateCategory = async (id: string, updatedFields: Partial<Category>) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { data, error } = await supabase.from('categorias').update({ nome: updatedFields.name, tipo: updatedFields.type, icone: updatedFields.icon, cor: updatedFields.color }).eq('id', id).select().single();
        if (error) throw error;
        setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, name: data.nome, type: data.tipo, icon: data.icone, color: data.cor, updatedAt: data.updated_at } : cat));
    };
    const deleteCategory = async (id: string) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { error: expenseError } = await supabase.from('despesas').update({ categoria_id: null }).eq('categoria_id', id);
        if (expenseError) throw new Error("Falha ao atualizar despesas associadas.");
        const { error: incomeError } = await supabase.from('receitas').update({ categoria_id: null }).eq('categoria_id', id);
        if (incomeError) throw new Error("Falha ao atualizar receitas associadas.");
        const { error: deleteError } = await supabase.from('categorias').delete().match({ id });
        if (deleteError) throw deleteError;
        setCategories(prev => prev.filter(cat => cat.id !== id));
        setTransactions(prev => prev.map(t => t.category === id ? { ...t, category: null } : t));
    };
    const addTransaction = async (transaction: NewTransactionData) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const tableName = transaction.type === 'income' ? 'receitas' : 'despesas';
        const { data, error } = await supabase.from(tableName).insert({ descricao: transaction.description, valor: transaction.amount, data: transaction.date, conta_id: transaction.accountId, categoria_id: transaction.category, usuario_id: user.id }).select().single();
        if (error) throw error;
        const newTransaction: Transaction = { id: data.id, type: transaction.type, amount: data.valor, description: data.descricao, category: data.categoria_id, accountId: data.conta_id, date: data.data, recurrence: transaction.recurrence, createdAt: data.created_at, updatedAt: data.created_at };
        setTransactions(prev => [...prev, newTransaction]);
        setAccounts(prev => prev.map(acc => acc.id === newTransaction.accountId ? { ...acc, balance: newTransaction.type === 'income' ? acc.balance + newTransaction.amount : acc.balance - newTransaction.amount } : acc));
    };
    const updateTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const originalTransaction = transactions.find(t => t.id === id);
        if (!originalTransaction) throw new Error("Transação original não encontrada.");
        const tableName = originalTransaction.type === 'income' ? 'receitas' : 'despesas';
        const { data, error } = await supabase.from(tableName).update({ descricao: updatedFields.description, valor: updatedFields.amount, data: updatedFields.date, conta_id: updatedFields.accountId, categoria_id: updatedFields.category }).eq('id', id).select().single();
        if (error) throw error;
        const updatedTransaction: Transaction = { ...originalTransaction, ...updatedFields, updatedAt: data.updated_at };
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        setAccounts(prevAccounts => {
            return prevAccounts.map(acc => {
                let newBalance = acc.balance;
                if (acc.id === originalTransaction.accountId) { newBalance += originalTransaction.type === 'income' ? -originalTransaction.amount : originalTransaction.amount; }
                if (acc.id === updatedTransaction.accountId) { newBalance += updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount; }
                return { ...acc, balance: newBalance };
            });
        });
    };
    const deleteTransaction = async (id: string) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!transactionToDelete) throw new Error("Transação não encontrada.");
        const tableName = transactionToDelete.type === 'income' ? 'receitas' : 'despesas';
        const { error } = await supabase.from(tableName).delete().match({ id });
        if (error) throw error;
        setTransactions(prev => prev.filter(t => t.id !== id));
        setAccounts(prev => prev.map(acc => acc.id === transactionToDelete.accountId ? { ...acc, balance: transactionToDelete.type === 'income' ? acc.balance - transactionToDelete.amount : acc.balance + transactionToDelete.amount } : acc));
    };

    // --- FUNÇÕES DE METAS ---
    const addGoal = async (goalData: NewGoalData) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { data, error } = await supabase.from('metas').insert({ nome: goalData.name, valor_alvo: goalData.targetAmount, data_alvo: goalData.targetDate, valor_atual: 0, usuario_id: user.id }).select().single();
        if (error) throw error;
        const newGoal: Goal = { id: data.id, name: data.nome, targetAmount: data.valor_alvo, currentAmount: data.valor_atual, targetDate: data.data_alvo, isCompleted: false, createdAt: data.created_at, updatedAt: data.updated_at };
        setGoals(prev => [...prev, newGoal].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    };
    const updateGoal = async (id: string, updatedFields: Partial<Pick<Goal, 'currentAmount'>>) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { data, error } = await supabase.from('metas').update({ valor_atual: updatedFields.currentAmount }).eq('id', id).select().single();
        if (error) throw error;
        const isCompleted = data.valor_atual >= data.valor_alvo;
        setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, currentAmount: data.valor_atual, isCompleted } : goal));
    };
    const deleteGoal = async (id: string) => {
        if (!user) throw new Error("Usuário não autenticado.");
        const { error } = await supabase.from('metas').delete().match({ id });
        if (error) throw error;
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    // --- FUNÇÕES DE CÁLCULO ---
    const getTotalBalance = useCallback(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
    const getMonthlyIncome = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.date && t.type === 'income' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const getMonthlyExpenses = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.date && t.type === 'expense' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);

    const value: FinanceContextType = {
        transactions, accounts, categories, budgets, goals,
        isFinanceLoading, financeError,
        addTransaction, updateTransaction, deleteTransaction,
        addAccount, updateAccount, deleteAccount,
        addCategory, updateCategory, deleteCategory,
        addGoal, updateGoal, deleteGoal,
        getTotalBalance, getMonthlyIncome, getMonthlyExpenses,
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};