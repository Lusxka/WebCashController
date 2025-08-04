import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import {
    Moon, Sun, Bell, Download, Upload, Trash2, User,
    Edit2, Key, Mail, AlertCircle,
    CheckCircle, Loader2
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const Settings: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const { user, updateProfile, changePassword, resendVerification, resetAccountData } = useAuth();
    const { 
        accounts, 
        categories, 
        transactions, 
        goals, 
        budgets,
        addAccount,
        addCategory, 
        addTransaction,
        addGoal
    } = useFinance();
    
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Atualiza o formulário se o usuário for carregado depois
    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name || '', email: user.email || '' });
        }
    }, [user]);

    // 🔥 FUNÇÃO DE EXPORTAR DADOS
    const handleExportData = async () => {
        try {
            setIsUpdating(true);
            setMessage({ type: 'info', text: 'Preparando exportação dos dados...' });

            // Preparar dados para exportação
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    userId: user?.id,
                    userName: user?.name,
                    totalAccounts: accounts.length,
                    totalCategories: categories.length,
                    totalTransactions: transactions.length,
                    totalGoals: goals.length,
                    totalBudgets: budgets.length
                },
                accounts: accounts.map(account => ({
                    id: account.id,
                    name: account.name,
                    type: account.type,
                    balance: account.balance,
                    color: account.color,
                    isActive: account.isActive,
                    createdAt: account.createdAt,
                    updatedAt: account.updatedAt
                })),
                categories: categories.map(category => ({
                    id: category.id,
                    name: category.name,
                    type: category.type,
                    icon: category.icon,
                    color: category.color,
                    isActive: category.isActive,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt
                })),
                transactions: transactions.map(transaction => ({
                    id: transaction.id,
                    type: transaction.type,
                    amount: transaction.amount,
                    description: transaction.description,
                    category: transaction.category,
                    accountId: transaction.accountId,
                    date: transaction.date,
                    recurrence: transaction.recurrence,
                    createdAt: transaction.createdAt,
                    updatedAt: transaction.updatedAt
                })),
                goals: goals.map(goal => ({
                    id: goal.id,
                    name: goal.name,
                    targetAmount: goal.targetAmount,
                    currentAmount: goal.currentAmount,
                    targetDate: goal.targetDate,
                    isCompleted: goal.isCompleted,
                    createdAt: goal.createdAt,
                    updatedAt: goal.updatedAt
                })),
                budgets: budgets.map(budget => ({
                    id: budget.id,
                    categoryId: budget.categoryId,
                    amount: budget.amount,
                    spent: budget.spent,
                    alertThreshold: budget.alertThreshold,
                    createdAt: budget.createdAt
                }))
            };

            // Criar e baixar arquivo
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `webcash-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setMessage({ 
                type: 'success', 
                text: `Dados exportados com sucesso! ${transactions.length} transações, ${accounts.length} contas, ${categories.length} categorias e ${goals.length} metas foram incluídas no backup.` 
            });

        } catch (error: any) {
            console.error('Erro ao exportar dados:', error);
            setMessage({ 
                type: 'error', 
                text: `Erro ao exportar dados: ${error.message}` 
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // 🔥 FUNÇÃO DE IMPORTAR DADOS
    const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input para permitir selecionar o mesmo arquivo novamente
        event.target.value = '';

        try {
            setIsUpdating(true);
            setMessage({ type: 'info', text: 'Lendo arquivo de backup...' });

            const fileText = await file.text();
            const importData = JSON.parse(fileText);

            // Validar estrutura do arquivo
            if (!importData.metadata || !importData.accounts || !importData.categories || !importData.transactions) {
                throw new Error('Arquivo de backup inválido. Estrutura não reconhecida.');
            }

            setMessage({ type: 'info', text: 'Importando dados... Isso pode levar alguns momentos.' });

            let importedCounts = {
                accounts: 0,
                categories: 0,
                transactions: 0,
                goals: 0
            };

            // Importar contas
            if (importData.accounts && Array.isArray(importData.accounts)) {
                for (const account of importData.accounts) {
                    try {
                        await addAccount({
                            name: account.name,
                            type: account.type,
                            color: account.color,
                            initialBalance: account.balance || 0
                        });
                        importedCounts.accounts++;
                    } catch (error) {
                        console.warn('Erro ao importar conta:', account.name, error);
                    }
                }
            }

            // Importar categorias
            if (importData.categories && Array.isArray(importData.categories)) {
                for (const category of importData.categories) {
                    try {
                        await addCategory({
                            name: category.name,
                            type: category.type,
                            icon: category.icon,
                            color: category.color
                        });
                        importedCounts.categories++;
                    } catch (error) {
                        console.warn('Erro ao importar categoria:', category.name, error);
                    }
                }
            }

            // Aguardar um pouco para as contas e categorias serem criadas
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Importar transações
            if (importData.transactions && Array.isArray(importData.transactions)) {
                for (const transaction of importData.transactions) {
                    try {
                        // Tentar encontrar conta correspondente pelo nome
                        const matchingAccount = accounts.find(acc => acc.name === 
                            importData.accounts.find((impAcc: any) => impAcc.id === transaction.accountId)?.name
                        );

                        // Tentar encontrar categoria correspondente pelo nome
                        let matchingCategory = null;
                        if (transaction.category) {
                            const categoryName = importData.categories.find((impCat: any) => impCat.id === transaction.category)?.name;
                            matchingCategory = categories.find(cat => cat.name === categoryName);
                        }

                        if (matchingAccount) {
                            await addTransaction({
                                type: transaction.type,
                                amount: transaction.amount,
                                description: transaction.description,
                                category: matchingCategory?.id || null,
                                accountId: matchingAccount.id,
                                date: transaction.date,
                                recurrence: transaction.recurrence || 'none'
                            });
                            importedCounts.transactions++;
                        }
                    } catch (error) {
                        console.warn('Erro ao importar transação:', transaction.description, error);
                    }
                }
            }

            // Importar metas
            if (importData.goals && Array.isArray(importData.goals)) {
                for (const goal of importData.goals) {
                    try {
                        await addGoal({
                            name: goal.name,
                            targetAmount: goal.targetAmount,
                            targetDate: goal.targetDate
                        });
                        importedCounts.goals++;
                    } catch (error) {
                        console.warn('Erro ao importar meta:', goal.name, error);
                    }
                }
            }

            setMessage({ 
                type: 'success', 
                text: `Importação concluída! ${importedCounts.accounts} contas, ${importedCounts.categories} categorias, ${importedCounts.transactions} transações e ${importedCounts.goals} metas foram importadas.` 
            });

        } catch (error: any) {
            console.error('Erro ao importar dados:', error);
            setMessage({ 
                type: 'error', 
                text: `Erro ao importar dados: ${error.message}` 
            });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleClearAllData = () => {
        setShowResetConfirm(true);
    };

    const confirmResetAllData = async () => {
        setIsUpdating(true);
        setMessage({ type: 'info', text: 'Processando sua solicitação... Por favor, aguarde.' });

        const result = await resetAccountData();
        
        if (result.success) {
            setMessage({ type: 'success', text: 'Seus dados foram removidos com sucesso! Atualizando o dashboard...' });
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            setMessage({ type: 'error', text: `Falha ao limpar os dados. Erro: ${result.error}` });
            setIsUpdating(false);
        }
        setShowResetConfirm(false);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setMessage(null);
        const result = await updateProfile(profileData);
        if (result.success) {
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setShowEditProfile(false);
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil' });
        }
        setIsUpdating(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setMessage(null);
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Senhas não coincidem' });
            setIsUpdating(false);
            return;
        }
        const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
        if (result.success) {
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setShowChangePassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao alterar senha' });
        }
        setIsUpdating(false);
    };

    const handleResendVerification = async () => {
        setIsUpdating(true);
        const result = await resendVerification();
        if (result.success) {
            setMessage({ type: 'success', text: 'Email de verificação enviado!' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao enviar email' });
        }
        setIsUpdating(false);
    };

    const settingSections = [
        {
            title: 'Aparência',
            icon: isDark ? Moon : Sun,
            items: [
                {
                    title: 'Tema',
                    description: 'Alternar entre tema claro e escuro',
                    action: (
                        <button onClick={toggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-primary-600' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    )
                }
            ]
        },
        {
            title: 'Notificações',
            icon: Bell,
            items: [
                {
                    title: 'Alertas de Orçamento',
                    description: 'Receber notificações quando exceder limites',
                    action: (
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                    )
                },
                {
                    title: 'Lembretes de Pagamento',
                    description: 'Notificações para contas a vencer',
                    action: (
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                    )
                }
            ]
        },
        {
            title: 'Dados',
            icon: Download,
            items: [
                {
                    title: 'Exportar Dados',
                    description: 'Fazer backup de todas as informações',
                    action: (
                        <button 
                            onClick={handleExportData} 
                            disabled={isUpdating}
                            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                        >
                            {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Exportar
                        </button>
                    )
                },
                {
                    title: 'Importar Dados',
                    description: 'Restaurar backup anterior',
                    action: (
                        <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                            {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            Importar
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleImportData} 
                                className="hidden"
                                disabled={isUpdating}
                            />
                        </label>
                    )
                },
                {
                    title: 'Limpar Todos os Dados',
                    description: 'Remover permanentemente todas as informações',
                    action: (
                        <button 
                            onClick={handleClearAllData} 
                            disabled={isUpdating}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" /> Limpar Tudo
                        </button>
                    )
                }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
                <p className="text-gray-600 dark:text-gray-400">Personalize sua experiência no WebCash</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    <p className={`text-sm ${
                        message.type === 'success' ? 'text-green-700 dark:text-green-300'
                        : message.type === 'error' ? 'text-red-700 dark:text-red-300'
                        : 'text-blue-700 dark:text-blue-300'}`}>
                        {message.text}
                    </p>
                </div>
            )}

            <div className="card">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowEditProfile(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Edit2 className="w-4 h-4" /> Editar Perfil
                    </button>
                </div>
            </div>

            {settingSections.map((section, sectionIndex) => {
                const Icon = section.icon;
                return (
                    <div key={sectionIndex} className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                                <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                        </div>
                        <div className="space-y-4">
                            {section.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                                    </div>
                                    <div className="ml-4">{item.action}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* MODAIS (EDITAR PERFIL, MUDAR SENHA, CONFIRMAÇÃO) INALTERADOS */}
            {showEditProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Editar Perfil</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
                                    <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                    <input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className="input-field" required />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowEditProfile(false)} className="flex-1 btn-secondary">Cancelar</button>
                                    <button type="submit" disabled={isUpdating} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showChangePassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Alterar Senha</h2>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha Atual</label>
                                    <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nova Senha</label>
                                    <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Nova Senha</label>
                                    <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="input-field" required />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => { setShowChangePassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="flex-1 btn-secondary">Cancelar</button>
                                    <button type="submit" disabled={isUpdating} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Alterando...</> : 'Alterar Senha'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={confirmResetAllData}
                isLoading={isUpdating}
                title="Atenção Máxima!"
                message="Esta é uma ação irreversível que apagará TODOS os seus dados (contas, transações, metas, etc.) permanentemente. Deseja continuar?"
                confirmText="Sim, apagar tudo"
            />
        </div>
    );
};

export default Settings;