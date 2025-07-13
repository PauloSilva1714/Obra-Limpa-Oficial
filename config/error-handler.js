// Handler de erros para resolver problemas de rede e requisições
export class ErrorHandler {
  static handleNetworkError(error) {
    console.error('[ErrorHandler] Erro de rede detectado:', error);
    
    // Verificar se o erro existe e tem propriedades
    if (!error) {
      return {
        type: 'NULL_ERROR',
        message: 'Erro nulo detectado',
        retry: false
      };
    }
    
    // Verificar se é um erro 400
    if (error.status === 400 || error.message?.includes('400')) {
      console.log('[ErrorHandler] Erro 400 detectado, tentando resolver...');
      
      // Limpar cache do navegador
      this.clearBrowserCache();
      
      // Tentar reconectar ao Firebase
      this.reconnectFirebase();
      
      return {
        type: 'NETWORK_ERROR',
        message: 'Erro de conexão detectado. Tentando reconectar...',
        retry: true
      };
    }
    
    return {
      type: 'UNKNOWN_ERROR',
      message: 'Erro desconhecido ocorreu',
      retry: false
    };
  }
  
  static clearBrowserCache() {
    try {
      if (typeof window !== 'undefined') {
        // Limpar cache do navegador
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        // Limpar localStorage
        localStorage.clear();
        
        // Limpar sessionStorage
        sessionStorage.clear();
        
        console.log('[ErrorHandler] Cache do navegador limpo');
      }
    } catch (error) {
      console.error('[ErrorHandler] Erro ao limpar cache:', error);
    }
  }
  
  static reconnectFirebase() {
    try {
      // Recarregar a página para reconectar ao Firebase
      if (typeof window !== 'undefined') {
        console.log('[ErrorHandler] Reconectando ao Firebase...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('[ErrorHandler] Erro ao reconectar:', error);
    }
  }
  
  static async retryRequest(requestFn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        console.error(`[ErrorHandler] Tentativa ${i + 1} falhou:`, error);
        
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
}

// Interceptor global para requisições
export const setupGlobalErrorHandler = () => {
  if (typeof window !== 'undefined') {
    // Interceptar erros não capturados
    window.addEventListener('error', (event) => {
      console.error('[GlobalErrorHandler] Erro capturado:', event.error);
      ErrorHandler.handleNetworkError(event.error);
    });
    
    // Interceptar promessas rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[GlobalErrorHandler] Promessa rejeitada:', event.reason);
      ErrorHandler.handleNetworkError(event.reason);
    });
    
    console.log('[GlobalErrorHandler] Handler global configurado');
  }
};

export default ErrorHandler; 