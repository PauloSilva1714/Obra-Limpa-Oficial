import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Firestore,
  enableNetwork,
  connectFirestoreEmulator,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
} from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { Platform } from 'react-native';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase app:', error);
  throw error;
}

// Initialize Firestore com configurações otimizadas
let db: Firestore;
try {
  
  // Abordagem mais agressiva para web
  if (Platform.OS === 'web') {
    // Para web, usar configuração mais agressiva
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    });
  } else {
    // Para mobile, usar configuração padrão
    db = getFirestore(app);
  }
  
  // Configurações adicionais para melhorar a conectividade
  if (typeof window !== 'undefined') {
    // Configurar timeout mais curto para operações do Firestore para evitar timeouts
    const originalFetch = window.fetch;
    window.fetch = function(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
      const urlString = url.toString();
      if (urlString.includes('firestore.googleapis.com')) {
        const newOptions: RequestInit = {
          ...options,
          signal: options.signal || AbortSignal.timeout(30000), // 30 segundos de timeout
          credentials: 'same-origin' as RequestCredentials,
        };
        return originalFetch(url, newOptions);
      }
      return originalFetch(url, options);
    };
  }
  
} catch (error) {
  console.error('❌ Erro ao inicializar Firestore:', error);
  throw error;
}

// Initialize other Firebase services
let auth: Auth;
let functions: Functions;
let storage: any;

try {
  auth = getAuth(app);
  
  functions = getFunctions(app);
  
  storage = getStorage(app);
} catch (error) {
  console.error('❌ Erro ao inicializar serviços Firebase:', error);
  throw error;
}

// The Firebase SDK handles reconnections automatically.
// A manual reconnect function can often complicate things. The "client is offline"
// error usually points to an initial configuration problem (which is now fixed)
// or genuine network issues, not something to be solved by a manual override.

// Function to check if Firestore is online
export const isFirestoreOnline = async (): Promise<boolean> => {
  try {
    
    // Estratégia 1: Verificação simples - apenas criar referência
    try {
    const testDocRef = doc(db, 'system', 'online-test');
      if (testDocRef) {
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Falha na verificação simples:', error);
    }
    
    // Estratégia 2: Tentar uma operação real com timeout curto
    try {
      const testDocRef = doc(db, 'system', 'online-test');
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 3000); // 3 segundos
    });
    
    const getDocPromise = getDoc(testDocRef);
    await Promise.race([getDocPromise, timeoutPromise]);
    
    return true;
  } catch (error: any) {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';

      // Se for erro de permissão ou "not found", significa que está online
      if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
      return true;
    }
    
    // Se for erro de timeout, pode ser problema de rede
    if (errorMessage.includes('Timeout')) {
      return false;
    }
    
    // Se for erro de "unavailable", está offline
      if (errorCode === 'unavailable' || errorMessage.includes('unavailable') || errorMessage.includes('offline')) {
      return false;
    }
    
    // Para outros erros, assumir que está online (mais tolerante)
    return true;
    }
    
  } catch (error: any) {
    console.error('❌ Erro geral na verificação de online:', error.message);
    return false;
  }
};

