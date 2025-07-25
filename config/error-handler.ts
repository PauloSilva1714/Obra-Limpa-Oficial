// Configuração global de tratamento de erros
import { Platform } from 'react-native';

export const setupGlobalErrorHandler = () => {
  
  // Tratamento de erros não capturados
  if (Platform.OS === 'web') {
    // Para web
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        console.error('[ErrorHandler] Erro global capturado (web):', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          stack: event.error?.stack
        });
        
        // Log adicional para erros críticos
        if (event.error?.name === 'ChunkLoadError' || 
            event.message?.includes('Loading chunk') ||
            event.message?.includes('Loading CSS chunk')) {
          console.error('[ErrorHandler] Erro de carregamento de chunk detectado');
        }
        
        // Não recarregar a página automaticamente
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('[ErrorHandler] Promise rejeitada não tratada (web):', {
          reason: event.reason,
          promise: event.promise,
          stack: event.reason?.stack
        });
        
        // Log adicional para erros de rede
        if (event.reason?.code === 'NETWORK_ERROR' || 
            event.reason?.message?.includes('fetch') ||
            event.reason?.message?.includes('network')) {
          console.error('[ErrorHandler] Erro de rede detectado');
        }
        
        // Prevenir que o erro apareça no console do navegador
        event.preventDefault();
      });
      
    }
  } else {
    // Para mobile (React Native)
    try {
      // Usar ErrorUtils do React Native se disponível
      if (typeof ErrorUtils !== 'undefined') {
        const originalHandler = ErrorUtils.getGlobalHandler();
        
        ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
          console.error('[ErrorHandler] Erro global mobile:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
            isFatal: isFatal
          });
          
          // Log adicional para erros fatais
          if (isFatal) {
            console.error('[ErrorHandler] ERRO FATAL detectado - app pode crashar');
          }
          
          // Log para erros específicos do React Native
          if (error?.message?.includes('ReferenceError') ||
              error?.message?.includes('TypeError') ||
              error?.message?.includes('Cannot read property')) {
            console.error('[ErrorHandler] Erro de referência/tipo detectado');
          }
          
          // Chamar o handler original se existir
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
        
      } else {
        console.warn('[ErrorHandler] ErrorUtils não disponível');
      }
    } catch (error) {
      console.warn('[ErrorHandler] Não foi possível configurar ErrorUtils:', error);
    }

    // Capturar promises rejeitadas
    if (typeof global.Promise !== 'undefined') {
      // Não sobrescrever o comportamento padrão, apenas logar
      if (typeof process !== 'undefined' && process.on) {
        process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
          console.error('[ErrorHandler] Promise rejeitada não tratada (mobile):', {
            reason: reason,
            stack: reason?.stack,
            promise: promise
          });
          
          // Log para erros específicos
          if (reason?.code === 'auth/network-request-failed' ||
              reason?.message?.includes('Firebase') ||
              reason?.message?.includes('Firestore')) {
            console.error('[ErrorHandler] Erro do Firebase/Firestore detectado');
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
        // console.log('[ErrorHandler] Erro/Warning do React detectado:', args[0]);
      }
      
      // Chamar o console.error original
      originalConsoleError(...args);
    };
  }
  
};

export {};