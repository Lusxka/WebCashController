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
                const adaptedCategories = (catRes.data || []).map(c => ({ ...c, id: c.id, name: c.nome, type: c.tipo, color: c.cor, icon: c.icone, isActive: true }) as Category);
                const adaptedGoals = (goalsRes.data || []).map(g => ({ ...g, id: g.id, name: g.nome, targetAmount: g.valor_alvo, currentAmount: g.valor_atual, targetDate: g.data_alvo, isCompleted: g.valor_atual >= g.valor_alvo, createdAt: g.created_at }) as Goal);
                const adaptedBudgets = (budgRes.data || []).map(b => ({ ...b, categoryId: b.categoria_id, amount: b.valor, spent: 0, alertThreshold: 0.8, createdAt: b.created_at }) as Budget);

                const adaptedDespesas = (despRes.data || []).map(t => ({ ...t, type: 'expense', amount: t.valor, accountId: t.conta_id, category: t.categoria_id, recurrence: 'none', updatedAt: t.created_at, createdAt: t.created_at, description: t.descricao, date: t.data }) as Transaction);
                const adaptedReceitas = (recRes.data || []).map(t => ({ ...t, type: 'income', amount: t.valor, accountId: t.conta_id, category: t.categoria_id, recurrence: 'none', updatedAt: t.created_at, createdAt: t.created_at, description: t.descricao, date: t.data }) as Transaction);
                const allTransactions = [...adaptedDespesas, ...adaptedReceitas];

                const accountsWithRealBalance = adaptedAccounts.map(account => {
                    const balance = allTransactions
                        .filter(t => String(t.accountId) === String(account.id))
                        .reduce((acc, curr) => {
                            return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
                        }, account.balance);
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

    // Funções de Contas, Categorias e Transações (sem alterações)
    const addAccount = async (account: Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>): Promise<boolean> => { /* ...código inalterado... */ return false };
    const updateAccount = async (id: string, updatedFields: Partial<Account>): Promise<boolean> => { /* ...código inalterado... */ return false };
    const deleteAccount = async (id: string): Promise<boolean> => { /* ...código inalterado... */ return false };
    const addCategory = async (category: Omit<Category, 'id' | 'isActive'>): Promise<boolean> => { /* ...código inalterado... */ return false };
    const updateCategory = async (id: string, updatedFields: Partial<Category>): Promise<boolean> => { /* ...código inalterado... */ return false };
    const deleteCategory = async (id: string): Promise<boolean> => { /* ...código inalterado... */ return false };
    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => { /* ...código inalterado... */ return false };
    const deleteTransaction = async (id: string): Promise<boolean> => { /* ...código inalterado... */ return false };

    // 👇 --- FUNÇÕES DE METAS IMPLEMENTADAS --- 👇

    const addGoal = async (goal: Pick<Goal, 'name' | 'targetAmount'>): Promise<boolean> => {
        if (!user) return false;
        try {
            const { data, error } = await supabase.from('metas').insert({
                nome: goal.name,
                valor_alvo: goal.targetAmount,
                valor_atual: 0,
                usuario_id: user.id
            }).select().single();
            if (error) throw error;
            const newGoal: Goal = { ...data, id: data.id, name: data.nome, targetAmount: data.valor_alvo, currentAmount: data.valor_atual, targetDate: data.data_alvo, isCompleted: false, createdAt: data.created_at };
            setGoals(prev => [...prev, newGoal]);
            return true;
        } catch (error: any) {
            console.error("Erro ao adicionar meta:", error.message);
            return false;
        }
    };

    const updateGoal = async (id: string, updatedFields: Partial<Pick<Goal, 'name' | 'targetAmount' | 'currentAmount'>>): Promise<boolean> => {
        if (!user) return false;
        try {
            const { data, error } = await supabase.from('metas').update({
                nome: updatedFields.name,
                valor_alvo: updatedFields.targetAmount,
                valor_atual: updatedFields.currentAmount
            }).eq('id', id).select().single();
            if (error) throw error;
            const updatedGoal: Goal = { ...data, id: data.id, name: data.nome, targetAmount: data.valor_alvo, currentAmount: data.valor_atual, targetDate: data.data_alvo, isCompleted: data.valor_atual >= data.valor_alvo, createdAt: data.created_at };
            setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
            return true;
        } catch (error: any) {
            console.error("Erro ao atualizar meta:", error.message);
            return false;
        }
    };

    const deleteGoal = async (id: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const { error } = await supabase.from('metas').delete().match({ id });
            if (error) throw error;
            setGoals(prev => prev.filter(g => g.id !== id));
            return true;
        } catch (error: any) {
            console.error("Erro ao deletar meta:", error.message);
            return false;
        }
    };

    const getTotalBalance = useCallback(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
    const getMonthlyIncome = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.date && t.type === 'income' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const getMonthlyExpenses = useCallback((month = format(new Date(), 'yyyy-MM')) => transactions.filter(t => t.date && t.type === 'expense' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0), [transactions]);

    const value: FinanceContextType = {
        transactions, accounts, categories, budgets, goals,
        isFinanceLoading, financeError,
        addTransaction, deleteTransaction,
        addAccount, updateAccount, deleteAccount,
        addCategory, updateCategory, deleteCategory,
        // 👇 Funções de metas adicionadas ao contexto
        addGoal, updateGoal, deleteGoal,
        getTotalBalance, getMonthlyIncome, getMonthlyExpenses,
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};