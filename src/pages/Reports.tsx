import React, { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import {
    Download,
    FileText,
    TrendingUp,
    TrendingDown,
    Calendar,
    Filter,
    Loader2
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Corrigindo erro de autoTable no TypeScript
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

const Reports: React.FC = () => {
    const { transactions, categories, accounts, isFinanceLoading, financeError } = useFinance()
    const [selectedPeriod, setSelectedPeriod] = useState('current-month')
    const [selectedAccount, setSelectedAccount] = useState('all')

    const getDateRange = () => {
        const now = new Date()
        switch (selectedPeriod) {
            case 'current-month':
                return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy', { locale: ptBR }) }
            case 'last-month':
                const lastMonth = subMonths(now, 1)
                return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth), label: format(lastMonth, 'MMMM yyyy', { locale: ptBR }) }
            case 'last-3-months':
                return { start: subMonths(startOfMonth(now), 2), end: endOfMonth(now), label: 'Últimos 3 meses' }
            case 'last-6-months':
                return { start: subMonths(startOfMonth(now), 5), end: endOfMonth(now), label: 'Últimos 6 meses' }
            default:
                return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy', { locale: ptBR }) }
        }
    }

    if (isFinanceLoading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-16 h-16 animate-spin text-primary-600" /></div>
    }
    if (financeError) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-md">Ocorreu um erro: {financeError}</div>
    }

    const { start, end, label } = getDateRange()

    const filteredTransactions = transactions.filter(transaction => {
        if (!transaction.date) return false
        const transactionDate = parseISO(transaction.date)
        const inDateRange = transactionDate >= start && transactionDate <= end
        // @ts-ignore
        const inAccount = selectedAccount === 'all' || String(transaction.accountId) === selectedAccount
        return inDateRange && inAccount
    })

    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    // @ts-ignore
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const netBalance = totalIncome - totalExpenses

    const categoryData = categories
        // @ts-ignore
        .filter(cat => cat.type === 'expense')
        .map(category => {
            const amount = filteredTransactions
                // @ts-ignore
                .filter(t => String(t.category) === String(category.id) && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
            return { name: category.name, value: amount, color: category.color }
        })
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i)
        const monthKey = format(date, 'yyyy-MM')
        const monthName = format(date, 'MMM', { locale: ptBR })
        const income = transactions.filter(t => t.date && t.type === 'income' && t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0)
        // @ts-ignore
        const expense = transactions.filter(t => t.date && t.type === 'expense' && t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0)
        return { month: monthName, receitas: income, despesas: expense, saldo: income - expense }
    })
    
    // 👇 FUNÇÃO DE EXPORTAR PARA PDF 👇
    const generatePDFReport = () => {
        const doc = new jsPDF();
        const reportTitle = "Relatório Financeiro";
        const periodLabel = `Período: ${label}`;

        // Título
        doc.setFontSize(18);
        doc.text(reportTitle, 14, 22);
        doc.setFontSize(11);
        doc.text(periodLabel, 14, 30);
        
        // Resumo
        doc.setFontSize(12);
        doc.text("Resumo do Período", 14, 45);
        const summary = [
            `Total de Receitas: R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Total de Despesas: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Saldo Líquido: R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ];
        doc.text(summary, 14, 52);

        // Tabela de transações
        const tableColumn = ["Data", "Descrição", "Categoria", "Conta", "Tipo", "Valor"];
        const tableRows = [];

        for (const transaction of filteredTransactions) {
            const categoryName = categories.find(c => String(c.id) === String(transaction.category))?.name || 'N/A';
            const accountName = accounts.find(a => String(a.id) === String(transaction.accountId))?.name || 'N/A';
            const transactionDate = format(parseISO(transaction.date), 'dd/MM/yyyy');
            const transactionType = transaction.type === 'income' ? 'Receita' : 'Despesa';
            const transactionAmount = `R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            tableRows.push([transactionDate, transaction.description, categoryName, accountName, transactionType, transactionAmount]);
        }
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 70, // Posição inicial da tabela
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }, // Cor do cabeçalho
        });

        // Nome do arquivo
        const fileName = `Relatorio_WebCash_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(fileName);
    };

    // 👇 FUNÇÃO DE EXPORTAR PARA CSV (EXCEL) 👇
    const exportToCSV = () => {
        const headers = ["Data", "Descrição", "Categoria", "Conta", "Tipo", "Valor"];
        
        const rows = filteredTransactions.map(transaction => {
            const categoryName = categories.find(c => String(c.id) === String(transaction.category))?.name || 'N/A';
            const accountName = accounts.find(a => String(a.id) === String(transaction.accountId))?.name || 'N/A';
            const transactionDate = format(parseISO(transaction.date), 'dd/MM/yyyy');
            const transactionType = transaction.type === 'income' ? 'Receita' : 'Despesa';
            // Para CSV, usamos ponto como separador decimal para compatibilidade universal.
            const transactionAmount = transaction.amount.toFixed(2).replace('.', ',');

            return [
                transactionDate,
                `"${transaction.description.replace(/"/g, '""')}"`, // Trata aspas na descrição
                categoryName,
                accountName,
                transactionType,
                transactionAmount
            ].join(';'); // Usar ponto e vírgula como separador para Excel em português
        });

        const csvContent = [headers.join(';'), ...rows].join('\n');

        // Adiciona BOM para garantir que o Excel leia a acentuação corretamente
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = `Export_WebCash_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* O restante do seu JSX permanece o mesmo */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
                    <p className="text-gray-600 dark:text-gray-400">Análise detalhada das suas finanças</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> CSV</button>
                    <button onClick={generatePDFReport} className="btn-primary flex items-center gap-2"><FileText className="w-4 h-4" /> PDF</button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
                    <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="input-field">
                        <option value="current-month">Mês Atual</option>
                        <option value="last-month">Mês Anterior</option>
                        <option value="last-3-months">Últimos 3 Meses</option>
                        <option value="last-6-months">Últimos 6 Meses</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conta</label>
                    <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="input-field">
                        <option value="all">Todas as Contas</option>
                        {accounts.map(account => (<option key={account.id} value={account.id}>{account.name}</option>))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Receitas</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Despesas</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Líquido</p>
                            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        {netBalance >= 0 ? <TrendingUp className="w-8 h-8 text-blue-500" /> : <TrendingDown className="w-8 h-8 text-red-500" />}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Despesas por Categoria - {label}</h3>
                    {categoryData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                    <Bar dataKey="value" name="Valor">
                                        {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">Nenhuma despesa encontrada no período</div>
                    )}
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evolução Mensal (Últimos 6 Meses)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                <Line type="monotone" dataKey="receitas" stroke="#10B981" name="Receitas" strokeWidth={2} />
                                <Line type="monotone" dataKey="despesas" stroke="#F43F5E" name="Despesas" strokeWidth={2} />
                                <Line type="monotone" dataKey="saldo" stroke="#3B82F6" name="Saldo" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo de Transações - {label}</h3>
                {filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTransactions.slice(0, 10).map(transaction => {
                                    const category = categories.find(cat => String(cat.id) === String(transaction.category))
                                    return (
                                        <tr key={transaction.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{category?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{format(parseISO(transaction.date), 'dd/MM/yyyy')}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma transação encontrada</h3>
                        <p className="text-gray-600 dark:text-gray-400">Não há transações no período selecionado.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Reports