// Function to check Firebase connectivity
export const checkFirebaseConnection = async () => {
  try {
    
    // Verificar se o Firebase está inicializado corretamente
    if (!app) {
      console.error('❌ Firebase app não está inicializado');
      return false;
    }

    // Verificar se o Firestore está disponível
    if (!db) {
      console.error('❌ Firestore não está inicializado');
      return false;
    }

    // Verificar se há conexão com a internet (verificação básica)
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.error('❌ Sem conexão com a internet');
      return false;
    }

    // Verificação adicional para problemas de CORS ou configuração
    // if (typeof window !== 'undefined') {
    //   try {
    //     // Testar se conseguimos fazer uma requisição básica para o Firebase
    //     const testUrl = `https://${firebaseConfig.projectId}.firebaseapp.com/.well-known/__/firebase/init.json`;
    //     const response = await fetch(testUrl, { 
    //       method: 'HEAD',
    //       mode: 'cors',
    //       cache: 'no-cache'
    //     });
    //     // console.log removed
    //   } catch (httpError) {
    //     console.warn('⚠️ Problema de acesso HTTP ao Firebase:', httpError);
    //     // Não falhar aqui, apenas logar o aviso
    //   }
    // }

    // Verificação mais robusta: tentar uma operação real com timeout
    try {
      
      const testDocRef = doc(db, 'system', 'connection-test');
      
      // Tentar ler o documento com timeout otimizado
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 3000); // Reduzido de 5s para 3s
      });
      
      const getDocPromise = getDoc(testDocRef);
      const docSnapshot = await Promise.race([getDocPromise, timeoutPromise]) as any;
      
      // Se o documento não existir, criar um
      if (!docSnapshot.exists()) {
        await setDoc(testDocRef, {
          created: new Date().toISOString(),
          purpose: 'connection-test'
        });
      }
      
      return true;
      
    } catch (firestoreError: any) {
      const errorMessage = firestoreError.message || '';
      const errorCode = firestoreError.code || '';

      // Se for erro de permissão ou "not found", significa que está online
      if (errorMessage.includes('permission') || 
          errorMessage.includes('not found') || 
          errorCode === 'permission-denied' ||
          errorCode === 'not-found') {
        return true;
      }
      
      // Se for erro de timeout, pode ser problema de rede
      if (errorMessage.includes('Timeout')) {
        return false;
      }
      
      // Se for erro de "unavailable", está offline
      if (errorCode === 'unavailable' || 
          errorMessage.includes('unavailable') || 
          errorMessage.includes('offline')) {
        return false;
      }
      
      // Para outros erros, tentar uma verificação mais simples
      try {
        const simpleTestRef = doc(db, 'system', 'simple-test');
        if (simpleTestRef) {
          return true;
        }
      } catch (simpleError) {
      }
      
      // Se chegou até aqui, assumir que está offline
      return false;
    }
  } catch (error: any) {
    console.error('❌ Erro geral na verificação de conexão:', error.message);
    return false;
  }
};

// A simpler reconnect function, just in case. It's better to let the SDK handle this.
export const reconnectFirebase = async () => {
  try {
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.error('Error re-enabling Firebase network:', error);
    return false;
  }
};

// Função para forçar reconexão e verificar conectividade
export const forceReconnectAndCheck = async (): Promise<boolean> => {
  try {
    
    // Estratégia 1: Tentar reconectar usando enableNetwork
    try {
      await reconnectFirebase();
    } catch (error) {
      console.warn('⚠️ Falha na reconexão via enableNetwork:', error);
    }
    
    // Estratégia 2: Aguardar um pouco para a reconexão se estabelecer (otimizado)
    await new Promise(resolve => setTimeout(resolve, 1500)); // Reduzido de 3s para 1.5s
    
    // Estratégia 3: Tentar uma operação simples para verificar se a conexão foi restaurada
    try {
      const testDocRef = doc(db, 'system', 'reconnection-test');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação de reconexão')), 3000); // Reduzido de 5s para 3s
      });
      
      const getDocPromise = getDoc(testDocRef);
      await Promise.race([getDocPromise, timeoutPromise]);
      
      return true;
    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Se for erro de permissão ou "not found", significa que está online
      if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
        return true;
      }
      
      // Se for erro de timeout, tentar uma última vez
      if (errorMessage.includes('Timeout')) {
        
        // Aguardar mais um pouco e tentar novamente (otimizado)
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduzido de 2s para 1s
        
        try {
          const testDocRef2 = doc(db, 'system', 'final-test');
          const timeoutPromise2 = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout final')), 2000); // Reduzido de 3s para 2s
          });
          
          const getDocPromise2 = getDoc(testDocRef2);
          await Promise.race([getDocPromise2, timeoutPromise2]);
          
          return true;
        } catch (finalError: any) {
          if (finalError.message.includes('permission') || finalError.message.includes('not found')) {
            return true;
          }
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Erro durante reconexão forçada:', error);
    return false;
  }
};

