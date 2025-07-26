/**
 * Configurações de performance para otimizar o carregamento da aplicação
 */

// Configurações de timeout
export const TIMEOUTS = {
  FIREBASE_AUTH: 5000, // 5 segundos
  FIRESTORE_OPERATION: 30000, // 30 segundos
  LISTENER_SETUP: 10000, // 10 segundos
  INITIAL_LOAD_DELAY: 1000, // 1 segundo
};

// Configurações de retry
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  BACKOFF_MULTIPLIER: 2,
};

/**
 * Função para criar timeout com Promise
 */
export const createTimeout = (ms: number, errorMessage?: string) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage || `Timeout de ${ms}ms excedido`));
    }, ms);
  });
};

/**
 * Função para executar operação com timeout
 */
export const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> => {
  return Promise.race([
    operation,
    createTimeout(timeoutMs, errorMessage)
  ]);
};

/**
 * Função para executar operação com retry
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
  delay: number = RETRY_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

/**
 * Função para debounce
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Função para throttle
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Configurações de otimização para diferentes ambientes
 */
export const getOptimizedConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isWeb = typeof window !== 'undefined';
  
  return {
    // Timeouts mais curtos em desenvolvimento
    timeouts: {
      ...TIMEOUTS,
      FIREBASE_AUTH: isDevelopment ? 3000 : TIMEOUTS.FIREBASE_AUTH,
      LISTENER_SETUP: isDevelopment ? 5000 : TIMEOUTS.LISTENER_SETUP,
    },
    
    // Configurações específicas para web
    web: {
      enableServiceWorker: !isDevelopment,
      enableCaching: !isDevelopment,
      preloadCriticalResources: true,
    },
    
    // Configurações de listeners
    listeners: {
      enableRealTime: true,
      batchUpdates: true,
      debounceMs: 300,
      maxConcurrentListeners: 5,
    }
  };
};