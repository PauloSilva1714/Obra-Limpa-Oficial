// Configurações de rede para resolver problemas de CORS e requisições
export const networkConfig = {
  // Configurações para requisições HTTP
  fetch: {
    timeout: 30000, // 30 segundos
    retries: 3,
    retryDelay: 1000, // 1 segundo
  },
  
  // Headers padrão para requisições
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
  
  // Configurações de CORS
  cors: {
    mode: 'cors',
    credentials: 'same-origin',
    allowedOrigins: ['*'],
  },
  
  // Configurações para Firebase
  firebase: {
    timeout: 10000,
    retryAttempts: 3,
    enableOffline: true,
  }
};

// Função para fazer requisições com retry
export const fetchWithRetry = async (url, options = {}, retries = 3) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...networkConfig.headers,
        ...options.headers,
      },
      mode: networkConfig.cors.mode,
      credentials: networkConfig.cors.credentials,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, networkConfig.fetch.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

// Função para verificar conectividade
export const checkConnectivity = async () => {
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    return true;
  } catch (error) {
    console.error('Erro de conectividade:', error);
    return false;
  }
};

// Função para limpar cache
export const clearCache = () => {
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
};

export default networkConfig; 