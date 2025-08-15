/**
 * Configuração do Google Places API
 * Chave real configurada para o projeto Obra Limpa
 */
import { Platform } from 'react-native';

export const GOOGLE_PLACES_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '',
  API_KEY_ANDROID: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID || '',
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

// URL da Firebase Function Proxy
const FIREBASE_FUNCTION_URL = 'https://us-central1-bralimpa2.cloudfunctions.net/googlePlacesProxy';

// Função para obter URL da Firebase Function (proxy)
export const getPlacesApiUrl = (endpoint: string, params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  // Usar Firebase Function como proxy
  const url = new URL(FIREBASE_FUNCTION_URL);
  
  // Adicionar endpoint
  url.searchParams.append('endpoint', endpoint);
  
  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Adicionar chave da API
  url.searchParams.append('key', apiKey);
  
  return url.toString();
};

// Função para obter URL de geocodificação via Firebase Function
export const getGeocodingApiUrl = (params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  // Usar Firebase Function como proxy para geocodificação
  const url = new URL(FIREBASE_FUNCTION_URL);
  
  // Para geocoding, usar endpoint 'geocode'
  url.searchParams.append('endpoint', 'geocode');

  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Adicionar chave da API
  url.searchParams.append('key', apiKey);
  
  return url.toString();
};