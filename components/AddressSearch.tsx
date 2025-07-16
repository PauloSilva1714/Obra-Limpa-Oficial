import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Search, X, Navigation, Clock, Heart, HeartOff, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AddressService, { AddressResult } from '@/services/AddressService';

const { width } = Dimensions.get('window');

interface AddressSearchProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelect: (address: string, lat?: number, lng?: number) => void;
  style?: any;
}

export default function AddressSearch({
  placeholder = "Digite o endereço da obra",
  value,
  onChangeText,
  onAddressSelect,
  style
}: AddressSearchProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [recentAddresses, setRecentAddresses] = useState<AddressResult[]>([]);
  const [favoriteAddresses, setFavoriteAddresses] = useState<AddressResult[]>([]);
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Debounce para busca
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar dados salvos ao abrir o modal
  useEffect(() => {
    if (showModal) {
      loadSavedAddresses();
    }
  }, [showModal]);

  const loadSavedAddresses = async () => {
    try {
      const [recent, favorites] = await Promise.all([
        AddressService.getRecentAddresses(),
        AddressService.getFavoriteAddresses()
      ]);
      
      setRecentAddresses(recent);
      setFavoriteAddresses(favorites);
    } catch (error) {
      // Usar dados simulados em caso de erro
      const mockRecent = await AddressService.getMockRecentAddresses();
      setRecentAddresses(mockRecent);
    }
  };

  useEffect(() => {
    if (showModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [showModal, fadeAnim, slideAnim]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowModal(true);
    setSearchText(value);
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!text.trim() || text.length < 3) {
      setSearchResults([]);
      return;
    }

    // Debounce de 500ms
    searchTimeoutRef.current = setTimeout(async () => {
    setIsSearching(true);
    try {
        const results = await AddressService.searchAddresses(text);
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
        // Mostrar erro apenas se não for um erro de rede esperado
        if (error instanceof Error && !error.message.includes('Failed to fetch')) {
          Alert.alert('Erro', 'Não foi possível buscar endereços. Tente novamente.');
        }
    } finally {
      setIsSearching(false);
    }
    }, 500);
  };

  const handleAddressSelect = async (address: AddressResult) => {
    try {
      // Se for um resultado de busca, obter detalhes completos
      if (address.type === 'search' && address.placeId) {
        const details = await AddressService.getAddressDetails(address.placeId);
        if (details) {
          address = details;
        }
      }

      // Salvar nos recentes
      await AddressService.saveToRecent(address);
      
      // Atualizar o campo
      onChangeText(address.address);
      onAddressSelect(address.address, address.lat, address.lng);
      
      // Fechar modal
      setShowModal(false);
      setIsFocused(false);
      
      // Recarregar dados salvos
      await loadSavedAddresses();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar este endereço');
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const currentLocation = await AddressService.getCurrentLocation();
      
      if (currentLocation) {
        await handleAddressSelect(currentLocation);
      } else {
        Alert.alert('Erro', 'Não foi possível obter sua localização atual');
      }
    } catch (error) {
      Alert.alert('Erro', 'Permissão de localização negada ou erro ao obter localização');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleToggleFavorite = async (address: AddressResult) => {
    try {
      const isFavorite = await AddressService.isFavorite(address.address);
      
      if (isFavorite) {
        await AddressService.removeFromFavorites(address.id);
        Alert.alert('Sucesso', 'Endereço removido dos favoritos');
      } else {
        await AddressService.addToFavorites(address);
        Alert.alert('Sucesso', 'Endereço adicionado aos favoritos');
      }
      
      // Recarregar favoritos
      const favorites = await AddressService.getFavoriteAddresses();
      setFavoriteAddresses(favorites);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o favorito');
    }
  };

  const renderAddressItem = ({ item }: { item: AddressResult }) => {
    const isFavorite = favoriteAddresses.some(fav => fav.address === item.address);
    
    return (
      <TouchableOpacity
        style={[styles.addressItem, { borderBottomColor: colors.border }]}
        onPress={() => handleAddressSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.addressIcon}>
          {item.type === 'recent' ? (
            <Clock size={20} color={colors.primary} />
          ) : item.type === 'saved' ? (
            <Star size={20} color={colors.primary} />
          ) : item.type === 'current' ? (
            <Navigation size={20} color={colors.primary} />
          ) : (
            <Search size={20} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.addressContent}>
          <Text style={[styles.addressTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.addressSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        {item.type !== 'search' && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(item)}
          >
            {isFavorite ? (
              <Heart size={20} color="#EF4444" fill="#EF4444" />
            ) : (
              <HeartOff size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{count}</Text>
    </View>
  );

  const getDisplayData = () => {
    if (searchText) {
      return searchResults;
    }
    
    const allData = [
      ...favoriteAddresses,
      ...recentAddresses.filter(addr => !favoriteAddresses.some(fav => fav.address === addr.address))
    ];
    
    return allData;
  };

  const renderModalContent = () => (
    <Animated.View
      style={[
        styles.modalContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: colors.surface
        }
      ]}
    >
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          Escolha o endereço da obra
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowModal(false)}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Campo de busca */}
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar endereço..."
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor={colors.textMuted}
          autoFocus
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoading} />
        )}
      </View>

      {/* Localização atual */}
      <TouchableOpacity
        style={[styles.currentLocationButton, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={handleUseCurrentLocation}
        disabled={isLoadingLocation}
        activeOpacity={0.7}
      >
        <Navigation size={20} color={colors.primary} />
        <Text style={[styles.currentLocationText, { color: colors.text }]}>
          {isLoadingLocation ? 'Obtendo localização...' : 'Usar localização atual'}
        </Text>
      </TouchableOpacity>

      {/* Lista de resultados */}
      <FlatList
        data={getDisplayData()}
        renderItem={renderAddressItem}
        keyExtractor={(item) => item.id}
        style={styles.addressList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !searchText && (favoriteAddresses.length > 0 || recentAddresses.length > 0) ? (
            <View>
              {favoriteAddresses.length > 0 && renderSectionHeader('Favoritos', favoriteAddresses.length)}
              {recentAddresses.length > 0 && renderSectionHeader('Recentes', recentAddresses.length)}
            </View>
          ) : null
        }
        ListEmptyComponent={
          isSearching ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Buscando endereços...
              </Text>
            </View>
          ) : searchText ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Nenhum endereço encontrado
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Digite para buscar endereços ou use sua localização atual
              </Text>
            </View>
          )
        }
      />
    </Animated.View>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          { 
            borderColor: isFocused ? colors.primary : colors.border, 
            backgroundColor: colors.surface 
          },
          style
        ]}
        onPress={handleFocus}
        activeOpacity={0.8}
      >
        <MapPin size={20} color={colors.textMuted} style={styles.inputIcon} />
        <Text
          style={[
            styles.input,
            { color: value ? colors.text : colors.textMuted }
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleFocus}
        >
          <Search size={20} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
        accessible={true}
      >
        <View style={styles.modalOverlay} accessible={true}>
          {renderModalContent()}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 60,
    justifyContent: 'flex-start',
  },
  inputIcon: {
    marginRight: 16,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    lineHeight: 20,
    textAlignVertical: 'center',
    color: '#1F2937',
  },
  searchButton: {
    padding: 4,
    marginLeft: 4,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    flex: 1,
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  currentLocationText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
    color: '#1F2937',
  },
  addressList: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
    color: '#1F2937',
  },
  addressSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  favoriteButton: {
    padding: 8,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    color: '#6B7280',
  },
  searchLoading: {
    marginLeft: 12,
  },
}); 