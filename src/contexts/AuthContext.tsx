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
  resetAccountData: () => Promise<{ success: boolean; error?: string }>;
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
  // 🔧 Novo estado para controlar se já verificamos a sessão inicial
  const [hasInitializedSession, setHasInitializedSession] = useState(false);

  useEffect(() => {
    let isMounted = true; // Flag para evitar state updates em componente desmontado

    // 🔧 Função para buscar sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return; // Componente foi desmontado, não atualizar state
        
        if (error) {
          console.error('Erro ao buscar sessão:', error);
          setSupabaseUser(null);
        } else {
          setSupabaseUser(session?.user ?? null);
        }
        
        setHasInitializedSession(true);
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
        if (isMounted) {
          setSupabaseUser(null);
          setHasInitializedSession(true);
        }
      }
    };

    // 🔧 Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      setSupabaseUser(session?.user ?? null);
      
      // Se ainda não inicializamos, marcar como inicializado
      if (!hasInitializedSession) {
        setHasInitializedSession(true);
      }
    });

    // Inicializar autenticação
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hasInitializedSession]);

  // 🔧 Effect separado para buscar dados do usuário
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      if (!supabaseUser) {
        if (isMounted) {
          setUser(null);
          // 🔧 Só definir isLoading como false se já inicializamos a sessão
          if (hasInitializedSession) {
            setIsLoading(false);
          }
        }
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('perfis')
          .select('nome_completo')
          .eq('id', supabaseUser.id)
          .single();

        if (!isMounted) return;

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
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted && hasInitializedSession) {
          setIsLoading(false);
        }
      }
    };

    // 🔧 Só buscar perfil se já inicializamos a sessão
    if (hasInitializedSession) {
      fetchUserProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [supabaseUser, hasInitializedSession]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true); // Mostrar loading durante login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { success: !error, error: error?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      // isLoading será definido como false pelo useEffect quando os dados chegarem
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true); // Mostrar loading durante registro
      const { error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: { nome_completo: name } } 
      });
      return { success: !error, error: error?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      // isLoading será definido como false pelo useEffect quando os dados chegarem
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAccountData = async () => {
    console.log('[AuthContext] Iniciando chamada RPC para "reset_user_data"...');
    try {
      const { error } = await supabase.rpc('reset_user_data');
  
      if (error) {
        console.error('[AuthContext] ERRO EXPLÍCITO retornado pela chamada RPC:', error);
        throw error;
      }
  
      console.log('[AuthContext] Função RPC "reset_user_data" executada COM SUCESSO no servidor.');
      return { success: true };

    } catch (err: any) {
      console.error('[AuthContext] ERRO GERAL (CATCH) ao tentar executar a função RPC:', err);
      return { success: false, error: err.message };
    }
  };

  const value: AuthContextType = { 
    user, 
    isLoading, 
    isAuthenticated: !!user, 
    login, 
    register, 
    logout,
    resetAccountData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};