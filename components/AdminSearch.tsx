import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Search, User, X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AdminService } from '../services/AdminService';
import { AuthService } from '../services/AuthService';

interface AdminSearchProps {
  siteId: string;
  onSelectAdmin: (adminId: string, adminName: string) => void;
  onClose: () => void;
  visible: boolean;
}

export default function AdminSearch({ 
  siteId, 
  onSelectAdmin, 
  onClose, 
  visible 
}: AdminSearchProps) {
  const { colors } = useTheme();
  const [admins, setAdmins] = useState<any[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!siteId) {
      console.log('[AdminSearch] siteId não fornecido');
      return;
    }
    console.log('[AdminSearch] Carregando administradores para siteId:', siteId);
    setLoading(true);
    AuthService.getAdminsBySite(siteId).then(async admins => {
      console.log('[AdminSearch] Administradores encontrados:', admins.length, admins);
      const currentUser = await AuthService.getCurrentUser();
      console.log('[AdminSearch] Usuário atual:', currentUser?.id, currentUser?.name);
      const filteredAdmins = currentUser ? admins.filter(admin => admin.id !== currentUser.id) : admins;
      console.log('[AdminSearch] Administradores filtrados:', filteredAdmins.length, filteredAdmins);
      setAdmins(filteredAdmins);
      setLoading(false);
    }).catch(error => {
      console.error('[AdminSearch] Erro ao carregar administradores:', error);
      setLoading(false);
    });
  }, [siteId]);

  useEffect(() => {
    if (searchText.trim()) {
      const filtered = admins.filter(admin => 
        admin.name.toLowerCase().includes(searchText.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredAdmins(filtered);
    } else {
      setFilteredAdmins(admins);
    }
  }, [searchText, admins]);

  const loadAdmins = async () => {
    try {
      console.log('[AdminSearch] loadAdmins - Carregando administradores para siteId:', siteId);
      setLoading(true);
      const adminsData = await AdminService.getOtherAdmins(siteId);
      console.log('[AdminSearch] loadAdmins - Administradores encontrados:', adminsData.length, adminsData);
      setAdmins(adminsData);
      setFilteredAdmins(adminsData);
    } catch (error) {
      console.error('[AdminSearch] loadAdmins - Erro ao carregar administradores:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAdmin = (admin: any) => {
    onSelectAdmin(admin.id, admin.name);
    setSearchText('');
  };

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Selecionar Administrador
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Pesquisar por nome ou email..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          </View>
        </View>

        {/* Admins List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Carregando administradores...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredAdmins}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.adminItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectAdmin(item)}
              >
                <View style={styles.adminInfo}>
                  {item.photoURL ? (
                    <Image
                      source={{ uri: item.photoURL }}
                      style={[styles.avatar, { backgroundColor: colors.primary }]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}> 
                      <User size={20} color="white" />
                    </View>
                  )}
                  <View style={styles.adminDetails}>
                    <Text style={[styles.adminName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.adminEmail, { color: colors.textMuted }]}> 
                      {item.funcao ? item.funcao : 'Administrador'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.selectText, { color: colors.primary }]}>
                  Selecionar
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={styles.adminsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <User size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchText.trim() ? 'Nenhum administrador encontrado' : 'Nenhum administrador disponível'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {searchText.trim() ? 'Tente uma pesquisa diferente' : 'Não há outros administradores nesta obra'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  adminsList: {
    flex: 1,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});