import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getPlacesApiUrl, getGeocodingApiUrl, isApiKeyConfigured, getApiKey } from '@/config/google-places';
import { Platform } from 'react-native';

export interface AddressResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'recent' | 'saved' | 'search' | 'current';
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  timestamp?: number;
}

export interface GooglePlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GooglePlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
}

class AddressService {
  private static instance: AddressService;
  private readonly RECENT_ADDRESSES_KEY = 'recent_addresses';
  private readonly FAVORITE_ADDRESSES_KEY = 'favorite_addresses';

  private constructor() {}

  public static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  // ===== GOOGLE PLACES API =====

  /**
   * Teste direto da API para debug
   */
  async testApiConnection(): Promise<any> {
    try {
      const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=${getApiKey()}`;
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Erro no teste da API:', error);
      return null;
    }
  }

  /**
   * Busca endereços usando Google Places Autocomplete API
   */
  async searchAddresses(query: string): Promise<AddressResult[]> {
    if (!isApiKeyConfigured()) {
      console.warn('Google Places API key não configurada, usando dados simulados');
      return this.getMockSearchResults(query);
    }

    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      
      // Tentativa 1: Busca padrão
      let params: { input: string; language: string; components: string; types?: string } = {
        input: query,
        language: 'pt-BR',
        components: 'country:br',
      };

      let url = getPlacesApiUrl('autocomplete', params);
      
      
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let data = await response.json();

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        return data.predictions.map((prediction: GooglePlaceResult, index: number) => ({
          id: `search_${index}`,
          title: prediction.structured_formatting.main_text,
          subtitle: prediction.structured_formatting.secondary_text,
          address: prediction.description,
          placeId: prediction.place_id,
          type: 'search' as const,
        }));
      }

      // Tentativa 2: Busca com types específicos
      params = {
        input: query,
        language: 'pt-BR',
        components: 'country:br',
        types: 'geocode',
      };

      url = getPlacesApiUrl('autocomplete', params);
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      data = await response.json();

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        return data.predictions.map((prediction: GooglePlaceResult, index: number) => ({
          id: `search_${index}`,
          title: prediction.structured_formatting.main_text,
          subtitle: prediction.structured_formatting.secondary_text,
          address: prediction.description,
          placeId: prediction.place_id,
          type: 'search' as const,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      console.error('Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        query,
        isApiKeyConfigured: isApiKeyConfigured(),
        apiKey: getApiKey() ? 'Configurada' : 'Não configurada'
      });
      // Fallback para dados simulados em caso de erro
      return this.getMockSearchResults(query);
    }
  }

  /**
   * Obtém detalhes completos de um endereço usando Place ID
   */
  async getAddressDetails(placeId: string): Promise<AddressResult | null> {
    if (!isApiKeyConfigured()) {
      console.warn('Google Places API key não configurada');
      return null;
    }

    try {
      const params = {
        place_id: placeId,
        fields: 'place_id,formatted_address,geometry,name',
        language: 'pt-BR',
      };

      const url = getPlacesApiUrl('details', params);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result as GooglePlaceDetails;
        return {
          id: place.place_id,
          title: place.name || place.formatted_address.split(',')[0],
          subtitle: place.formatted_address,
          type: 'search' as const,
          address: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          placeId: place.place_id,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter detalhes do endereço:', error);
      return null;
    }
  }

  // ===== LOCALIZAÇÃO ATUAL =====

  /**
   * Obtém a localização atual do usuário
   */
  async getCurrentLocation(): Promise<AddressResult | null> {
    try {
      // Solicitar permissões
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permissão de localização negada');
      }

      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      // Geocodificação reversa para obter o endereço
      const address = await this.reverseGeocode(location.coords.latitude, location.coords.longitude);
      
      if (address) {
        return {
          id: 'current_location',
          title: 'Localização atual',
          subtitle: address,
          type: 'current' as const,
          address: address,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter localização atual:', error);
      return null;
    }
  }

  /**
   * Geocodificação reversa para obter endereço a partir de coordenadas
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!isApiKeyConfigured()) {
      console.warn('Google Places API key não configurada, usando endereço simulado');
      return `Localização: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    // Para desenvolvimento web, usar endereço simulado para evitar CORS
    if (
      Platform.OS === 'web' &&
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as any).window !== 'undefined' &&
      (globalThis as any).window.location.hostname === 'localhost'
    ) {
    }

    try {
      const params = {
        latlng: `${lat},${lng}`,
        language: 'pt-BR',
      };

      const url = getGeocodingApiUrl(params);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error('Erro na geocodificação reversa:', error);
      return null;
    }
  }

  // ===== ASYNCSTORAGE =====

