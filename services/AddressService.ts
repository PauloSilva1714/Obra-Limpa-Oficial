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
   * Aguarda o carregamento da Google Maps API
   */
  private waitForGoogleMapsApi(): Promise<boolean> {
    return new Promise((resolve) => {
      // Se já está disponível, resolve imediatamente
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
        console.log('[AddressService] Google Maps API já está disponível');
        resolve(true);
        return;
      }

      console.log('[AddressService] Aguardando carregamento da Google Maps API...');

      let resolved = false;

      // Escutar o evento customizado de carregamento
      const handleApiLoaded = (event: any) => {
        if (!resolved) {
          resolved = true;
          console.log('[AddressService] Google Maps API carregada via evento customizado');
          console.log('[AddressService] Evento detail:', event.detail);
          resolve(event.detail?.ready !== false);
        }
      };

      // Escutar evento de erro
      const handleApiError = () => {
        if (!resolved) {
          resolved = true;
          console.error('[AddressService] Google Maps API falhou ao carregar');
          resolve(false);
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('googleMapsApiLoaded', handleApiLoaded, { once: true });
        window.addEventListener('googleMapsApiError', handleApiError, { once: true });
      }

      // Reduzir timeout para 5 segundos (mais rápido)
      let attempts = 0;
      const maxAttempts = 50; // 5 segundos (50 * 100ms)

      const checkApi = () => {
        if (resolved) return;

        attempts++;

        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
          if (!resolved) {
            resolved = true;
            console.log(`[AddressService] Google Maps API carregada após ${attempts * 100}ms (polling)`);
            resolve(true);
          }
          return;
        }

        if (attempts >= maxAttempts) {
          if (!resolved) {
            resolved = true;
            console.log('[AddressService] Timeout aguardando Google Maps API (5s)');
            resolve(false);
          }
          return;
        }

        setTimeout(checkApi, 100);
      };

      checkApi();
    });
  }

  /**
   * Busca endereços usando Google Places JavaScript API (para web)
   */
  private async searchAddressesWeb(query: string): Promise<AddressResult[]> {
    try {
      console.log('[AddressService.searchAddressesWeb] Iniciando busca para:', query);

      // Aguardar o carregamento da API
      const apiLoaded = await this.waitForGoogleMapsApi();

      if (!apiLoaded) {
         console.error('[AddressService.searchAddressesWeb] Google Maps API não carregou, usando dados simulados');
         return this.getMockSearchResults(query);
       }

       console.log('[AddressService.searchAddressesWeb] ✅ Google Maps API disponível, iniciando busca...');

       // Validar se a API está realmente disponível
       if (!window.google || !window.google.maps || !window.google.maps.places) {
         console.error('[AddressService.searchAddressesWeb] ❌ Google Maps Places não está disponível');
         return this.getMockSearchResults(query);
       }

       // Criar o serviço de AutocompleteService
       let service;
       try {
         service = new window.google.maps.places.AutocompleteService();
         console.log('[AddressService.searchAddressesWeb] ✅ AutocompleteService criado com sucesso');
       } catch (serviceError) {
         console.error('[AddressService.searchAddressesWeb] ❌ Erro ao criar AutocompleteService:', serviceError);
         return this.getMockSearchResults(query);
       }

       // Configurar as opções de busca
       const request = {
         input: query,
         componentRestrictions: { country: 'br' },
         language: 'pt-BR',
         types: ['address'] // Buscar apenas endereços
       };

       console.log('[AddressService.searchAddressesWeb] Fazendo busca com Google Places JavaScript API:', request);

       // Fazer a busca usando Promise com timeout
       return new Promise((resolve) => {
         const searchTimeout = setTimeout(() => {
           console.error('[AddressService.searchAddressesWeb] ⏰ Timeout na busca do Google Places');
           resolve(this.getMockSearchResults(query));
         }, 10000); // 10 segundos de timeout

         service.getPlacePredictions(request, (predictions, status) => {
           clearTimeout(searchTimeout);

           console.log('[AddressService.searchAddressesWeb] Status da busca:', status);
           console.log('[AddressService.searchAddressesWeb] Predições recebidas:', predictions?.length || 0);

           if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
             const results = predictions.map((prediction, index) => ({
               id: `web_search_${index}`,
               title: prediction.structured_formatting.main_text,
               subtitle: prediction.structured_formatting.secondary_text,
               address: prediction.description,
               placeId: prediction.place_id,
               type: 'search' as const,
             }));

             console.log('[AddressService.searchAddressesWeb] ✅ Resultados reais encontrados:', results.length);
             resolve(results);
           } else {
             console.warn('[AddressService.searchAddressesWeb] ⚠️ Nenhum resultado encontrado ou erro:', status);
             console.warn('[AddressService.searchAddressesWeb] Status detalhado:', {
               status,
               hasApiKey: !!getApiKey(),
               predictionsCount: predictions?.length || 0
             });
             // Fallback para dados simulados
             resolve(this.getMockSearchResults(query));
           }
         });
       });

     } catch (error) {
       console.error('[AddressService.searchAddressesWeb] ❌ Erro geral ao usar Google Places JavaScript API:', error);
       // Fallback para dados simulados
       return this.getMockSearchResults(query);
     }
   }

  /**
   * Teste da API usando o proxy
   */
  async testApiConnection(): Promise<any> {
    try {
      const testUrl = getPlacesApiUrl('autocomplete', { input: 'test', language: 'pt-BR', components: 'country:br' });

      const response = await fetch(testUrl);
      const data = await response.json();

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Testa se a Google Maps JavaScript API está funcionando corretamente
   */
  async testGoogleMapsJavaScriptApi(): Promise<{success: boolean, details: any}> {
    console.log('[AddressService.testGoogleMapsJavaScriptApi] Iniciando teste da JavaScript API...');

    try {
      // Verificar se estamos no ambiente web
      if (Platform.OS !== 'web') {
        return {
          success: false,
          details: { error: 'Teste só funciona no ambiente web' }
        };
      }

      // Aguardar carregamento da API
      const apiLoaded = await this.waitForGoogleMapsApi();

      if (!apiLoaded) {
        return {
          success: false,
          details: { error: 'Google Maps API não carregou no tempo esperado' }
        };
      }

      // Verificar se a API está disponível
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        return {
          success: false,
          details: {
            error: 'Google Maps API não está disponível',
            hasGoogle: !!window.google,
            hasMaps: !!(window.google && window.google.maps),
            hasPlaces: !!(window.google && window.google.maps && window.google.maps.places)
          }
        };
      }

      // Tentar criar um AutocompleteService
      let service;
      try {
        service = new window.google.maps.places.AutocompleteService();
      } catch (serviceError) {
        return {
          success: false,
          details: {
            error: 'Erro ao criar AutocompleteService',
            serviceError: serviceError?.message || 'Erro desconhecido'
          }
        };
      }

      // Fazer uma busca de teste
      return new Promise((resolve) => {
        const testRequest = {
          input: 'São Paulo',
          componentRestrictions: { country: 'br' },
          language: 'pt-BR',
          types: ['geocode']
        };

        console.log('[AddressService.testGoogleMapsJavaScriptApi] Fazendo busca de teste:', testRequest);

        service.getPlacePredictions(testRequest, (predictions, status) => {
          console.log('[AddressService.testGoogleMapsJavaScriptApi] Resultado do teste:', { status, count: predictions?.length || 0 });

          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
            resolve({
              success: true,
              details: {
                status,
                predictionsCount: predictions.length,
                firstResult: predictions[0]?.description,
                apiKeyWorking: true
              }
            });
          } else {
            resolve({
              success: false,
              details: {
                status,
                predictionsCount: predictions?.length || 0,
                possibleIssues: [
                  status === 'REQUEST_DENIED' ? 'API key inválida ou sem permissões' : null,
                  status === 'OVER_QUERY_LIMIT' ? 'Cota da API excedida' : null,
                  status === 'ZERO_RESULTS' ? 'Nenhum resultado para a busca de teste' : null,
                  'Verifique se a API key está configurada corretamente'
                ].filter(Boolean)
              }
            });
          }
        });

        // Timeout de 15 segundos para o teste
        setTimeout(() => {
          resolve({
            success: false,
            details: { error: 'Timeout no teste da API - a busca demorou mais de 15 segundos' }
          });
        }, 15000);
      });

    } catch (error) {
      console.error('[AddressService.testGoogleMapsJavaScriptApi] Erro no teste:', error);
      return {
        success: false,
        details: {
          error: 'Erro inesperado no teste',
          message: error?.message || 'Erro desconhecido'
        }
      };
    }
  }

    /**
   * Busca endereços usando Google Places Autocomplete API
   */
  async searchAddresses(query: string): Promise<AddressResult[]> {
    console.log('=== DEBUG AddressService.searchAddresses ===');
    console.log('Query:', query);
    console.log('API Key configurada:', isApiKeyConfigured());

    if (!query || query.trim().length < 2) {
      console.log('Query muito curta, retornando array vazio');
      return [];
    }

    try {
      console.log('Iniciando busca na API do Google Places...');

      // Para web, usar Google Places JavaScript API
      if (Platform.OS === 'web') {
        console.log('Executando na web, usando Google Places JavaScript API');
        return this.searchAddressesWeb(query);
      }

      // Tentativa 1: Busca padrão
      let params: { input: string; language: string; components: string; types?: string } = {
        input: query,
        language: 'pt-BR',
        components: 'country:br',
      };

      let url = getPlacesApiUrl('autocomplete', params);
      console.log('URL da API:', url);

      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        console.log('Erro HTTP:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      console.log('Resposta da API:', data);

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        console.log('Resultados encontrados:', data.predictions.length);
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

      console.log('Nenhum resultado encontrado na primeira tentativa');
      return [];
    } catch (error) {
      console.log('Erro na busca:', error);
      // Fallback para dados simulados em caso de erro
      return this.getMockSearchResults(query);
    }
  }

  /**
   * Obtém detalhes completos de um endereço usando Place ID
   */
  async getAddressDetails(placeId: string): Promise<AddressResult | null> {
    if (!isApiKeyConfigured()) {
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
      return null;
    }
  }

  /**
   * Geocodificação reversa para obter endereço a partir de coordenadas
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!isApiKeyConfigured()) {
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
      {
        id: 'mock6',
        title: `${query}, 987`,
        subtitle: 'Jardins, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 987, Jardins, São Paulo - SP`,
        lat: -23.5505,
        lng: -46.6333,
      },
      {
        id: 'mock7',
        title: `${query}, 555`,
        subtitle: 'Vila Olímpia, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 555, Vila Olímpia, São Paulo - SP`,
        lat: -23.5505,
        lng: -46.6333,
      },
      {
        id: 'mock8',
        title: `${query}, 777`,
        subtitle: 'Brooklin, São Paulo - SP',
        type: 'search' as const,
        address: `${query}, 777, Brooklin, São Paulo - SP`,
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
