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
          
          if (userData) {
            router.replace('/(tabs)');
          } else {
            await AuthService.clearAuthData();
            router.replace('/(auth)/login');
          }
        } else {
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