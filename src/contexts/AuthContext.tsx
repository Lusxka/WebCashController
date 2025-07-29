// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js'

// Sua interface User está ótima, vamos mantê-la.
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  lastLogin?: string
  isEmailVerified: boolean
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: 'pt-BR' | 'en-US'
    currency: 'BRL' | 'USD' | 'EUR'
    notifications: {
      email: boolean
      push: boolean
      budgetAlerts: boolean
      paymentReminders: boolean
    }
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>
  resendVerification: () => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;
        if (currentUser) {
          const { data: profile } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          const appUser: User = {
            id: currentUser.id,
            email: currentUser.email || '',
            name: profile?.nome_completo || currentUser.email || 'Usuário',
            avatar: profile?.avatar_url,
            isEmailVerified: currentUser.email_confirmed_at !== undefined,
            createdAt: currentUser.created_at,
            lastLogin: currentUser.last_sign_in_at,
            role: 'user', 
            preferences: profile?.preferencias || { 
              theme: 'system',
              language: 'pt-BR',
              currency: 'BRL',
              notifications: { email: true, push: true, budgetAlerts: true, paymentReminders: true }
            }
          };
          setUser(appUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    return { success: !error, error: error?.message };
  };

  // 👇 FUNÇÃO DE REGISTRO SIMPLIFICADA E CORRIGIDA
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    // Agora só precisamos chamar a função signUp.
    // O gatilho no Supabase vai cuidar de criar o perfil na outra tabela.
    // Passamos o nome_completo em 'options.data' para que o gatilho possa usá-lo.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: name,
        }
      }
    });

    setIsLoading(false);
    return { success: !error, error: error?.message };
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // O listener do onAuthStateChange vai limpar o usuário automaticamente.
    setIsLoading(false);
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/resetar-senha`, 
    });
    setIsLoading(false);
    return { success: !error, error: error?.message };
  };

  // Funções restantes (as implementações podem ser adicionadas conforme necessário)
  const resetPassword = async (token: string, newPassword: string) => { return { success: false, error: 'Função não implementada' } };
  const updateProfile = async (data: Partial<User>) => { return { success: false, error: 'Função não implementada' } };
  const changePassword = async (currentPassword: string, newPassword: string) => { return { success: false, error: 'Função não implementada' } };
  const verifyEmail = async (token: string) => { return { success: false, error: 'Função não implementada' } };
  const resendVerification = async () => { return { success: false, error: 'Função não implementada' } };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};