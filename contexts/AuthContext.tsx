import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService, User as AuthUser } from '@/services/AuthService';

// Use o tipo User do AuthService para garantir compatibilidade!
export type User = AuthUser;

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>; // Adicionado para expor loadUser
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
      console.log('[AuthContext] Carregando usuário...');
      
      // Aguarda o Firebase restaurar a sessão
      const firebaseUser = await AuthService.waitForFirebaseAuth();
      console.log('[AuthContext] Firebase Auth restaurado:', firebaseUser ? 'Usuário encontrado' : 'Nenhum usuário');
      
      if (firebaseUser) {
        // Garante que o usuário está salvo no AsyncStorage
        let userData = await AuthService.getCurrentUser();
        console.log('[AuthContext] Usuário no AsyncStorage:', userData ? 'Encontrado' : 'Não encontrado');
        
        if (!userData) {
          console.log('[AuthContext] Buscando dados do usuário no Firestore...');
          // Busca do Firestore e salva no AsyncStorage
          userData = await AuthService.getUserById(firebaseUser.uid);
          if (userData) {
            console.log('[AuthContext] Salvando usuário no AsyncStorage...');
            await AuthService.saveUserToStorageStatic(userData);
            console.log('[AuthContext] Usuário salvo no AsyncStorage com sucesso');
          }
        }
        
        if (userData) {
          console.log('[AuthContext] Definindo usuário no contexto:', userData.name);
          setUser(userData);
        }
      } else {
        console.log('[AuthContext] Nenhum usuário autenticado');
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao carregar usuário:', error);
      setUser(null);
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut, reloadUser: loadUser }}>
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