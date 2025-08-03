import React, { useState, useEffect } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Transaction } from '../types';
import { format, parseISO } from 'date-fns';
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import CurrencyInput from 'react-currency-input-field'; // Importe o novo componente

const Transactions: React.FC = () => {
    const { transactions, accounts, categories, addTransaction, updateTransaction, deleteTransaction, isFinanceLoading, financeError } = useFinance();

    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

    const initialFormState = {
        type: 'expense' as 'income' | 'expense',
        amount: '' as string | undefined,
        description: '',
        category: '',
        accountId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        recurrence: 'none' as 'weekly' | 'monthly' | 'none'
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (showAddModal) {
            if (editingTransaction) {
                setFormData({
                    type: editingTransaction.type,
                    amount: editingTransaction.amount.toString(),
                    description: editingTransaction.description,
                    category: editingTransaction.category,
                    accountId: editingTransaction.accountId,
                    date: editingTransaction.date,
                    recurrence: editingTransaction.recurrence || 'none'
                });
            } else {
                setFormData(initialFormState);
            }
        }
    }, [showAddModal, editingTransaction]);

    const filteredTransactions = transactions.filter(t => 
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) && 
        (filterType === 'all' || t.type === filterType)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description || !formData.category || !formData.accountId) {
            setFormError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        const transactionData = { ...formData, amount: parseFloat(formData.amount), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        
        // @ts-ignore
        const success = editingTransaction
            // @ts-ignore
            ? await updateTransaction(editingTransaction.id, transactionData)
            : await addTransaction(transactionData);

        setIsSubmitting(false);
        if (success) {
            resetForm();
        } else {
            setFormError("Não foi possível salvar a transação. Tente novamente.");
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowAddModal(true);
    };

    const handleDelete = (id: string) => {
        setTransactionToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete);
            setTransactionToDelete(null);
            setShowDeleteConfirm(false);
        }
    };

    const resetForm = () => {
        setShowAddModal(false);
        setEditingTransaction(null);
        setFormError(null);
        setFormData(initialFormState);
    };

    const availableCategories = categories.filter(cat => cat.type === formData.type && cat.isActive);

    if (isFinanceLoading) return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-16 h-16 animate-spin text-primary-600" /></div>;
    if (financeError) return <div className="p-4 bg-red-100 text-red-700 rounded-md">Erro: {financeError}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold dark:text-white">Transações</h1>
                <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18}/> Nova Transação</button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar por descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-10" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg font-medium ${filterType === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Todas</button>
                    <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg font-medium ${filterType === 'income' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Receitas</button>
                    <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg font-medium ${filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Despesas</button>
                </div>
            </div>

            <div className="space-y-3">
                {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => {
                    const category = categories.find(c => String(c.id) === String(transaction.category));
                    const account = accounts.find(a => String(a.id) === String(transaction.accountId));
                    return (
                        <div key={`tx-${transaction.type}-${transaction.id}`} className="card flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{backgroundColor: category?.color || '#ccc'}}>
                                    {transaction.type === 'income' ? <ArrowUpRight /> : <ArrowDownRight />}
                                </div>
                                <div>
                                    <h3 className="font-medium dark:text-white">{transaction.description}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{category?.name} • {account?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </p>
                                <div className="flex items-center">
                                    <button onClick={() => handleEdit(transaction)} className="p-2 text-gray-400 hover:text-primary-600"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete(transaction.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-12 card">
                        <h3 className="mt-2 text-lg font-medium dark:text-white">Nenhuma transação encontrada</h3>
                        <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou adicione uma nova transação.</p>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <h2 className="text-xl font-bold dark:text-white">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</h2>
                            {formError && (<div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2 text-sm"><AlertCircle size={16} /><span>{formError}</span></div>)}
                            
                            <input type="text" placeholder="Descrição" name="description" value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} className="input-field" disabled={isSubmitting}/>
                            
                            <CurrencyInput
                                id="transaction-amount"
                                name="amount"
                                className="input-field"
                                placeholder="R$ 0,00"
                                value={formData.amount}
                                onValueChange={(value) => setFormData(f => ({ ...f, amount: value || '' }))}
                                prefix="R$ "
                                groupSeparator="."
                                decimalSeparator=","
                                decimalsLimit={2}
                                disabled={isSubmitting}
                            />
                            
                            <select name="type" value={formData.type} onChange={e => setFormData(f => ({...f, type: e.target.value as any, category: ''}))} className="input-field" disabled={isSubmitting}>
                                <option value="expense">Despesa</option>
                                <option value="income">Receita</option>
                            </select>
                            <select name="accountId" value={formData.accountId} onChange={e => setFormData(f => ({...f, accountId: e.target.value}))} className="input-field" disabled={isSubmitting}>
                                <option value="">Selecione a Conta</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                            <select name="category" value={formData.category} onChange={e => setFormData(f => ({...f, category: e.target.value}))} className="input-field" disabled={isSubmitting}>
                                <option value="">Selecione a Categoria</option>
                                {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <input type="date" name="date" value={formData.date} onChange={e => setFormData(f => ({...f, date: e.target.value}))} className="input-field" disabled={isSubmitting}/>
                            
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="btn-secondary flex-1" disabled={isSubmitting}>Cancelar</button>
                                <button type="submit" className="btn-primary flex-1 flex justify-center items-center gap-2" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (editingTransaction ? 'Salvar' : 'Adicionar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Excluir Transação"
                message="Tem certeza que deseja excluir esta transação? A ação não poderá ser desfeita."
                confirmText="Sim, Excluir"
            />
        </div>
    );
};

export default Transactions;