import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthService } from '@/services/AuthService';

// Suprimir warning de shadow* style props are deprecated no React Native Web
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('shadow* style props are deprecated')
    ) {
      return;
    }
    originalWarn(...args);
  };
}

export default function Index() {
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[Index] Iniciando verificação de autenticação...');
        
        // Aguarda o Firebase restaurar a sessão
        const firebaseUser = await AuthService.waitForFirebaseAuth();
        console.log('[Index] Firebase Auth restaurado:', firebaseUser ? 'Usuário encontrado' : 'Nenhum usuário');

        if (firebaseUser) {
          // Garante que o usuário está salvo no AsyncStorage
          let userData = await AuthService.getCurrentUser();
          console.log('[Index] Usuário no AsyncStorage:', userData ? 'Encontrado' : 'Não encontrado');
          
          if (!userData) {
            console.log('[Index] Buscando dados do usuário no Firestore...');
            // Busca do Firestore e salva no AsyncStorage
            userData = await AuthService.getUserById(firebaseUser.uid);
            if (userData) {
              console.log('[Index] Salvando usuário no AsyncStorage...');
              await AuthService.saveUserToStorage(userData);
              console.log('[Index] Usuário salvo no AsyncStorage com sucesso');
            } else {
              console.log('[Index] Erro: Não foi possível buscar dados do usuário no Firestore');
            }
          }
          
          if (userData) {
            console.log('[Index] Redirecionando para (tabs)...');
            router.replace('/(tabs)');
          } else {
            console.log('[Index] Erro: Dados do usuário não encontrados, redirecionando para login');
            await AuthService.clearAuthData();
            router.replace('/(auth)/login');
          }
        } else {
          console.log('[Index] Nenhum usuário autenticado, redirecionando para login');
          await AuthService.clearAuthData();
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('[Index] Erro durante inicialização:', error);
        await AuthService.clearAuthData();
        router.replace('/(auth)/login');
      }
    };
    
    initialize();
  }, []);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
  },
});