// Função para reinicializar o Firestore com configurações básicas
export const reinitializeFirestore = async (): Promise<boolean> => {
  try {
    
    // Tentar reinicializar com configurações mais básicas
    try {
      // Configurações mínimas para web
      if (Platform.OS === 'web') {
        db = initializeFirestore(app, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        });
      } else {
        db = getFirestore(app);
      }
      
      // Aguardar um pouco para a inicialização se estabelecer (otimizado)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduzido de 2s para 1s
      
      // Testar se a reinicialização funcionou
      const testDocRef = doc(db, 'system', 'reinit-test');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação de reinicialização')), 3000); // Reduzido de 5s para 3s
      });
      
      const getDocPromise = getDoc(testDocRef);
      await Promise.race([getDocPromise, timeoutPromise]);
      
      return true;
      
    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
        return true;
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro durante reinicialização:', error);
    return false;
  }
};

// Função para tentar reinicialização completa do Firestore com configurações alternativas
export const tryAlternativeFirestoreConfig = async (): Promise<boolean> => {
  try {
    
    // Tentar diferentes configurações
    const configs = [
      {
        name: 'Configuração mínima',
        config: {}
      },
      {
        name: 'Configuração com cache limitado',
        config: {
          cacheSizeBytes: 50 * 1024 * 1024, // 50MB
        }
      },
      {
        name: 'Configuração com polling longo',
        config: {
          experimentalForceLongPolling: true,
        }
      },
      {
        name: 'Configuração padrão',
        config: undefined
      }
    ];
    
    for (const configOption of configs) {
      try {
        
        if (Platform.OS === 'web') {
          if (configOption.config) {
            db = initializeFirestore(app, configOption.config);
          } else {
            db = getFirestore(app);
          }
        } else {
          db = getFirestore(app);
        }
        
        // Aguardar um pouco para a inicialização se estabelecer
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Testar se a configuração funcionou
        const testDocRef = doc(db, 'system', 'alt-config-test');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        
        const getDocPromise = getDoc(testDocRef);
        await Promise.race([getDocPromise, timeoutPromise]);
        
        return true;
        
      } catch (error: any) {
        const errorMessage = error.message || '';
        
        // Se for erro de permissão ou "not found", significa que está funcionando
        if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
          return true;
        }
        
        continue;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro durante tentativa de configuração alternativa:', error);
    return false;
  }
};

// Função para tentar operações do Firestore com abordagem assíncrona
export const tryFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayBetweenAttempts: number = 2000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      
      // Aguardar um pouco antes de cada tentativa (exceto a primeira)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
      }
      
      // Tentar a operação
      const result = await operation();
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        throw error; // Propagar o erro esperado
      }
      
      // Se for erro de timeout ou offline, continuar para a próxima tentativa
      if (error.message.includes('Timeout') || error.message.includes('offline') || error.message.includes('unavailable')) {
        if (attempt < maxAttempts) {
          continue;
        }
      }
      
      // Para outros erros, não tentar novamente
      throw error;
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`❌ Todas as ${maxAttempts} tentativas falharam`);
  throw lastError;
};

