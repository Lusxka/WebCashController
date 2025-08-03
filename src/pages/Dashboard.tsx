import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Plus,
    CheckCircle,
    Trash2,
    X
} from 'lucide-react';
import { Goal } from '../types';

// Componente para o Card de Meta (Lógica de exibição)
const GoalCard: React.FC<{ goal: Goal; onAddFunds: (goal: Goal) => void; onDelete: (id: string) => void; }> = ({ goal, onAddFunds, onDelete }) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const isCompleted = progress >= 100;

    return (
        <div className={`p-4 rounded-lg shadow-md transition-all duration-300 ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-700'}`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{goal.name}</h4>
                {isCompleted ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
            </div>
            {isCompleted ? (
                <div className="text-center py-4">
                    <p className="font-bold text-green-600 dark:text-green-400 text-lg">Parabéns!</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Meta concluída!</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>{goal.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span className="font-semibold">{goal.targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div className="bg-primary-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <p className="text-right text-sm font-semibold text-primary-700 dark:text-primary-300 mt-2">{progress.toFixed(1)}%</p>
                </>
            )}
             <div className="flex items-center justify-end gap-2 mt-3">
                 {/* 👇 BOTÃO "ADICIONAR VALOR" ATUALIZADO AQUI 👇 */}
                <button 
                    onClick={() => onAddFunds(goal)} 
                    disabled={isCompleted} 
                    className="bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-md shadow-sm py-1 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75 transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    Adicionar Valor
                </button>
                <button onClick={() => onDelete(goal.id)} className="btn-danger-outline btn-sm"><Trash2 className="w-4 h-4"/></button>
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const {
        transactions, accounts, categories, goals,
        addGoal, updateGoal, deleteGoal,
        getTotalBalance, getMonthlyIncome, getMonthlyExpenses,
        isFinanceLoading, financeError
    } = useFinance();

    const [isAddGoalModalOpen, setAddGoalModalOpen] = useState(false);
    const [isAddFundsModalOpen, setAddFundsModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalAmount, setNewGoalAmount] = useState('');
    const [fundsToAdd, setFundsToAdd] = useState('');

    const handleOpenAddFundsModal = (goal: Goal) => {
        setSelectedGoal(goal);
        setAddFundsModalOpen(true);
    };
    
    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(newGoalAmount);
        if (newGoalName && amount > 0) {
            await addGoal({ name: newGoalName, targetAmount: amount });
            setNewGoalName('');
            setNewGoalAmount('');
            setAddGoalModalOpen(false);
        }
    };
    
    const handleAddFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(fundsToAdd);
        if (selectedGoal && amount > 0) {
            const newCurrentAmount = selectedGoal.currentAmount + amount;
            await updateGoal(selectedGoal.id, { currentAmount: newCurrentAmount });
            setFundsToAdd('');
            setAddFundsModalOpen(false);
            setSelectedGoal(null);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        if(confirm('Tem certeza que deseja excluir esta meta?')) {
            await deleteGoal(id);
        }
    }

    if (isFinanceLoading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-16 h-16 animate-spin text-primary-600" /></div>;
    }
    if (financeError) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-md">Ocorreu um erro: {financeError}</div>;
    }

    const totalBalance = getTotalBalance();
    const currentMonthIncome = getMonthlyIncome();
    const currentMonthExpenses = getMonthlyExpenses();
    const savingsPercentage = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome * 100) : 0;

    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    const pieData = expenseCategories.map(category => {
        const amount = transactions
            .filter(t => t.date && String(t.category) === String(category.id) && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
        return { name: category.name, value: amount, color: category.color }
    }).filter(item => item.value > 0);

    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM', { locale: ptBR });
        const income = transactions.filter(t => t.date && t.type === 'income' && t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.date && t.type === 'expense' && t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
        return { month: monthName, receitas: income, despesas: expense };
    }).reverse();

    const recentTransactions = [...transactions]
        .filter(t => t.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Total</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full">
                            <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receitas (mês)</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentMonthIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas (mês)</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{currentMonthExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Economia</p>
                            <p className={`text-2xl font-bold ${savingsPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{savingsPercentage.toFixed(1)}%</p>
                        </div>
                        <div className={`p-3 rounded-full ${savingsPercentage >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                            {savingsPercentage >= 0 ? (<TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />) : (<TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Despesas por Categoria</h3>
                    {pieData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {pieData.map((entry, index) => (<Cell key={`cell-pie-${entry.name}-${index}`} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Valor']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (<div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">Nenhuma despesa encontrada</div>)}
                </div>
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receitas vs Despesas (últimos 6 meses)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={last6Months}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
                                <YAxis tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
                                <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]} labelStyle={{ color: '#374151' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                                <Bar dataKey="receitas" fill="#059669" name="Receitas" />
                                <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transações Recentes</h3>
                    <div className="space-y-3">
                        {recentTransactions.map(transaction => {
                            const category = categories.find(cat => String(cat.id) === String(transaction.category));
                            const account = accounts.find(acc => String(acc.id) === String(transaction.accountId));
                            return (
                                <div key={`recent-tx-${transaction.id}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white`} style={{ backgroundColor: category?.color }}><span className="text-sm">{category?.icon}</span></div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{category?.name} • {account?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {transaction.type === 'income' ? '+' : '-'} {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{format(parseISO(transaction.date), 'dd/MM', { locale: ptBR })}</p>
                                    </div>
                                </div>
                            )
                        })}
                        {recentTransactions.length === 0 && (<div className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma transação encontrada</div>)}
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Metas Financeiras</h3>
                        <button 
                            onClick={() => setAddGoalModalOpen(true)} 
                            className="bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-md shadow-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75 flex items-center gap-2 transition duration-200 ease-in-out">
                            <Plus className="w-4 h-4" /> Nova Meta
                        </button>
                    </div>
                    <div className="space-y-4">
                        {goals.length > 0 ? goals.slice(0, 3).map(goal => (
                            <GoalCard key={goal.id} goal={goal} onAddFunds={handleOpenAddFundsModal} onDelete={handleDeleteGoal} />
                        )) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Nenhuma meta definida</p>
                                <p className="text-sm">Clique em "Nova Meta" para começar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isAddGoalModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                        <form onSubmit={handleAddGoal} className="p-6 space-y-4">
                             <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Criar Nova Meta</h2>
                                <button type="button" onClick={() => setAddGoalModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X/></button>
                             </div>
                            <div>
                                <label className="label-form">Nome da Meta</label>
                                <input type="text" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className="input-field" placeholder="Ex: Viagem para a praia" required />
                            </div>
                            <div>
                                <label className="label-form">Valor Alvo (R$)</label>
                                <input type="number" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} className="input-field" placeholder="Ex: 5000" min="0.01" step="0.01" required />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setAddGoalModalOpen(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Meta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isAddFundsModalOpen && selectedGoal && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                        <form onSubmit={handleAddFunds} className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Valor</h2>
                                <button type="button" onClick={() => setAddFundsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X/></button>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">Meta: <span className="font-semibold">{selectedGoal.name}</span></p>
                            <div>
                                <label className="label-form">Valor a Adicionar (R$)</label>
                                <input type="number" value={fundsToAdd} onChange={e => setFundsToAdd(e.target.value)} className="input-field" placeholder="Ex: 100" min="0.01" step="0.01" required autoFocus/>
                            </div>
                             <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setAddFundsModalOpen(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Adicionar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;