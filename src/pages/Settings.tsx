import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
    Moon, Sun, Bell, Shield, Download, Upload, Trash2, User, CreditCard,
    Target, Settings as SettingsIcon, Edit2, Key, Mail, AlertCircle,
    CheckCircle, Loader2
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal'; // Importe o novo modal

const Settings: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout, updateProfile, changePassword, resendVerification, resetAccountData } = useAuth();
    
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

    const handleExportData = () => {
        // Esta função pode ser implementada para exportar dados do usuário em JSON
        alert('Funcionalidade de exportar dados a ser implementada.');
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Esta função pode ser implementada para importar dados de um arquivo JSON
        alert('Funcionalidade de importar dados a ser implementada.');
    };
    
    // Abre o modal de confirmação
    const handleClearAllData = () => {
        setShowResetConfirm(true);
    };

    // Ação executada após a confirmação no modal
    const confirmResetAllData = async () => {
        setIsUpdating(true);
        setMessage({ type: 'info', text: 'Processando sua solicitação... Por favor, aguarde.' });

        const result = await resetAccountData();
        
        if (result.success) {
            setMessage({ type: 'success', text: 'Seus dados foram removidos com sucesso! Atualizando o dashboard...' });
            setTimeout(() => {
                window.location.href = '/'; // Redireciona para o dashboard
            }, 2000);
        } else {
            setMessage({ type: 'error', text: `Falha ao limpar os dados. Erro: ${result.error}` });
            setIsUpdating(false);
        }
        setShowResetConfirm(false); // Fecha o modal
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setMessage(null);
        // @ts-ignore
        const result = await updateProfile(profileData);
        if (result.success) {
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setShowEditProfile(false);
        } else {
            // @ts-ignore
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
        // @ts-ignore
        const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
        if (result.success) {
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setShowChangePassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            // @ts-ignore
            setMessage({ type: 'error', text: result.error || 'Erro ao alterar senha' });
        }
        setIsUpdating(false);
    };

    const handleResendVerification = async () => {
        setIsUpdating(true);
        // @ts-ignore
        const result = await resendVerification();
        if (result.success) {
            setMessage({ type: 'success', text: 'Email de verificação enviado!' });
        } else {
            // @ts-ignore
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
            title: 'Segurança',
            icon: Shield,
            items: [
                {
                    title: 'Alterar Senha',
                    description: 'Modificar sua senha de acesso',
                    action: (
                        <button onClick={() => setShowChangePassword(true)} className="btn-secondary flex items-center gap-2">
                            <Key className="w-4 h-4" /> Alterar
                        </button>
                    )
                },
                {
                    title: 'Verificação de Email',
                    // @ts-ignore
                    description: user?.isEmailVerified ? 'Email verificado' : 'Email não verificado',
                    // @ts-ignore
                    action: user?.isEmailVerified ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Verificado</span>
                        </div>
                    ) : (
                        <button onClick={handleResendVerification} disabled={isUpdating} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
                            <Mail className="w-4 h-4" /> Verificar
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
                        <button onClick={handleExportData} className="btn-secondary flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar
                        </button>
                    )
                },
                {
                    title: 'Importar Dados',
                    description: 'Restaurar backup anterior',
                    action: (
                        <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" /> Importar
                            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                        </label>
                    )
                },
                {
                    title: 'Limpar Todos os Dados',
                    description: 'Remover permanentemente todas as informações',
                    action: (
                        <button onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
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
                    message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : message.type === 'error'
                           ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                           : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}>
                    {message.type === 'success' ? ( <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> ) : 
                     message.type === 'error' ? ( <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /> ) : 
                                               ( <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" /> )}
                    <p className={`text-sm ${
                        message.type === 'success'
                            ? 'text-green-700 dark:text-green-300'
                            : message.type === 'error'
                               ? 'text-red-700 dark:text-red-300'
                               : 'text-blue-700 dark:text-blue-300'
                        }`}>
                        {message.text}
                    </p>
                </div>
            )}

            <div className="card">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                    {/* @ts-ignore */}
                                    Conta {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                                </p>
                                {/* @ts-ignore */}
                                {!user?.isEmailVerified && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                        Email não verificado
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowEditProfile(true)} className="btn-primary flex items-center gap-2">
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

            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <CreditCard className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                        <p className="font-medium text-gray-900 dark:text-white">Gerenciar Contas</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Adicionar ou editar contas</p>
                    </button>
                    <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <Target className="w-8 h-8 text-secondary-600 dark:text-secondary-400 mx-auto mb-2" />
                        <p className="font-medium text-gray-900 dark:text-white">Definir Metas</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Criar objetivos financeiros</p>
                    </button>
                    <button onClick={logout} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <SettingsIcon className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                        <p className="font-medium text-red-900 dark:text-red-100">Sair da Conta</p>
                        <p className="text-sm text-red-600 dark:text-red-400">Fazer logout do sistema</p>
                    </button>
                </div>
            </div>

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