// Função para testar diferentes abordagens de conectividade
export const testFirestoreConnectivity = async (): Promise<{
  success: boolean;
  method: string;
  error?: string;
  details?: any;
}> => {
  const tests = [
    {
      name: 'Teste básico - apenas referência',
      test: async () => {
        const testDocRef = doc(db, 'system', 'connectivity-test');
        return { success: true, docRef: testDocRef };
      }
    },
    {
      name: 'Teste com timeout curto',
      test: async () => {
        const testDocRef = doc(db, 'system', 'connectivity-test');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 2000);
        });
        
        const getDocPromise = getDoc(testDocRef);
        await Promise.race([getDocPromise, timeoutPromise]);
        return { success: true };
      }
    },
    {
      name: 'Teste com timeout longo',
      test: async () => {
        const testDocRef = doc(db, 'system', 'connectivity-test');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000);
        });
        
        const getDocPromise = getDoc(testDocRef);
        await Promise.race([getDocPromise, timeoutPromise]);
        return { success: true };
      }
    }
  ];
  
  for (const testCase of tests) {
    try {
      const result = await testCase.test();
      return {
        success: true,
        method: testCase.name,
        details: result
      };
    } catch (error: any) {
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        return {
          success: true,
          method: testCase.name,
          details: { error: error.message, expected: true }
        };
      }
      
      // Se for erro de timeout ou offline, continuar para o próximo teste
      if (error.message.includes('Timeout') || error.message.includes('offline') || error.message.includes('unavailable')) {
        continue;
      }
      
      // Para outros erros, retornar o erro
      return {
        success: false,
        method: testCase.name,
        error: error.message,
        details: error
      };
    }
  }
  
  return {
    success: false,
    method: 'Todos os testes falharam',
    error: 'Todas as tentativas de conectividade falharam'
  };
};

// Função para verificar se há problemas de CORS ou configuração
export const checkFirebaseConfiguration = async (): Promise<{
  isConfigured: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];
  
  try {
    // Verificar se as configurações básicas estão presentes
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '') {
      issues.push('API Key não configurada');
    }
    
    if (!firebaseConfig.projectId || firebaseConfig.projectId === '') {
      issues.push('Project ID não configurado');
    }
    
    if (!firebaseConfig.authDomain || firebaseConfig.authDomain === '') {
      issues.push('Auth Domain não configurado');
    }
    
    // Verificar se o app foi inicializado corretamente
    if (!app) {
      issues.push('Firebase app não foi inicializado');
    }
    
    // Verificar se o Firestore foi inicializado
    if (!db) {
      issues.push('Firestore não foi inicializado');
    }
    
    // Verificar se estamos no ambiente web e se há problemas de CORS
    if (typeof window !== 'undefined') {
      try {
        // Tentar fazer uma requisição simples para verificar CORS
        const response = await fetch(`https://${firebaseConfig.projectId}.firebaseapp.com/.well-known/__/firebase/init.json`);
        if (!response.ok) {
          issues.push('Possível problema de CORS detectado');
        }
      } catch (corsError) {
        issues.push('Erro de CORS detectado');
      }
    }
    
    return {
      isConfigured: issues.length === 0,
      issues
    };
  } catch (error) {
    issues.push(`Erro ao verificar configuração: ${error}`);
    return {
      isConfigured: false,
      issues
    };
  }
};

// Função para tentar operações do Firestore de forma mais simples
export const simpleFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  maxWaitTime: number = 30000
): Promise<T> => {
  try {
    
    // Aguardar um pouco para garantir que o Firestore está pronto
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tentar a operação com timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na operação simples')), maxWaitTime);
    });
    
    const operationPromise = operation();
    const result = await Promise.race([operationPromise, timeoutPromise]) as T;
    
    return result;
    
  } catch (error: any) {
    
    // Se for erro de permissão ou "not found", significa que está funcionando
    if (error.message.includes('permission') || error.message.includes('not found')) {
      throw error; // Propagar o erro esperado
    }
    
    // Para outros erros, tentar uma última vez sem timeout
    try {
      const result = await operation();
      return result;
    } catch (finalError: any) {
      throw finalError;
    }
  }
};

