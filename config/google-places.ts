// Configuração do Google Places API
// Chave real configurada para o projeto Obra Limpa
import Constants from 'expo-constants';

// INTERCEPTADOR GLOBAL - FORÇA PROXY EM TODAS AS CHAMADAS
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Se for uma chamada para Google Maps API, redireciona para o proxy
    if (url.includes('maps.googleapis.com')) {
      console.log('🚫 INTERCEPTANDO CHAMADA DIRETA PARA GOOGLE MAPS:', url);
      
      // Extrair parâmetros da URL original
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Determinar o endpoint baseado na URL
      let endpoint = 'autocomplete';
      if (url.includes('/geocode/')) {
        endpoint = 'geocode';
      } else if (url.includes('/details/')) {
        endpoint = 'details';
      }
      
      // Construir URL do proxy
      const proxyUrl = new URL('https://obra-limpa-proxy.vercel.app/api/google-places');
      proxyUrl.searchParams.append('endpoint', endpoint);
      
      // Copiar todos os parâmetros
      params.forEach((value, key) => {
        proxyUrl.searchParams.append(key, value);
      });
      
      const finalProxyUrl = proxyUrl.toString();
      console.log('✅ REDIRECIONANDO PARA PROXY:', finalProxyUrl);
      
      return originalFetch(finalProxyUrl, init);
    }
    
    return originalFetch(input, init);
  };
  
  console.log('🔧 INTERCEPTADOR DE FETCH INSTALADO - Todas as chamadas para Google Maps serão redirecionadas para o proxy');
}

export const GOOGLE_PLACES_CONFIG = {
  API_KEY: Constants.expoConfig?.extra?.EXPO_GOOGLE_PLACES_API_KEY,
  // URLs base para as APIs
  PLACES_BASE_URL: 'https://maps.googleapis.com/maps/api/place',
  GEOCODING_BASE_URL: 'https://maps.googleapis.com/maps/api/geocode',
  // Configurações padrão
  DEFAULT_COUNTRY: 'br', // Brasil (mantido para geocodificação reversa)
  DEFAULT_LANGUAGE: 'pt-BR',
  DEFAULT_TYPES: 'address',
  // Limites e timeouts
  SEARCH_DELAY: 300, // ms
  MAX_RESULTS: 5,
  REQUEST_TIMEOUT: 10000, // ms
};

// Função para obter a chave da API (permite diferentes chaves para diferentes ambientes)
export const getApiKey = (): string => {
  // Em produção, você pode usar variáveis de ambiente
  if (__DEV__) {
    return GOOGLE_PLACES_CONFIG.API_KEY ?? '';
  }
  
  // Para produção, use uma chave diferente se necessário
  return GOOGLE_PLACES_CONFIG.API_KEY ?? '';
};

// Função para validar se a chave está configurada
export const isApiKeyConfigured = (): boolean => {
  const key = getApiKey();
  return !!key && key !== 'YOUR_GOOGLE_PLACES_API_KEY' && key.length > 0;
};

// URL do proxy Vercel que sabemos que funciona
const PROXY_URL = 'https://obra-limpa-proxy.vercel.app/api/google-places';

// Função para obter URL completa da API
export const getPlacesApiUrl = (endpoint: string, params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  console.log('🔍 getPlacesApiUrl - INÍCIO DA FUNÇÃO');
  console.log('🔑 API Key:', apiKey ? 'Configurada' : 'Não configurada');
  console.log('🌐 Platform check - window:', typeof window !== 'undefined');
  console.log('📄 Platform check - document:', typeof document !== 'undefined');
  console.log('🧭 Platform check - navigator:', typeof navigator !== 'undefined');
  console.log('🔗 PROXY_URL:', PROXY_URL);
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  // FORÇAR SEMPRE O USO DO PROXY - SOLUÇÃO TEMPORÁRIA
  console.log('⚠️ FORÇANDO USO DO PROXY PARA TODOS OS CASOS');
  
  const url = new URL(PROXY_URL);
  url.searchParams.append('endpoint', endpoint);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // O proxy espera a chave da API como parâmetro
  url.searchParams.append('key', apiKey);
  const finalUrl = url.toString();
  console.log('✅ USANDO PROXY URL:', finalUrl);
  return finalUrl;
};

// Função para obter URL de geocodificação
export const getGeocodingApiUrl = (params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  console.log('🔍 getGeocodingApiUrl - INÍCIO DA FUNÇÃO');
  console.log('🔑 API Key:', apiKey ? 'Configurada' : 'Não configurada');
  console.log('🌐 Platform check - window:', typeof window !== 'undefined');
  console.log('📄 Platform check - document:', typeof document !== 'undefined');
  console.log('🧭 Platform check - navigator:', typeof navigator !== 'undefined');
  console.log('🔗 PROXY_URL:', PROXY_URL);
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  // FORÇAR SEMPRE O USO DO PROXY - SOLUÇÃO TEMPORÁRIA
  console.log('⚠️ FORÇANDO USO DO PROXY PARA TODOS OS CASOS');
  
  const url = new URL(PROXY_URL);
  url.searchParams.append('endpoint', 'geocode');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // O proxy espera a chave da API como parâmetro
  url.searchParams.append('key', apiKey);
  const finalUrl = url.toString();
  console.log('✅ USANDO PROXY URL:', finalUrl);
  return finalUrl;
};