// Configuração do Google Places API
// Chave real configurada para o projeto Obra Limpa
import Constants from 'expo-constants';

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

// URL da sua Cloud Function (corrigida para a região correta)
const PROXY_URL = 'https://us-central1-bralimpa2.cloudfunctions.net/googlePlacesProxy';

// Função para obter URL completa da API
export const getPlacesApiUrl = (endpoint: string, params: Record<string, string>): string => {
  // Em ambiente web de desenvolvimento, usar o proxy
  if (typeof window !== 'undefined' && __DEV__) {
    console.log('Usando proxy para a API do Google Places');
    const url = new URL(PROXY_URL);
    url.searchParams.append('endpoint', endpoint);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // O proxy espera a chave da API como parâmetro
    url.searchParams.append('key', getApiKey());
    return url.toString();
  }

  const url = new URL(`${GOOGLE_PLACES_CONFIG.PLACES_BASE_URL}/${endpoint}/json`);
  
  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  // Adicionar chave da API
  url.searchParams.append('key', getApiKey());
  
  return url.toString();
};

// Função para obter URL de geocodificação
export const getGeocodingApiUrl = (params: Record<string, string>): string => {
  // Em ambiente web de desenvolvimento, usar o proxy para geocoding também
  if (typeof window !== 'undefined' && __DEV__) {
    console.log('Usando proxy para a API de Geocoding');
    const url = new URL(PROXY_URL);
    // O Geocoding não tem um 'endpoint' no mesmo sentido, então passamos um parâmetro que o proxy possa ignorar
    // ou podemos adaptar o proxy para lidar com isso. Para simplificar, vamos adaptar a URL base no proxy.
    // A função de proxy atual espera um 'endpoint', vamos ajustar a lógica lá e aqui.

    // Ajuste: vamos fazer o proxy inteligente. Ele decidirá a URL base com base no endpoint.
    url.searchParams.append('endpoint', 'geocode'); // geocode será nosso "endpoint" para a API de Geocoding

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    url.searchParams.append('key', getApiKey());
    return url.toString();
  }
  
  const url = new URL(`${GOOGLE_PLACES_CONFIG.GEOCODING_BASE_URL}/json`);
  
  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  // Adicionar chave da API
  url.searchParams.append('key', getApiKey());
  
  return url.toString();
}; 