  /**
   * Salva endereço nos recentes
   */
  async saveToRecent(address: AddressResult): Promise<void> {
    try {
      const recentAddresses = await this.getRecentAddresses();
      
      // Remover se já existe
      const filtered = recentAddresses.filter(addr => addr.address !== address.address);
      
      // Adicionar no início com timestamp
      const newRecent = {
        ...address,
        id: `recent_${Date.now()}`,
        type: 'recent' as const,
        timestamp: Date.now(),
      };
      
      const updated = [newRecent, ...filtered].slice(0, 10); // Manter apenas 10 recentes
      
      await AsyncStorage.setItem(this.RECENT_ADDRESSES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao salvar endereço recente:', error);
    }
  }

  /**
   * Obtém endereços recentes
   */
  async getRecentAddresses(): Promise<AddressResult[]> {
    try {
      const data = await AsyncStorage.getItem(this.RECENT_ADDRESSES_KEY);
      if (data) {
        const addresses = JSON.parse(data) as AddressResult[];
        // Filtrar endereços mais antigos que 30 dias
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return addresses.filter(addr => (addr.timestamp || 0) > thirtyDaysAgo);
      }
      return [];
    } catch (error) {
      console.error('Erro ao obter endereços recentes:', error);
      return [];
    }
  }

  /**
   * Adiciona endereço aos favoritos
   */
  async addToFavorites(address: AddressResult): Promise<void> {
    try {
      const favorites = await this.getFavoriteAddresses();
      
      // Verificar se já existe
      const exists = favorites.some(fav => fav.address === address.address);
      if (exists) {
        return;
      }
      
      const newFavorite = {
        ...address,
        id: `favorite_${Date.now()}`,
        type: 'saved' as const,
        timestamp: Date.now(),
      };
      
      const updated = [newFavorite, ...favorites];
      await AsyncStorage.setItem(this.FAVORITE_ADDRESSES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
    }
  }

  /**
   * Remove endereço dos favoritos
   */
  async removeFromFavorites(addressId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteAddresses();
      const updated = favorites.filter(fav => fav.id !== addressId);
      await AsyncStorage.setItem(this.FAVORITE_ADDRESSES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
    }
  }

  /**
   * Obtém endereços favoritos
   */
  async getFavoriteAddresses(): Promise<AddressResult[]> {
    try {
      const data = await AsyncStorage.getItem(this.FAVORITE_ADDRESSES_KEY);
      if (data) {
        return JSON.parse(data) as AddressResult[];
      }
      return [];
    } catch (error) {
      console.error('Erro ao obter endereços favoritos:', error);
      return [];
    }
  }

  /**
   * Verifica se um endereço está nos favoritos
   */
  async isFavorite(address: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteAddresses();
      return favorites.some(fav => fav.address === address);
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  }

  /**
   * Limpa todos os dados salvos
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.RECENT_ADDRESSES_KEY, this.FAVORITE_ADDRESSES_KEY]);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }

  // ===== DADOS SIMULADOS (FALLBACK) =====

  /**
   * Dados simulados para quando a API não estiver disponível
   */
  private getMockSearchResults(query: string): AddressResult[] {
    const mockResults = [
      {
        id: 'mock1',
        title: `${query}, 123`,
        subtitle: 'Centro, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 123, Centro, São Paulo - SP`,
        lat: -23.5505,
        lng: -46.6333,
      },
      {
        id: 'mock2',
        title: `${query}, 456`,
        subtitle: 'Vila Madalena, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 456, Vila Madalena, São Paulo - SP`,
        lat: -23.5505,
        lng: -46.6333,
      },
      {
        id: 'mock3',
        title: `${query}, 789`,
        subtitle: 'Pinheiros, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 789, Pinheiros, São Paulo - SP`,
        lat: -23.5505,
        lng: -46.6333,
      },
      {
        id: 'mock4',
        title: `${query}, 321`,
        subtitle: 'Itaim Bibi, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 321, Itaim Bibi, São Paulo - SP`,
        lat: -23.5505,
        lng: -46.6333,
      },
      {
        id: 'mock5',
        title: `${query}, 654`,
        subtitle: 'Moema, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 654, Moema, São Paulo - SP`,
        lat: -23.5505,
        lng: -46.6333,
      },
    ];

    // Filtrar resultados baseado na query
    return mockResults.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Dados simulados para endereços recentes
   */
  async getMockRecentAddresses(): Promise<AddressResult[]> {
    return [
      {
        id: 'mock_recent_1',
        title: 'Rua das Flores, 123',
        subtitle: 'Centro, São Paulo - SP',
        type: 'recent' as const,
        address: 'Rua das Flores, 123, Centro, São Paulo - SP',
        timestamp: Date.now() - 86400000, // 1 dia atrás
      },
      {
        id: 'mock_recent_2',
        title: 'Av. Paulista, 1000',
        subtitle: 'Bela Vista, São Paulo - SP',
        type: 'recent' as const,
        address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP',
        timestamp: Date.now() - 172800000, // 2 dias atrás
      },
    ];
  }
}

export default AddressService.getInstance(); 