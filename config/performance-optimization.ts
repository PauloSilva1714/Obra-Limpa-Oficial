// Configurações de otimização de performance para a aplicação
// Este arquivo deve ser importado no início da aplicação

// Otimização para React Native Web
if (typeof window !== 'undefined') {
  // Configurar passive event listeners para melhor performance
  const addEventListenerOriginal = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Tornar eventos de scroll e touch passivos por padrão
    if (type === 'scroll' || type === 'touchstart' || type === 'touchmove' || type === 'wheel') {
      if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      } else if (typeof options === 'object' && options !== null) {
        options = { ...options, passive: true };
      } else {
        options = { passive: true };
      }
    }
    
    return addEventListenerOriginal.call(this, type, listener, options);
  };

  // Otimizar requestAnimationFrame para melhor performance
  let rafId: number | null = null;
  const optimizedRaf = (callback: FrameRequestCallback) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(callback);
    return rafId;
  };

  // Substituir requestAnimationFrame global se necessário
  if (window.requestAnimationFrame) {
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return originalRaf(callback);
    };
  }

  // Configurar IntersectionObserver para lazy loading otimizado
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      rootMargin: '50px',
      threshold: 0.1
    };
    
    // Disponibilizar configuração global para componentes
    (window as any).__PERFORMANCE_CONFIG__ = {
      intersectionObserver: observerOptions,
      enableLazyLoading: true,
      enableVirtualization: true
    };
  }

  // Otimizar console para produção
  if (process.env.NODE_ENV === 'production') {
    // Manter apenas console.error e console.warn em produção
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
  }

  // Configurar debounce global para eventos frequentes
  (window as any).__debounce__ = function<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      
      const callNow = immediate && !timeout;
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func(...args);
    };
  };

  // Configurar throttle global para eventos de scroll
  (window as any).__throttle__ = function<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
}

// Configurações para React Native
export const performanceConfig = {
  // Configurações de rede otimizadas
  network: {
    timeout: 3000, // Timeout reduzido para 3s
    retryAttempts: 2,
    retryDelay: 1000
  },
  
  // Configurações de cache
  cache: {
    maxSize: 50, // Máximo de 50 itens no cache
    ttl: 300000 // 5 minutos de TTL
  },
  
  // Configurações de UI
  ui: {
    animationDuration: 200, // Animações mais rápidas
    debounceDelay: 300,
    throttleDelay: 100
  },
  
  // Configurações de Firebase
  firebase: {
    connectionTimeout: 3000,
    reconnectDelay: 1500,
    maxRetries: 3
  }
};

// Função para aplicar otimizações de performance
export const applyPerformanceOptimizations = () => {
  // Configurar timeouts globais mais agressivos
  if (typeof window !== 'undefined') {
    // Configurar fetch com timeout padrão
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), performanceConfig.network.timeout);
      
      const fetchPromise = originalFetch(input, {
        ...init,
        signal: controller.signal
      });
      
      return fetchPromise.finally(() => clearTimeout(timeoutId));
    };
  }
};

export default performanceConfig;