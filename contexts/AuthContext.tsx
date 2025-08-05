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
      
      // Aguarda o Firebase restaurar a sessão
      const firebaseUser = await AuthService.waitForFirebaseAuth();
      
      if (firebaseUser) {
        // Garante que o usuário está salvo no AsyncStorage
        let userData = await AuthService.getCurrentUser();
        
        if (!userData) {
          // Busca do Firestore e salva no AsyncStorage
          userData = await AuthService.getUserById(firebaseUser.uid);
          if (userData) {
            await AuthService.saveUserToStorage(userData);
          }
        }
        
        // SINCRONIZAR photoURL DO FIREBASE AUTH
        
        if (userData && firebaseUser.photoURL && firebaseUser.photoURL !== userData.photoURL) {
          await AuthService.updateUserProfilePhoto(userData.id, firebaseUser.photoURL);
          userData.photoURL = firebaseUser.photoURL;
          await AuthService.saveUserToStorage(userData);
        } else if (userData && !userData.photoURL && firebaseUser.photoURL) {
          await AuthService.updateUserProfilePhoto(userData.id, firebaseUser.photoURL);
          userData.photoURL = firebaseUser.photoURL;
          await AuthService.saveUserToStorage(userData);
        } else if (userData && firebaseUser.photoURL === null && userData.photoURL) {
          try {
            await AuthService.syncPhotoURLToFirebaseAuth(userData.photoURL);
          } catch (error) {
            }
        } else {
        }
        
        if (userData) {
          setUser(userData);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
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
      // return false;
    }
  }

  async function signOut() {
    try {
      await AuthService.logout(); // Corrigido!
      setUser(null);
    } catch (error) {
      // }
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