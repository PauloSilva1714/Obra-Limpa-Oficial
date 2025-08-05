import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  type: 'javascript' | 'promise' | 'chunk' | 'network' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
}

const ERROR_STORAGE_KEY = 'app_error_logs';
const MAX_STORED_ERRORS = 20;

// Função para determinar a severidade do erro
const getErrorSeverity = (error: any): 'low' | 'medium' | 'high' | 'critical' => {
  const message = error?.message || error?.reason?.message || '';
  const stack = error?.stack || error?.reason?.stack || '';
  
  // Timeouts são considerados médios (não críticos)
  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'medium';
  }
  
  // Erros de rede são médios
  if (message.includes('network') || message.includes('fetch')) {
    return 'medium';
  }
  
  // Erros de chunk loading são baixos (comuns em desenvolvimento)
  if (message.includes('Loading chunk') || message.includes('ChunkLoadError')) {
    return 'low';
  }
  
  // Erros de Firebase são médios
  if (message.includes('firebase') || message.includes('firestore')) {
    return 'medium';
  }
  
  // Erros de autenticação são altos
  if (message.includes('auth') || message.includes('permission')) {
    return 'high';
  }
  
  // Outros erros são médios por padrão
  return 'medium';
};

// Função para determinar o tipo do erro
const getErrorType = (error: any): ErrorLog['type'] => {
  const message = error?.message || error?.reason?.message || '';
  
  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'timeout';
  }
  
  if (message.includes('Loading chunk') || message.includes('ChunkLoadError')) {
    return 'chunk';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'network';
  }
  
  if (error?.promise) {
    return 'promise';
  }
  
  return 'javascript';
};

// Função para verificar se o erro deve ser ignorado
const shouldIgnoreError = (error: any): boolean => {
  const message = error?.message || error?.reason?.message || '';
  
  // Ignorar timeouts de desenvolvimento (muito comuns)
  if (process.env.NODE_ENV === 'development' && message.includes('timeout')) {
    return true;
  }
  
  // Ignorar erros de chunk loading em desenvolvimento
  if (process.env.NODE_ENV === 'development' && message.includes('Loading chunk')) {
    return true;
  }
  
  // Ignorar erros de extensões do navegador
  if (message.includes('extension') || message.includes('chrome-extension')) {
    return true;
  }
  
  return false;
};

async function saveErrorLog(errorLog: ErrorLog): Promise<void> {
  try {
    const existingLogs = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
    const logs: ErrorLog[] = existingLogs ? JSON.parse(existingLogs) : [];
    
    // Adicionar novo log no início
    logs.unshift(errorLog);
    
    // Manter apenas os últimos MAX_STORED_ERRORS logs
    const trimmedLogs = logs.slice(0, MAX_STORED_ERRORS);
    
    await AsyncStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (storageError) {
    }
}

function createErrorLog(
  message: string,
  stack?: string,
  type: ErrorLog['type'] = 'javascript',
  context?: any
): ErrorLog {
  const severity = getErrorSeverity({ message, stack });
  
  return {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    message,
    stack,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    type,
    severity,
    context
  };
}

export const setupGlobalErrorHandler = () => {
  
  // Tratamento de erros não capturados
  if (Platform.OS === 'web') {
    // Para web
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('error', (event) => {
        const error = {
          message: event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        };
        
        if (shouldIgnoreError(error)) {
          return;
        }
        
        const errorLog = createErrorLog(
          event.message,
          event.error?.stack,
          'javascript',
          {
            filename: event.filename,
            lineNumber: event.lineno,
            columnNumber: event.colno
          }
        );
        
        saveErrorLog(errorLog);
        
        // Apenas mostrar alertas para erros críticos
        if (errorLog.severity === 'critical') {
          } else {
          }
      });

      window.addEventListener('unhandledrejection', (event) => {
        const error = {
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          promise: event.promise
        };
        
        if (shouldIgnoreError(error)) {
          event.preventDefault(); // Previne o log padrão do navegador
          return;
        }
        
        const type = getErrorType(error);
        const errorLog = createErrorLog(
          error.message,
          error.stack,
          type,
          { reason: event.reason }
        );
        
        saveErrorLog(errorLog);
        
        // Para timeouts, apenas logar sem alertas
        if (type === 'timeout') {
          event.preventDefault(); // Previne o log padrão do navegador
          return;
        }
        
        // Para outros erros, usar severidade para decidir o log
        if (errorLog.severity === 'critical' || errorLog.severity === 'high') {
          } else {
          }
        
        // Prevenir o log padrão do navegador para erros de baixa severidade
        if (errorLog.severity === 'low') {
          event.preventDefault();
        }
      });
      
    }
  } else {
    // Para mobile (React Native)
    try {
      // Usar ErrorUtils do React Native se disponível
      if (typeof ErrorUtils !== 'undefined') {
        const originalHandler = ErrorUtils.getGlobalHandler();
        
        ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
          // Log adicional para erros fatais
          if (isFatal) {
            }
          
          // Log para erros específicos do React Native
          if (error?.message?.includes('ReferenceError') ||
              error?.message?.includes('TypeError') ||
              error?.message?.includes('Cannot read property')) {
            }
          
          // Chamar o handler original se existir
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
        
      } else {
        }
    } catch (error) {
      }

    // Capturar promises rejeitadas
    if (typeof global.Promise !== 'undefined') {
      // Não sobrescrever o comportamento padrão, apenas logar
      if (typeof process !== 'undefined' && process.on) {
        process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
          // Log para erros específicos
          if (reason?.code === 'auth/network-request-failed' ||
              reason?.message?.includes('Firebase') ||
              reason?.message?.includes('Firestore')) {
            }
        });
        
      }
    }
  }
  
  // Handler adicional para React
  if (typeof global !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Verificar se é um erro do React
      if (args[0]?.includes?.('Warning:') || 
          args[0]?.includes?.('Error:') ||
          args[0]?.includes?.('React')) {
        }
      
      // Chamar o console.error original
      originalConsoleError(...args);
    };
  }
};