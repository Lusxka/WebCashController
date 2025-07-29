import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito 1: Ouve o estado de autenticação do Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Efeito 2: Reage à mudança do utilizador para buscar o perfil
  useEffect(() => {
    if (!supabaseUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    supabase
      .from('perfis')
      .select('nome_completo')
      .eq('id', supabaseUser.id)
      .single()
      .then(({ data: profile, error }) => {
        if (error) {
          console.error("Erro ao buscar perfil:", error);
          setUser(null);
        } else if (profile) {
          const appUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: profile.nome_completo || 'Utilizador',
            createdAt: supabaseUser.created_at,
            role: 'user',
          };
          setUser(appUser);
        }
        setIsLoading(false);
      });
  }, [supabaseUser]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error: error?.message };
  };

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nome_completo: name } } });
    return { success: !error, error: error?.message };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const value: AuthContextType = { user, isLoading, isAuthenticated: !!user, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};