import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService, User as AuthUser } from '@/services/AuthService';

// Use o tipo User do AuthService para garantir compatibilidade!
export type User = AuthUser;

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      // console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const success = await AuthService.login(email, password); // Corrigido!
      if (success) {
        await loadUser();
      }
      return success;
    } catch (error) {
      // console.error('Erro ao fazer login:', error);
      return false;
    }
  }

  async function signOut() {
    try {
      await AuthService.logout(); // Corrigido!
      setUser(null);
    } catch (error) {
      // console.error('Erro ao fazer logout:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 