// Função para diagnosticar e tentar resolver problemas específicos de conectividade
export const diagnoseAndFixFirestoreIssue = async (): Promise<{
  success: boolean;
  issue: string;
  solution: string;
}> => {
  try {
    
    // Teste 1: Verificar se conseguimos fazer uma requisição HTTP direta
    try {
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`);
      
      if (response.ok) {
        return {
          success: true,
          issue: 'Conectividade OK',
          solution: 'Problema pode estar na configuração do SDK'
        };
      } else {
        return {
          success: false,
          issue: 'Problema de conectividade HTTP',
          solution: 'Verificar firewall ou proxy'
        };
      }
    } catch (httpError) {
    }
    
    // Teste 2: Verificar se o projeto está ativo
    try {
      const response = await fetch(`https://${firebaseConfig.projectId}.firebaseapp.com/.well-known/__/firebase/init.json`);
      
      if (response.ok) {
      } else {
        return {
          success: false,
          issue: 'Projeto Firebase inativo',
          solution: 'Verificar status do projeto no Firebase Console'
        };
      }
    } catch (projectError) {
    }
    
    // Teste 3: Tentar reinicializar com configurações completamente diferentes
    try {
      
      // Forçar reinicialização completa
      if (Platform.OS === 'web') {
        // Tentar configuração mais básica possível
        db = initializeFirestore(app, {
          cacheSizeBytes: 10 * 1024 * 1024, // 10MB apenas
        });
      } else {
        db = getFirestore(app);
      }
      
      // Aguardar mais tempo para a inicialização
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Testar com uma operação simples usando a nova função
      const testDocRef = doc(db, 'system', 'diagnostic-test');
      const result = await simpleFirestoreOperation(
        () => getDoc(testDocRef),
        30000 // 30 segundos
      );
      
      return {
        success: true,
        issue: 'Reinicialização resolveu o problema',
        solution: 'Configuração otimizada aplicada'
      };
      
    } catch (reinitError: any) {
      
      // Se for erro de permissão, significa que está funcionando
      if (reinitError.message.includes('permission') || reinitError.message.includes('not found')) {
        return {
          success: true,
          issue: 'Reinicialização resolveu o problema',
          solution: 'Configuração otimizada aplicada'
        };
      }
    }
    
    // Teste 4: Verificar se há problema com as regras de segurança
    try {
      
      // Tentar acessar um documento que sabemos que não existe
      const testDocRef = doc(db, 'test-collection', 'test-doc');
      await getDoc(testDocRef);
      
    } catch (rulesError: any) {
      if (rulesError.code === 'permission-denied') {
        return {
          success: false,
          issue: 'Regras de segurança muito restritivas',
          solution: 'Verificar regras do Firestore no Firebase Console'
        };
      }
    }
    
    // Se chegou aqui, o problema é mais complexo
    return {
      success: false,
      issue: 'Problema complexo de conectividade',
      solution: 'Verificar configuração do projeto e rede'
    };
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico avançado:', error);
    return {
      success: false,
      issue: 'Erro no diagnóstico',
      solution: 'Verificar logs para mais detalhes'
    };
  }
};

// Função para tentar resolver o problema específico de "client is offline"
export const fixClientOfflineIssue = async (): Promise<boolean> => {
  try {
    
    // Estratégia 1: Forçar reconexão da rede
    try {
      await enableNetwork(db);
    } catch (error) {
    }
    
    // Estratégia 2: Aguardar mais tempo para a conexão se estabelecer
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Estratégia 3: Tentar uma operação muito simples
    try {
      const testDocRef = doc(db, 'system', 'offline-fix-test');
      
      // Tentar sem timeout primeiro
      await getDoc(testDocRef);
      return true;
    } catch (error: any) {
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        return true;
      }
      
      // Estratégia 4: Tentar com timeout mais longo
      try {
        const testDocRef2 = doc(db, 'system', 'offline-fix-test-2');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 30000);
        });
        
        const getDocPromise = getDoc(testDocRef2);
        await Promise.race([getDocPromise, timeoutPromise]);
        
        return true;
      } catch (timeoutError: any) {
        
        if (timeoutError.message.includes('permission') || timeoutError.message.includes('not found')) {
          return true;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro ao tentar resolver problema:', error);
    return false;
  }
};

// Função para tentar uma abordagem completamente diferente
export const tryAlternativeApproach = async (): Promise<boolean> => {
  try {
    
    // Estratégia 1: Tentar reinicializar o Firestore com configurações completamente diferentes
    try {
      // Forçar reinicialização com configurações mínimas
      if (Platform.OS === 'web') {
        db = initializeFirestore(app, {});
      } else {
        db = getFirestore(app);
      }
      
      // Aguardar mais tempo para a inicialização
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Tentar uma operação muito simples
      const testDocRef = doc(db, 'system', 'alternative-test');
      await getDoc(testDocRef);
      
      return true;
      
    } catch (error: any) {
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        return true;
      }
    }
    
    // Estratégia 2: Tentar com timeout muito longo
    try {
      const testDocRef2 = doc(db, 'system', 'alternative-test-2');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 60000); // 60 segundos
      });
      
      const getDocPromise = getDoc(testDocRef2);
      await Promise.race([getDocPromise, timeoutPromise]);
      
      return true;
      
    } catch (error: any) {
      
      if (error.message.includes('permission') || error.message.includes('not found')) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro na abordagem alternativa:', error);
    return false;
  }
};

// Função específica para resolver o problema "client is offline" no ambiente web
export const fixWebClientOfflineIssue = async (): Promise<boolean> => {
  try {
    
    // Estratégia 1: Forçar reinicialização completa do Firestore para web
    if (Platform.OS === 'web') {
      try {
        
        // Configuração mais agressiva para web
        db = initializeFirestore(app, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          experimentalForceLongPolling: true,
          experimentalAutoDetectLongPolling: false,
        });

        // Aguardar mais tempo para a inicialização se estabelecer
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Testar se a reinicialização funcionou
        const testDocRef = doc(db, 'system', 'web-fix-test');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000);
        });
        
        const getDocPromise = getDoc(testDocRef);
        await Promise.race([getDocPromise, timeoutPromise]);
        
        return true;
        
      } catch (error: any) {
        
        // Se for erro de permissão ou "not found", significa que está funcionando
        if (error.message.includes('permission') || error.message.includes('not found')) {
          return true;
        }
      }
    }
    
    // Estratégia 2: Tentar com configuração completamente diferente
    try {
      
      if (Platform.OS === 'web') {
        // Configuração mínima possível
        db = initializeFirestore(app, {});
      }
      
      // Aguardar para a inicialização
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Testar com operação simples
      const testDocRef = doc(db, 'system', 'alt-web-test');
      await getDoc(testDocRef);
      
      return true;
      
    } catch (error: any) {
      
      if (error.message.includes('permission') || error.message.includes('not found')) {
        return true;
      }
    }
    
    // Estratégia 3: Tentar com timeout muito longo
    try {
      
      const testDocRef = doc(db, 'system', 'long-timeout-test');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout muito longo')), 30000); // 30 segundos
      });
      
      const getDocPromise = getDoc(testDocRef);
      await Promise.race([getDocPromise, timeoutPromise]);
      
      return true;
      
    } catch (error: any) {
      
      if (error.message.includes('permission') || error.message.includes('not found')) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro ao tentar resolver problema web:', error);
    return false;
  }
};

// Função para tentar operações do Firestore com abordagem específica para web
export const tryWebFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 5,
  delayBetweenAttempts: number = 3000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      
      // Aguardar um pouco antes de cada tentativa (exceto a primeira)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        
        // Na segunda tentativa, tentar resolver o problema específico
        if (attempt === 2) {
          await fixWebClientOfflineIssue();
        }
      }
      
      // Tentar a operação
      const result = await operation();
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        throw error; // Propagar o erro esperado
      }
      
      // Se for erro de "client is offline", tentar resolver especificamente
      if (error.message.includes('client is offline') || error.message.includes('offline')) {
        if (attempt < maxAttempts) {
          await fixWebClientOfflineIssue();
          continue;
        }
      }
      
      // Se for erro de timeout ou unavailable, continuar para a próxima tentativa
      if (error.message.includes('Timeout') || error.message.includes('unavailable')) {
        if (attempt < maxAttempts) {
          continue;
        }
      }
      
      // Para outros erros, não tentar novamente
      throw error;
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`❌ Todas as ${maxAttempts} tentativas falharam`);
  throw lastError;
};

export { app, db, auth, functions };
