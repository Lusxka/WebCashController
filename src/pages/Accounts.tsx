import React, { useState, useEffect } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Account } from '../types';
import { 
    Plus, Edit2, Trash2, Wallet, CreditCard, Banknote, Building2, 
    Loader2, AlertCircle 
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

type AccountFormData = {
    name: string;
    type: Account['type'];
    color: string;
}

const Accounts: React.FC = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, isFinanceLoading, financeError } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

    const initialFormState: AccountFormData = { name: '', type: 'bank', color: '#3B82F6' };
    const [formData, setFormData] = useState<AccountFormData>(initialFormState);

    useEffect(() => {
        if (showAddModal) {
            if (editingAccount) {
                setFormData({ name: editingAccount.name, type: editingAccount.type, color: editingAccount.color });
            } else {
                setFormData(initialFormState);
            }
        }
    }, [showAddModal, editingAccount]);

    const accountTypes = [
        { value: 'bank' as const, label: 'Conta Bancária', icon: Building2 },
        { value: 'wallet' as const, label: 'Carteira Digital', icon: Wallet },
        { value: 'cash' as const, label: 'Dinheiro', icon: Banknote },
        { value: 'credit_card' as const, label: 'Cartão de Crédito', icon: CreditCard }
    ];
    const colors = ['#3B82F6', '#059669', '#DC2626', '#7C3AED', '#EA580C', '#0891B2', '#BE185D', '#65A30D'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        
        setIsSubmitting(true);
        setFormError(null);
        
        const success = editingAccount 
            ? await updateAccount(editingAccount.id, formData)
            // @ts-ignore
            : await addAccount({ ...formData, isActive: true });

        setIsSubmitting(false);
        if (success) {
            resetForm();
        } else {
            setFormError("Não foi possível salvar a conta. Verifique a consola do navegador (F12) para mais detalhes.");
        }
    }

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setShowAddModal(true);
    }

    const handleDelete = (id: string) => {
        setAccountToDelete(id);
        setShowDeleteConfirm(true);
    }

    const confirmDelete = async () => {
        if (accountToDelete) {
            await deleteAccount(accountToDelete);
            setAccountToDelete(null);
            setShowDeleteConfirm(false);
        }
    };

    const resetForm = () => {
        setShowAddModal(false);
        setEditingAccount(null);
        setFormError(null);
    }

    const getAccountIcon = (type: Account['type']) => accountTypes.find(t => t.value === type)?.icon || Wallet;
    const getAccountTypeLabel = (type: Account['type']) => accountTypes.find(t => t.value === type)?.label || 'Conta';
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    if (isFinanceLoading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-16 h-16 animate-spin text-primary-600" /></div>;
    }
    if (financeError) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-md">Ocorreu um erro ao buscar os dados: {financeError}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contas</h1>
                    <p className="text-gray-600 dark:text-gray-400">Gerencie suas contas e carteiras</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nova Conta
                </button>
            </div>

            <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-primary-100 mb-1">Saldo Total</p>
                        <p className="text-3xl font-bold">{totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-primary-200 text-sm mt-1">{accounts.length} conta{accounts.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-4 bg-white bg-opacity-20 rounded-full">
                        <Wallet className="w-8 h-8" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(account => {
                    const Icon = getAccountIcon(account.type);
                    return (
                        <div key={account.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: account.color }}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEdit(account)} className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{account.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{getAccountTypeLabel(account.type)}</p>
                                <p className={`text-xl font-bold ${account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>
                    )
                })}
                {accounts.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <div className="text-gray-400 mb-4"><Wallet className="w-12 h-12 mx-auto" /></div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma conta encontrada</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Comece adicionando sua primeira conta</p>
                        <button onClick={() => setShowAddModal(true)} className="btn-primary">Adicionar Primeira Conta</button>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{editingAccount ? 'Editar Conta' : 'Nova Conta'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {formError && (<div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2 text-sm"><AlertCircle size={16} /><span>{formError}</span></div>)}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Conta *</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} className="input-field" required disabled={isSubmitting} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Conta</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {accountTypes.map(typeInfo => {
                                            const Icon = typeInfo.icon
                                            return (
                                                <button key={typeInfo.value} type="button" onClick={() => setFormData(f => ({ ...f, type: typeInfo.value }))} disabled={isSubmitting} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-colors text-center ${formData.type === typeInfo.value ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                                    <Icon className={`w-6 h-6 mb-1 ${formData.type === typeInfo.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`} />
                                                    <span className={`text-xs font-medium ${formData.type === typeInfo.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>{typeInfo.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {colors.map(color => (
                                            <button key={color} type="button" onClick={() => setFormData(f => ({ ...f, color }))} disabled={isSubmitting} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-primary-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={resetForm} className="btn-secondary flex-1" disabled={isSubmitting}>Cancelar</button>
                                    <button type="submit" className="btn-primary flex-1 flex justify-center items-center gap-2" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (editingAccount ? 'Salvar' : 'Criar Conta')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Excluir Conta"
                message="Você tem certeza que deseja excluir esta conta? Todas as transações associadas a ela também serão afetadas."
                confirmText="Sim, Excluir"
            />
        </div>
    );
}

export default Accounts;