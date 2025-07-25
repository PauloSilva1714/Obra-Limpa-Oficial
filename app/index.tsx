import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { AuthService } from '@/services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorHandler from '@/utils/ErrorHandler';

// Suprimir warning de shadow* style props are deprecated no React Native Web
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('shadow*')) return;
    originalConsoleWarn(...args);
  };
}

export default function Index() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [initStep, setInitStep] = useState('Iniciando...');

  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('[Index] Iniciando aplicativo...');
        
        // Inicializar sistema de captura de erros PRIMEIRO
        const errorHandler = ErrorHandler.getInstance();
        await errorHandler.initialize();
        await errorHandler.saveErrorLog('App iniciado', 'startup');
        
        if (!isMounted) return;
        setInitStep('Aguardando Firebase...');
        
        // Aguardar mais tempo para garantir que tudo está pronto
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isMounted) return;
        setInitStep('Verificando autenticação...');
        
        // Verificar se há dados salvos primeiro
        let storedUser = null;
        try {
          const userData = await AsyncStorage.getItem('user');
          storedUser = userData ? JSON.parse(userData) : null;
          console.log('[Index] Usuário no storage:', storedUser ? 'Encontrado' : 'Não encontrado');
          await errorHandler.saveErrorLog(`Usuário no storage: ${storedUser ? 'Encontrado' : 'Não encontrado'}`, 'storage_check');
        } catch (storageError) {
          console.error('[Index] Erro ao ler AsyncStorage:', storageError);
          await errorHandler.saveErrorLog(`Erro AsyncStorage: ${storageError}`, 'storage_error');
        }
        
        if (!isMounted) return;
        setInitStep('Verificando Firebase Auth...');
        
        // Verificar autenticação do Firebase com timeout
        let firebaseUser = null;
        try {
          const authPromise = AuthService.waitForFirebaseAuth();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout Firebase Auth')), 8000)
          );
          
          firebaseUser = await Promise.race([authPromise, timeoutPromise]);
          console.log('[Index] Firebase Auth:', firebaseUser ? 'Autenticado' : 'Não autenticado');
          await errorHandler.saveErrorLog(`Firebase Auth: ${firebaseUser ? 'Autenticado' : 'Não autenticado'}`, 'firebase_auth');
        } catch (authError) {
          console.error('[Index] Erro Firebase Auth:', authError);
          await errorHandler.saveErrorLog(`Erro Firebase Auth: ${authError}`, 'firebase_error');
        }
        
        if (!isMounted) return;
        setInitStep('Processando dados do usuário...');
        
        // Se temos usuário no storage, tentar usar
        if (storedUser && storedUser.uid) {
          try {
            console.log('[Index] Usando usuário do storage');
            await errorHandler.saveErrorLog('Usando usuário do storage', 'user_from_storage');
            
            if (!isMounted) return;
            setInitStep('Redirecionando...');
            
            // Aguardar um pouco antes de redirecionar
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (isMounted) {
              console.log('[Index] Redirecionando para tabs');
              router.replace('/(tabs)');
              return;
            }
          } catch (storageUserError) {
            console.error('[Index] Erro ao usar usuário do storage:', storageUserError);
            await errorHandler.saveErrorLog(`Erro usuário storage: ${storageUserError}`, 'storage_user_error');
          }
        }
        
        // Se temos usuário do Firebase, buscar dados
        if (firebaseUser && (firebaseUser as any).uid) {
          try {
            if (!isMounted) return;
            setInitStep('Buscando dados do Firestore...');
            
            console.log('[Index] Buscando dados do usuário no Firestore');
            const userData = await AuthService.getUserById((firebaseUser as any).uid);
            
            if (userData && isMounted) {
              console.log('[Index] Dados do usuário encontrados');
              await errorHandler.saveErrorLog('Dados do usuário encontrados no Firestore', 'firestore_success');
              
              setInitStep('Salvando dados...');
              await AuthService.saveUserToStorage(userData);
              
              if (!isMounted) return;
              setInitStep('Redirecionando...');
              
              await new Promise(resolve => setTimeout(resolve, 500));
              
              if (isMounted) {
                console.log('[Index] Redirecionando para tabs');
                router.replace('/(tabs)');
                return;
              }
            } else {
              throw new Error('Dados do usuário não encontrados no Firestore');
            }
          } catch (firestoreError) {
            console.error('[Index] Erro ao buscar dados do Firestore:', firestoreError);
            await errorHandler.saveErrorLog(`Erro Firestore: ${firestoreError}`, 'firestore_error');
            
            // Limpar dados corrompidos
            try {
              await AsyncStorage.multiRemove(['user', 'site']);
              console.log('[Index] Dados limpos devido ao erro');
            } catch (clearError) {
              console.error('[Index] Erro ao limpar dados:', clearError);
            }
          }
        }
        
        // Se chegou até aqui, redirecionar para login
        if (isMounted) {
          console.log('[Index] Redirecionando para login');
          await errorHandler.saveErrorLog('Redirecionando para login', 'redirect_login');
          setInitStep('Redirecionando para login...');
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (isMounted) {
            router.replace('/(auth)/login');
          }
        }
        
      } catch (criticalError) {
        console.error('[Index] Erro crítico na inicialização:', criticalError);
        
        try {
          const errorHandler = ErrorHandler.getInstance();
          await errorHandler.saveErrorLog(`Erro crítico: ${criticalError}`, 'critical_error');
        } catch (logError) {
          console.error('[Index] Erro ao salvar log crítico:', logError);
        }
        
        if (isMounted) {
          setError(`Erro crítico: ${(criticalError as any)?.message || criticalError}`);
          
          // Tentar limpar dados e redirecionar após um tempo MAIOR
          setTimeout(async () => {
            try {
              await AsyncStorage.multiRemove(['user', 'site']);
              if (isMounted) {
                router.replace('/(auth)/login');
              }
            } catch (cleanupError) {
              console.error('[Index] Erro na limpeza:', cleanupError);
            }
          }, 10000); // 10 segundos para dar tempo de ver o debug
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    // Executar inicialização
    initializeApp();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Função para mostrar logs salvos
  const showSavedLogs = async () => {
    try {
      const errorHandler = ErrorHandler.getInstance();
      const formattedLogs = await errorHandler.getFormattedLogs();
      
      Alert.alert(
        'Logs de Erro',
        formattedLogs,
        [
          { 
            text: 'Limpar Logs', 
            onPress: async () => {
              await errorHandler.clearErrorLogs();
              Alert.alert('Sucesso', 'Logs limpos com sucesso');
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os logs');
    }
  };

  // Tela de erro - com mais tempo para interação
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Erro na inicialização</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>O app será redirecionado automaticamente em 10 segundos</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => setShowDebug(true)}
          >
            <Text style={styles.debugButtonText}>Ver Debug Info</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.debugButton, styles.logsButton]} 
            onPress={showSavedLogs}
          >
            <Text style={styles.debugButtonText}>Ver Logs Salvos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Tela de carregamento - com mais informações
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0066cc" />
      <Text style={styles.loadingText}>Inicializando aplicativo...</Text>
      <Text style={styles.stepText}>{initStep}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => setShowDebug(true)}
        >
          <Text style={styles.debugButtonText}>Debug Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.debugButton, styles.logsButton]} 
          onPress={showSavedLogs}
        >
          <Text style={styles.debugButtonText}>Ver Logs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  stepText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  debugButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 120,
  },
  logsButton: {
    backgroundColor: '#FF9500',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});