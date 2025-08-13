// Configuração do Google Places API
// Chave real configurada para o projeto Obra Limpa
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const GOOGLE_PLACES_CONFIG = {
  API_KEY: Constants.expoConfig?.extra?.EXPO_GOOGLE_PLACES_API_KEY,
  API_KEY_ANDROID: Constants.expoConfig?.extra?.EXPO_GOOGLE_PLACES_API_KEY_ANDROID,
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
  // Usar chave específica para Android quando estiver na plataforma Android
  if (Platform.OS === 'android') {
    const androidKey = GOOGLE_PLACES_CONFIG.API_KEY_ANDROID;
    if (androidKey) {
      return androidKey;
    }
  }
  
  // Para web e iOS, ou fallback se não houver chave específica para Android
  const webKey = GOOGLE_PLACES_CONFIG.API_KEY;
  return webKey ?? '';
};

// Função para validar se a chave está configurada
export const isApiKeyConfigured = (): boolean => {
  const key = getApiKey();
  return !!key && key !== 'YOUR_GOOGLE_PLACES_API_KEY' && key.length > 0;
};

// Função para obter URL completa da API
export const getPlacesApiUrl = (endpoint: string, params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  // Usar diretamente a API do Google Places
  let baseUrl = '';
  
  switch (endpoint) {
    case 'autocomplete':
      baseUrl = `${GOOGLE_PLACES_CONFIG.PLACES_BASE_URL}/autocomplete/json`;
      break;
    case 'details':
      baseUrl = `${GOOGLE_PLACES_CONFIG.PLACES_BASE_URL}/details/json`;
      break;
    default:
      throw new Error(`Endpoint não suportado: ${endpoint}`);
  }

  const url = new URL(baseUrl);
  
  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Adicionar chave da API
  url.searchParams.append('key', apiKey);
  
  return url.toString();
};

// Função para obter URL de geocodificação
export const getGeocodingApiUrl = (params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  // Usar diretamente a API de Geocodificação do Google
  const url = new URL(`${GOOGLE_PLACES_CONFIG.GEOCODING_BASE_URL}/json`);

  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Adicionar chave da API
  url.searchParams.append('key', apiKey);
  
  return url.toString();
};