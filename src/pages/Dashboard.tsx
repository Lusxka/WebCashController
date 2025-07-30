import React from 'react';
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
  Loader2
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { 
    transactions, 
    accounts, 
    categories, 
    goals,
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    isFinanceLoading,
    financeError
  } = useFinance();

  if (isFinanceLoading) {
    return (
        <div className="flex justify-center items-center h-full p-8">
            <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
        </div>
    );
  }

  if (financeError) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">Ocorreu um erro ao buscar os dados: {financeError}</div>;
  }

  const totalBalance = getTotalBalance();
  const currentMonthIncome = getMonthlyIncome();
  const currentMonthExpenses = getMonthlyExpenses();
  const netBalance = currentMonthIncome - currentMonthExpenses;
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {currentMonthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, index) => (<Cell key={`cell-pie-${entry.name}-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
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
                <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]} labelStyle={{ color: '#374151' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
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
                <div key={`recent-tx-${transaction.id}-${transaction.type}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white`} style={{ backgroundColor: category?.color }}><span className="text-sm">{category?.icon}</span></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{category?.name} • {account?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metas Financeiras</h3>
          <div className="space-y-4">
            {goals.slice(0, 3).map(goal => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              return (
                <div key={`goal-${goal.id}`} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{goal.name}</h4>
                    <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{progress.toFixed(1)}% concluído</p>
                </div>
              )
            })}
            {goals.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma meta definida</p>
                <p className="text-sm">Crie suas primeiras metas financeiras</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;