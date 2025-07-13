import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthService } from '@/services/AuthService';

export default function Index() {
  useEffect(() => {
    const initialize = async () => {
      try {
        const isAuthenticated = await AuthService.isAuthenticated();
        
        if (isAuthenticated) {
          // Usuário já está autenticado, redirecionar para as abas
          router.replace('/(tabs)');
        } else {
          // Usuário não está autenticado, limpar dados e ir para login
          await AuthService.clearAuthData();
          router.replace('/(auth)/login');
        }
      } catch (error) {
        // Em caso de erro, ir para login
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