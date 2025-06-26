import React, { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const Reports: React.FC = () => {
  const { transactions, categories, accounts } = useFinance()
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [selectedAccount, setSelectedAccount] = useState('all')

  const getDateRange = () => {
    const now = new Date()
    switch (selectedPeriod) {
      case 'current-month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'MMMM yyyy', { locale: ptBR })
        }
      case 'last-month':
        const lastMonth = subMonths(now, 1)
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
          label: format(lastMonth, 'MMMM yyyy', { locale: ptBR })
        }
      case 'last-3-months':
        return {
          start: subMonths(startOfMonth(now), 2),
          end: endOfMonth(now),
          label: 'Últimos 3 meses'
        }
      case 'last-6-months':
        return {
          start: subMonths(startOfMonth(now), 5),
          end: endOfMonth(now),
          label: 'Últimos 6 meses'
        }
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'MMMM yyyy', { locale: ptBR })
        }
    }
  }

  const { start, end, label } = getDateRange()

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const inDateRange = transactionDate >= start && transactionDate <= end
    const inAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount
    return inDateRange && inAccount
  })

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = totalIncome - totalExpenses

  // Dados para gráfico de categorias
  const categoryData = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const amount = filteredTransactions
        .filter(t => t.category === category.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      return {
        name: category.name,
        value: amount,
        color: category.color
      }
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  // Dados para gráfico de evolução mensal
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    const monthKey = format(date, 'yyyy-MM')
    const monthName = format(date, 'MMM', { locale: ptBR })
    
    const income = transactions
      .filter(t => t.type === 'income' && t.date.startsWith(monthKey))
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(monthKey))
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      month: monthName,
      receitas: income,
      despesas: expense,
      saldo: income - expense
    }
  })

  const generatePDFReport = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Relatório Financeiro - WebCash', 20, 30)
    
    // Período
    doc.setFontSize(12)
    doc.text(`Período: ${label}`, 20, 45)
    
    if (selectedAccount !== 'all') {
      const account = accounts.find(acc => acc.id === selectedAccount)
      doc.text(`Conta: ${account?.name}`, 20, 55)
    }
    
    // Resumo
    doc.setFontSize(14)
    doc.text('Resumo', 20, 75)
    
    doc.setFontSize(11)
    doc.text(`Receitas: R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 90)
    doc.text(`Despesas: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 105)
    doc.text(`Saldo: R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 120)
    
    // Transações
    if (filteredTransactions.length > 0) {
      const tableData = filteredTransactions.slice(0, 20).map(transaction => {
        const category = categories.find(cat => cat.id === transaction.category)
        return [
          transaction.description,
          category?.name || '',
          transaction.type === 'income' ? 'Receita' : 'Despesa',
          `R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          format(new Date(transaction.date), 'dd/MM/yyyy')
        ]
      })

      doc.autoTable({
        head: [['Descrição', 'Categoria', 'Tipo', 'Valor', 'Data']],
        body: tableData,
        startY: 140,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] }
      })
    }
    
    doc.save(`relatorio-webcash-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  const exportToCSV = () => {
    const csvData = filteredTransactions.map(transaction => {
      const category = categories.find(cat => cat.id === transaction.category)
      const account = accounts.find(acc => acc.id === transaction.accountId)
      
      return {
        'Descrição': transaction.description,
        'Categoria': category?.name || '',
        'Conta': account?.name || '',
        'Tipo': transaction.type === 'income' ? 'Receita' : 'Despesa',
        'Valor': transaction.amount,
        'Data': transaction.date,
        'Recorrência': transaction.recurrence === 'none' ? 'Não se repete' : 
                      transaction.recurrence === 'weekly' ? 'Semanal' : 'Mensal'
      }
    })

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transacoes-webcash-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análise detalhada das suas finanças
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={generatePDFReport}
            className="btn-primary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Período
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field"
          >
            <option value="current-month">Mês Atual</option>
            <option value="last-month">Mês Anterior</option>
            <option value="last-3-months">Últimos 3 Meses</option>
            <option value="last-6-months">Últimos 6 Meses</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Conta
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="input-field"
          >
            <option value="all">Todas as Contas</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Receitas
              </p>
              <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Despesas
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Saldo Líquido
              </p>
              <p className={`text-2xl font-bold ${
                netBalance >= 0 
                  ? 'text-secondary-600 dark:text-secondary-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`p-2 rounded-full ${
              netBalance >= 0 
                ? 'bg-secondary-100 dark:bg-secondary-900/20' 
                : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              {netBalance >= 0 ? (
                <TrendingUp className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Despesas por Categoria - {label}
          </h3>
          {categoryData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor'
                    ]}
                  />
                  <Bar dataKey="value" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Nenhuma despesa encontrada no período
            </div>
          )}
        </div>

        {/* Monthly Evolution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Evolução Mensal (Últimos 6 Meses)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip 
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke="#059669" 
                  strokeWidth={2}
                  name="Receitas"
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Despesas"
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Saldo"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumo de Transações - {label}
        </h3>
        
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.slice(0, 10).map(transaction => {
                  const category = categories.find(cat => cat.id === transaction.category)
                  return (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {category?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/20 dark:text-secondary-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'income'
                          ? 'text-secondary-600 dark:text-secondary-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredTransactions.length > 10 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Exibindo 10 de {filteredTransactions.length} transações
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Não há transações no período selecionado
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports