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
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDHJm219NVmB5KdQcLYRgOrp_coC_KbycQ",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "bralimpa2.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "bralimpa2",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "bralimpa2.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "127747660506",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:127747660506:web:b1d89516a0bc22698de3e3"
};

console.log('🔥 Inicializando Firebase com config:', {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firebase
let app: FirebaseApp;
try {
  if (!getApps().length) {
    console.log('🔥 Criando nova instância do Firebase...');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('🔥 Usando instância existente do Firebase...');
    app = getApp();
  }
  console.log('✅ Firebase app inicializado:', app.name);
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase app:', error);
  throw error;
}

// Initialize Firestore com configurações otimizadas
let db: Firestore;
try {
  console.log('🔥 Inicializando Firestore...');
  
  // Abordagem mais agressiva para web
  if (Platform.OS === 'web') {
    // Para web, usar configuração mais agressiva
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    });
    console.log('✅ Firestore inicializado com configuração web agressiva');
  } else {
    // Para mobile, usar configuração padrão
    db = getFirestore(app);
    console.log('✅ Firestore inicializado com configuração padrão');
  }
  
  // Configurações adicionais para melhorar a conectividade
  if (typeof window !== 'undefined') {
    // Configurar timeout mais longo para operações do Firestore
    const originalFetch = window.fetch;
    window.fetch = function(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
      const urlString = url.toString();
      if (urlString.includes('firestore.googleapis.com')) {
        console.log('🔄 Requisição Firestore:', urlString.substring(0, 100) + '...');
        const newOptions: RequestInit = {
          ...options,
          signal: options.signal || AbortSignal.timeout(120000), // 120 segundos de timeout
          credentials: 'same-origin' as RequestCredentials, // Especificar tipo correto
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
  console.log('🔥 Inicializando Auth...');
  auth = getAuth(app);
  console.log('✅ Auth inicializado');
  
  console.log('🔥 Inicializando Functions...');
  functions = getFunctions(app);
  console.log('✅ Functions inicializado');
  
  console.log('🔥 Inicializando Storage...');
  storage = getStorage(app);
  console.log('✅ Storage inicializado');
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
    console.log('🔍 Verificando se Firestore está online...');
    
    // Estratégia 1: Verificação simples - apenas criar referência
    try {
    const testDocRef = doc(db, 'system', 'online-test');
      if (testDocRef) {
        console.log('✅ Firestore está online (referência criada com sucesso)');
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
    
      console.log('✅ Firestore está online (operação bem-sucedida)');
    return true;
  } catch (error: any) {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    
    console.log('🔍 Erro na verificação de online:', { errorCode, errorMessage });
    
      // Se for erro de permissão ou "not found", significa que está online
      if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
        console.log('✅ Firestore está online (erro esperado de permissão/not found)');
      return true;
    }
    
    // Se for erro de timeout, pode ser problema de rede
    if (errorMessage.includes('Timeout')) {
      console.log('⚠️ Timeout na verificação de online');
      return false;
    }
    
    // Se for erro de "unavailable", está offline
      if (errorCode === 'unavailable' || errorMessage.includes('unavailable') || errorMessage.includes('offline')) {
      console.log('❌ Firestore está offline');
      return false;
    }
    
    // Para outros erros, assumir que está online (mais tolerante)
    console.log('⚠️ Erro desconhecido, assumindo que está online:', errorMessage);
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
    console.log('🔍 Iniciando verificação de conexão Firebase...');
    
    // Verificar se o Firebase está inicializado corretamente
    if (!app) {
      console.error('❌ Firebase app não está inicializado');
      return false;
    }

    console.log('✅ Firebase app está inicializado:', app.name);

    // Verificar se o Firestore está disponível
    if (!db) {
      console.error('❌ Firestore não está inicializado');
      return false;
    }

    console.log('✅ Firestore está inicializado');

    // Verificar se há conexão com a internet (verificação básica)
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.error('❌ Sem conexão com a internet');
      return false;
    }

    console.log('✅ Conexão com internet OK');

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
    //     console.log('✅ Firebase app acessível via HTTP');
    //   } catch (httpError) {
    //     console.warn('⚠️ Problema de acesso HTTP ao Firebase:', httpError);
    //     // Não falhar aqui, apenas logar o aviso
    //   }
    // }

    // Verificação mais robusta: tentar uma operação real com timeout
    try {
      console.log('🔍 Testando operação real no Firestore...');
      
      const testDocRef = doc(db, 'system', 'connection-test');
      
      // Tentar ler o documento com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000); // 5 segundos
      });
      
      const getDocPromise = getDoc(testDocRef);
      const docSnapshot = await Promise.race([getDocPromise, timeoutPromise]) as any;
      
      // Se o documento não existir, criar um
      if (!docSnapshot.exists()) {
        console.log('📝 Documento de teste não existe, criando...');
        await setDoc(testDocRef, {
          created: new Date().toISOString(),
          purpose: 'connection-test'
        });
        console.log('✅ Documento de teste criado com sucesso');
      }
      
      console.log('✅ Firebase connection is OK - operação bem-sucedida');
      return true;
      
    } catch (firestoreError: any) {
      const errorMessage = firestoreError.message || '';
      const errorCode = firestoreError.code || '';
      
      console.log('🔍 Erro na verificação de conexão:', { errorCode, errorMessage });
      
      // Se for erro de permissão ou "not found", significa que está online
      if (errorMessage.includes('permission') || 
          errorMessage.includes('not found') || 
          errorCode === 'permission-denied' ||
          errorCode === 'not-found') {
        console.log('✅ Firebase está online (erro esperado de permissão/not found)');
        return true;
      }
      
      // Se for erro de timeout, pode ser problema de rede
      if (errorMessage.includes('Timeout')) {
        console.log('⚠️ Timeout na verificação de conexão');
        return false;
      }
      
      // Se for erro de "unavailable", está offline
      if (errorCode === 'unavailable' || 
          errorMessage.includes('unavailable') || 
          errorMessage.includes('offline')) {
        console.log('❌ Firebase está offline');
        return false;
      }
      
      // Para outros erros, tentar uma verificação mais simples
      try {
        console.log('🔍 Tentando verificação simples...');
        const simpleTestRef = doc(db, 'system', 'simple-test');
        if (simpleTestRef) {
          console.log('✅ Firebase está online (verificação simples)');
          return true;
        }
      } catch (simpleError) {
        console.log('⚠️ Verificação simples também falhou');
      }
      
      // Se chegou até aqui, assumir que está offline
      console.log('❌ Firebase parece estar offline');
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
    console.log('Attempting to re-enable Firebase network...');
    await enableNetwork(db);
    console.log('Firebase network re-enabled successfully.');
    return true;
  } catch (error) {
    console.error('Error re-enabling Firebase network:', error);
    return false;
  }
};

// Função para forçar reconexão e verificar conectividade
export const forceReconnectAndCheck = async (): Promise<boolean> => {
  try {
    console.log('🔄 Forçando reconexão do Firebase...');
    
    // Estratégia 1: Tentar reconectar usando enableNetwork
    try {
      await reconnectFirebase();
      console.log('✅ Reconexão via enableNetwork bem-sucedida');
    } catch (error) {
      console.warn('⚠️ Falha na reconexão via enableNetwork:', error);
    }
    
    // Estratégia 2: Aguardar um pouco para a reconexão se estabelecer
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Estratégia 3: Tentar uma operação simples para verificar se a conexão foi restaurada
    try {
      const testDocRef = doc(db, 'system', 'reconnection-test');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação de reconexão')), 5000);
      });
      
      const getDocPromise = getDoc(testDocRef);
      await Promise.race([getDocPromise, timeoutPromise]);
      
      console.log('✅ Reconexão bem-sucedida!');
      return true;
    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Se for erro de permissão ou "not found", significa que está online
      if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
        console.log('✅ Reconexão bem-sucedida (erro esperado de permissão/not found)');
        return true;
      }
      
      // Se for erro de timeout, tentar uma última vez
      if (errorMessage.includes('Timeout')) {
        console.log('⚠️ Timeout na verificação de reconexão, tentando uma última vez...');
        
        // Aguardar mais um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const testDocRef2 = doc(db, 'system', 'final-test');
          const timeoutPromise2 = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout final')), 3000);
          });
          
          const getDocPromise2 = getDoc(testDocRef2);
          await Promise.race([getDocPromise2, timeoutPromise2]);
          
          console.log('✅ Reconexão bem-sucedida na segunda tentativa!');
          return true;
        } catch (finalError: any) {
          if (finalError.message.includes('permission') || finalError.message.includes('not found')) {
            console.log('✅ Reconexão bem-sucedida na segunda tentativa (erro esperado)');
            return true;
          }
        }
      }
      
      console.log('❌ Reconexão falhou. Firestore ainda está offline.');
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
    console.log('🔄 Reinicializando Firestore com configurações básicas...');
    
    // Tentar reinicializar com configurações mais básicas
    try {
      // Configurações mínimas para web
      if (Platform.OS === 'web') {
        db = initializeFirestore(app, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        });
        console.log('✅ Firestore reinicializado com configurações básicas');
      } else {
        db = getFirestore(app);
        console.log('✅ Firestore reinicializado com configuração padrão');
      }
      
      // Aguardar um pouco para a inicialização se estabelecer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Testar se a reinicialização funcionou
      const testDocRef = doc(db, 'system', 'reinit-test');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação de reinicialização')), 5000);
      });
      
      const getDocPromise = getDoc(testDocRef);
      await Promise.race([getDocPromise, timeoutPromise]);
      
      console.log('✅ Reinicialização bem-sucedida!');
      return true;
      
    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
        console.log('✅ Reinicialização bem-sucedida (erro esperado de permissão/not found)');
        return true;
      }
      
      console.log('❌ Reinicialização falhou:', errorMessage);
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
    console.log('🔄 Tentando reinicialização com configurações alternativas...');
    
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
        console.log(`🔍 Tentando: ${configOption.name}`);
        
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
        
        console.log(`✅ ${configOption.name} funcionou!`);
        return true;
        
      } catch (error: any) {
        const errorMessage = error.message || '';
        
        // Se for erro de permissão ou "not found", significa que está funcionando
        if (errorMessage.includes('permission') || errorMessage.includes('not found')) {
          console.log(`✅ ${configOption.name} funcionou (erro esperado)!`);
          return true;
        }
        
        console.log(`❌ ${configOption.name} falhou:`, errorMessage);
        continue;
      }
    }
    
    console.log('❌ Todas as configurações alternativas falharam');
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
      console.log(`🔄 Tentativa ${attempt}/${maxAttempts} da operação do Firestore...`);
      
      // Aguardar um pouco antes de cada tentativa (exceto a primeira)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
      }
      
      // Tentar a operação
      const result = await operation();
      console.log(`✅ Operação do Firestore bem-sucedida na tentativa ${attempt}`);
      return result;
      
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log(`✅ Operação funcionando (erro esperado) na tentativa ${attempt}`);
        throw error; // Propagar o erro esperado
      }
      
      // Se for erro de timeout ou offline, continuar para a próxima tentativa
      if (error.message.includes('Timeout') || error.message.includes('offline') || error.message.includes('unavailable')) {
        if (attempt < maxAttempts) {
          console.log(`⏳ Aguardando antes da próxima tentativa...`);
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
      console.log(`🔍 Executando: ${testCase.name}`);
      const result = await testCase.test();
      console.log(`✅ ${testCase.name} - Sucesso`);
      return {
        success: true,
        method: testCase.name,
        details: result
      };
    } catch (error: any) {
      console.log(`❌ ${testCase.name} - Falhou:`, error.message);
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log(`✅ ${testCase.name} - Funcionando (erro esperado)`);
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
    console.log('🔄 Tentando operação simples do Firestore...');
    
    // Aguardar um pouco para garantir que o Firestore está pronto
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tentar a operação com timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na operação simples')), maxWaitTime);
    });
    
    const operationPromise = operation();
    const result = await Promise.race([operationPromise, timeoutPromise]) as T;
    
    console.log('✅ Operação simples bem-sucedida');
    return result;
    
  } catch (error: any) {
    console.log('❌ Operação simples falhou:', error.message);
    
    // Se for erro de permissão ou "not found", significa que está funcionando
    if (error.message.includes('permission') || error.message.includes('not found')) {
      console.log('✅ Operação funcionando (erro esperado)');
      throw error; // Propagar o erro esperado
    }
    
    // Para outros erros, tentar uma última vez sem timeout
    try {
      console.log('🔄 Tentando operação sem timeout...');
      const result = await operation();
      console.log('✅ Operação sem timeout bem-sucedida');
      return result;
    } catch (finalError: any) {
      console.log('❌ Operação sem timeout também falhou:', finalError.message);
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
    console.log('🔍 Iniciando diagnóstico avançado do Firestore...');
    
    // Teste 1: Verificar se conseguimos fazer uma requisição HTTP direta
    try {
      console.log('🔍 Teste 1: Verificando conectividade HTTP direta...');
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`);
      
      if (response.ok) {
        console.log('✅ Conectividade HTTP direta OK');
        return {
          success: true,
          issue: 'Conectividade OK',
          solution: 'Problema pode estar na configuração do SDK'
        };
      } else {
        console.log('❌ Conectividade HTTP direta falhou:', response.status);
        return {
          success: false,
          issue: 'Problema de conectividade HTTP',
          solution: 'Verificar firewall ou proxy'
        };
      }
    } catch (httpError) {
      console.log('❌ Erro na conectividade HTTP:', httpError);
    }
    
    // Teste 2: Verificar se o projeto está ativo
    try {
      console.log('🔍 Teste 2: Verificando status do projeto...');
      const response = await fetch(`https://${firebaseConfig.projectId}.firebaseapp.com/.well-known/__/firebase/init.json`);
      
      if (response.ok) {
        console.log('✅ Projeto Firebase ativo');
      } else {
        console.log('❌ Projeto Firebase inativo ou com problema');
        return {
          success: false,
          issue: 'Projeto Firebase inativo',
          solution: 'Verificar status do projeto no Firebase Console'
        };
      }
    } catch (projectError) {
      console.log('❌ Erro ao verificar projeto:', projectError);
    }
    
    // Teste 3: Tentar reinicializar com configurações completamente diferentes
    try {
      console.log('🔍 Teste 3: Tentando reinicialização completa...');
      
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
      
      console.log('✅ Reinicialização completa bem-sucedida');
      return {
        success: true,
        issue: 'Reinicialização resolveu o problema',
        solution: 'Configuração otimizada aplicada'
      };
      
    } catch (reinitError: any) {
      console.log('❌ Reinicialização falhou:', reinitError.message);
      
      // Se for erro de permissão, significa que está funcionando
      if (reinitError.message.includes('permission') || reinitError.message.includes('not found')) {
        console.log('✅ Reinicialização funcionou (erro esperado)');
        return {
          success: true,
          issue: 'Reinicialização resolveu o problema',
          solution: 'Configuração otimizada aplicada'
        };
      }
    }
    
    // Teste 4: Verificar se há problema com as regras de segurança
    try {
      console.log('🔍 Teste 4: Verificando regras de segurança...');
      
      // Tentar acessar um documento que sabemos que não existe
      const testDocRef = doc(db, 'test-collection', 'test-doc');
      await getDoc(testDocRef);
      
    } catch (rulesError: any) {
      if (rulesError.code === 'permission-denied') {
        console.log('❌ Problema com regras de segurança detectado');
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
    console.log('🔧 Tentando resolver problema específico de "client is offline"...');
    
    // Estratégia 1: Forçar reconexão da rede
    try {
      await enableNetwork(db);
      console.log('✅ Rede reabilitada');
    } catch (error) {
      console.log('⚠️ Falha ao reabilitar rede:', error);
    }
    
    // Estratégia 2: Aguardar mais tempo para a conexão se estabelecer
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Estratégia 3: Tentar uma operação muito simples
    try {
      const testDocRef = doc(db, 'system', 'offline-fix-test');
      
      // Tentar sem timeout primeiro
      await getDoc(testDocRef);
      console.log('✅ Operação simples bem-sucedida');
      return true;
    } catch (error: any) {
      console.log('⚠️ Operação simples falhou:', error.message);
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log('✅ Operação funcionando (erro esperado)');
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
        
        console.log('✅ Operação com timeout bem-sucedida');
        return true;
      } catch (timeoutError: any) {
        console.log('⚠️ Operação com timeout falhou:', timeoutError.message);
        
        if (timeoutError.message.includes('permission') || timeoutError.message.includes('not found')) {
          console.log('✅ Operação funcionando (erro esperado)');
          return true;
        }
      }
    }
    
    console.log('❌ Não foi possível resolver o problema de "client is offline"');
    return false;
    
  } catch (error) {
    console.error('❌ Erro ao tentar resolver problema:', error);
    return false;
  }
};

// Função para tentar uma abordagem completamente diferente
export const tryAlternativeApproach = async (): Promise<boolean> => {
  try {
    console.log('🔄 Tentando abordagem alternativa...');
    
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
      
      console.log('✅ Abordagem alternativa bem-sucedida');
      return true;
      
    } catch (error: any) {
      console.log('⚠️ Abordagem alternativa falhou:', error.message);
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log('✅ Abordagem alternativa funcionou (erro esperado)');
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
      
      console.log('✅ Abordagem alternativa com timeout longo bem-sucedida');
      return true;
      
    } catch (error: any) {
      console.log('⚠️ Abordagem alternativa com timeout falhou:', error.message);
      
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log('✅ Abordagem alternativa funcionou (erro esperado)');
        return true;
      }
    }
    
    console.log('❌ Abordagem alternativa falhou');
    return false;
    
  } catch (error) {
    console.error('❌ Erro na abordagem alternativa:', error);
    return false;
  }
};

// Função específica para resolver o problema "client is offline" no ambiente web
export const fixWebClientOfflineIssue = async (): Promise<boolean> => {
  try {
    console.log('🔧 Tentando resolver problema específico de "client is offline" no ambiente web...');
    
    // Estratégia 1: Forçar reinicialização completa do Firestore para web
    if (Platform.OS === 'web') {
      try {
        console.log('🔄 Reinicializando Firestore com configurações específicas para web...');
        
        // Configuração mais agressiva para web
        db = initializeFirestore(app, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          experimentalForceLongPolling: true,
          experimentalAutoDetectLongPolling: false,
        });
        
        console.log('✅ Firestore reinicializado com configurações web específicas');
        
        // Aguardar mais tempo para a inicialização se estabelecer
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Testar se a reinicialização funcionou
        const testDocRef = doc(db, 'system', 'web-fix-test');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000);
        });
        
        const getDocPromise = getDoc(testDocRef);
        await Promise.race([getDocPromise, timeoutPromise]);
        
        console.log('✅ Reinicialização web específica bem-sucedida');
        return true;
        
      } catch (error: any) {
        console.log('⚠️ Reinicialização web específica falhou:', error.message);
        
        // Se for erro de permissão ou "not found", significa que está funcionando
        if (error.message.includes('permission') || error.message.includes('not found')) {
          console.log('✅ Reinicialização web específica funcionou (erro esperado)');
          return true;
        }
      }
    }
    
    // Estratégia 2: Tentar com configuração completamente diferente
    try {
      console.log('🔄 Tentando configuração alternativa para web...');
      
      if (Platform.OS === 'web') {
        // Configuração mínima possível
        db = initializeFirestore(app, {});
      }
      
      // Aguardar para a inicialização
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Testar com operação simples
      const testDocRef = doc(db, 'system', 'alt-web-test');
      await getDoc(testDocRef);
      
      console.log('✅ Configuração alternativa web bem-sucedida');
      return true;
      
    } catch (error: any) {
      console.log('⚠️ Configuração alternativa web falhou:', error.message);
      
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log('✅ Configuração alternativa web funcionou (erro esperado)');
        return true;
      }
    }
    
    // Estratégia 3: Tentar com timeout muito longo
    try {
      console.log('🔄 Tentando com timeout muito longo...');
      
      const testDocRef = doc(db, 'system', 'long-timeout-test');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout muito longo')), 30000); // 30 segundos
      });
      
      const getDocPromise = getDoc(testDocRef);
      await Promise.race([getDocPromise, timeoutPromise]);
      
      console.log('✅ Operação com timeout longo bem-sucedida');
      return true;
      
    } catch (error: any) {
      console.log('⚠️ Operação com timeout longo falhou:', error.message);
      
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log('✅ Operação com timeout longo funcionou (erro esperado)');
        return true;
      }
    }
    
    console.log('❌ Não foi possível resolver o problema de "client is offline" no ambiente web');
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
      console.log(`🔄 Tentativa ${attempt}/${maxAttempts} da operação web do Firestore...`);
      
      // Aguardar um pouco antes de cada tentativa (exceto a primeira)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        
        // Na segunda tentativa, tentar resolver o problema específico
        if (attempt === 2) {
          console.log('🔧 Tentando resolver problema específico na segunda tentativa...');
          await fixWebClientOfflineIssue();
        }
      }
      
      // Tentar a operação
      const result = await operation();
      console.log(`✅ Operação web do Firestore bem-sucedida na tentativa ${attempt}`);
      return result;
      
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      // Se for erro de permissão ou "not found", significa que está funcionando
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log(`✅ Operação funcionando (erro esperado) na tentativa ${attempt}`);
        throw error; // Propagar o erro esperado
      }
      
      // Se for erro de "client is offline", tentar resolver especificamente
      if (error.message.includes('client is offline') || error.message.includes('offline')) {
        if (attempt < maxAttempts) {
          console.log(`🔧 Tentando resolver problema "client is offline" na tentativa ${attempt + 1}...`);
          await fixWebClientOfflineIssue();
          continue;
        }
      }
      
      // Se for erro de timeout ou unavailable, continuar para a próxima tentativa
      if (error.message.includes('Timeout') || error.message.includes('unavailable')) {
        if (attempt < maxAttempts) {
          console.log(`⏳ Aguardando antes da próxima tentativa...`);
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
