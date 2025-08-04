import React, { useState, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, endOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart, Pie, Cell,
    AreaChart, Area
} from 'recharts';
import {
    Download,
    FileText,
    TrendingUp,
    TrendingDown,
    Calendar,
    Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Declaração para jspdf-autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

// Componente para Tooltip customizado nos gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 dark:text-white">{label}</p>
                {payload.map((entry: any) => (
                    <p key={entry.name} style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


const Reports: React.FC = () => {
    const { transactions, categories, accounts, isFinanceLoading, financeError } = useFinance();
    const [selectedPeriod, setSelectedPeriod] = useState('current-month');
    const [selectedAccount, setSelectedAccount] = useState('all');

    const { filteredTransactions, dateRangeLabel } = useMemo(() => {
        const now = new Date();
        let start: Date, end: Date, label: string;

        switch (selectedPeriod) {
            case 'last-month':
                const lastMonth = subMonths(now, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                label = format(lastMonth, 'MMMM yyyy', { locale: ptBR });
                break;
            case 'last-3-months':
                start = startOfMonth(subMonths(now, 2));
                end = endOfToday();
                label = 'Últimos 3 meses';
                break;
            case 'last-6-months':
                start = startOfMonth(subMonths(now, 5));
                end = endOfToday();
                label = 'Últimos 6 meses';
                break;
            case 'current-month':
            default:
                start = startOfMonth(now);
                end = endOfMonth(now);
                label = format(now, 'MMMM yyyy', { locale: ptBR });
        }

        const filtered = transactions.filter(transaction => {
            if (!transaction.date) return false;
            const transactionDate = parseISO(transaction.date);
            const inDateRange = transactionDate >= start && transactionDate <= end;
            const inAccount = selectedAccount === 'all' || String(transaction.accountId) === selectedAccount;
            return inDateRange && inAccount;
        });

        return { filteredTransactions: filtered.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()), dateRangeLabel: label };
    }, [transactions, selectedPeriod, selectedAccount]);

    // Cálculos para os cards de resumo e para o PDF
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    const categoryData = useMemo(() => {
        const expenseCategories = categories.filter(cat => cat.type === 'expense');
        const total = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        if (total === 0) return [];
        return expenseCategories.map(category => {
            const amount = filteredTransactions.filter(t => String(t.category) === String(category.id) && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            return { name: category.name, value: amount, color: category.color || '#8884d8', percent: total > 0 ? (amount / total) * 100 : 0 };
        }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categories]);

    const monthlyData = useMemo(() => {
        const evolutionTransactions = transactions.filter(t => selectedAccount === 'all' || String(t.accountId) === selectedAccount);
        return Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const monthKey = format(date, 'yyyy-MM');
            const monthName = format(date, 'MMM', { locale: ptBR });
            const income = evolutionTransactions.filter(t => t.date && t.type === 'income' && t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
            const expense = evolutionTransactions.filter(t => t.date && t.type === 'expense' && t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
            return { month: monthName, Receitas: income, Despesas: expense, Saldo: income - expense };
        });
    }, [transactions, selectedAccount]);

    const generatePDFReport = () => {
        const doc = new jsPDF();
        let startY = 22;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text("Relatório Financeiro", 14, startY);
        startY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Período: ${dateRangeLabel}`, 14, startY);
        startY += 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text("Resumo do Período", 14, startY);
        startY += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total de Receitas: ${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, startY);
        startY += 6;
        doc.text(`Total de Despesas: ${totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, startY);
        startY += 6;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Saldo Líquido: ${netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, startY);
        startY += 12;
        
        const tableColumn = ["Data", "Descrição", "Categoria", "Conta", "Tipo", "Valor"];
        const tableRows: any[] = [];
        filteredTransactions.forEach(t => {
            const category = categories.find(c => c.id === t.category);
            const account = accounts.find(a => a.id === t.accountId);
            tableRows.push([
                format(parseISO(t.date), 'dd/MM/yyyy'),
                t.description,
                category?.name || 'N/A',
                account?.name || 'N/A',
                t.type === 'income' ? 'Receita' : 'Despesa',
                t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: 'grid',
            headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 255] },
            styles: { fontSize: 9 }
        });

        doc.save(`Relatorio_WebCash_${dateRangeLabel.replace(/ /g, '_')}.pdf`);
    };
    
    const exportToCSV = () => {
        const headers = ["Data", "Descrição", "Categoria", "Conta", "Tipo", "Valor"];
        const escapeCsvCell = (cell: any) => {
            const str = String(cell ?? '');
            if (str.includes(',')) return `"${str.replace(/"/g, '""')}"`;
            return str;
        };
        const csvRows = [headers.join(',')];
        filteredTransactions.forEach(t => {
            const category = categories.find(c => c.id === t.category);
            const account = accounts.find(a => a.id === t.accountId);
            const row = [
                escapeCsvCell(format(parseISO(t.date), 'dd/MM/yyyy')),
                escapeCsvCell(t.description),
                escapeCsvCell(category?.name || 'Sem Categoria'),
                escapeCsvCell(account?.name || 'N/A'),
                escapeCsvCell(t.type === 'income' ? 'Receita' : 'Despesa'),
                t.amount.toString().replace('.', ',')
            ];
            csvRows.push(row.join(','));
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Relatorio_WebCash_${dateRangeLabel.replace(/ /g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isFinanceLoading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-16 h-16 animate-spin text-primary-600" /></div>
    }
    if (financeError) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-md">Ocorreu um erro: {financeError}</div>
    }

    return (
        <div className="space-y-6">
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
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Despesas</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Líquido</p>
                            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        {netBalance >= 0 ? <TrendingUp className="w-8 h-8 text-blue-500" /> : <TrendingDown className="w-8 h-8 text-red-500" />}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Despesas por Categoria - {dateRangeLabel}</h3>
                    {categoryData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${percent.toFixed(0)}%)`}>
                                        {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Valor']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (<div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">Nenhuma despesa encontrada no período</div>)}
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evolução Mensal (Últimos 6 Meses)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.8} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F43F5E" stopOpacity={0.8} /><stop offset="95%" stopColor="#F43F5E" stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="Receitas" stroke="#10B981" fillOpacity={1} fill="url(#colorReceitas)" />
                                <Area type="monotone" dataKey="Despesas" stroke="#F43F5E" fillOpacity={1} fill="url(#colorDespesas)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo de Transações - {dateRangeLabel}</h3>
                {filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conta</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTransactions.map(transaction => {
                                    const category = categories.find(cat => String(cat.id) === String(transaction.category))
                                    const account = accounts.find(acc => String(acc.id) === String(transaction.accountId))
                                    return (
                                        <tr key={transaction.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{format(parseISO(transaction.date), 'dd/MM/yyyy')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{category?.name || 'Sem Categoria'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{account?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{transaction.type === 'income' ? 'Receita' : 'Despesa'}</span></td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
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

export default Reports;