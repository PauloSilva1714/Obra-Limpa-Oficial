import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, useWindowDimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, ChevronRight, MapPin, CheckCircle } from 'lucide-react-native';
import { AuthService, User } from '../../services/AuthService';
import { SiteService, SiteWithStats } from '../../services/SiteService';

export default function SiteSelectionScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 500;
  const isVerySmallScreen = width < 400;
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'worker'>('worker');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadSites = async () => {
      try {
        console.log('=== DEBUG: SiteSelection - Iniciando carregamento de obras ===');
        setLoading(true);

        // Debug: Verificar obras específicas
        await AuthService.debugSpecificSites();

        // Debug: Verificar acesso do usuário
        await AuthService.debugUserAccess();

        console.log('=== DEBUG: SiteSelection - Buscando obras do usuário ===');
        const userSites = await SiteService.getUserSites();
        console.log('=== DEBUG: SiteSelection - Obras encontradas:', userSites.length);
        setSites(userSites);

        console.log('=== DEBUG: SiteSelection - Buscando dados do usuário ===');
        const userData = await AuthService.getCurrentUser();
        console.log('=== DEBUG: SiteSelection - Dados do usuário:', userData);
        setUser(userData);

        console.log('=== DEBUG: SiteSelection - Carregamento concluído ===');
      } catch (error) {
        console.error('=== DEBUG: SiteSelection - Erro ao carregar dados:', error);
        Alert.alert('Erro', 'Erro ao carregar obras disponíveis.');
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, []);

  const handleSiteSelection = async (site: SiteWithStats) => {
    try {
      await AuthService.setCurrentSite(site);

      const currentSite = await AuthService.getCurrentSite();

      if (currentSite) {
        // Verificar o papel do usuário para redirecionar corretamente
        const user = await AuthService.getCurrentUser();
        if (user?.role === 'admin') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(worker-tabs)');
        }
      } else {
        throw new Error('Falha ao salvar canteiro');
      }
    } catch (error) {
      console.error('Erro ao selecionar canteiro:', error);
      Alert.alert('Erro', 'Erro ao selecionar obra.');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Erro ao fazer logout.');
    }
  };

  const handleForceUpdateSites = async () => {
    try {
      await AuthService.forceUpdateUserSites();
      Alert.alert('Sucesso', 'Obras atualizadas com sucesso. Recarregue a tela.');
    } catch (error) {
      console.error('Erro ao forçar atualização:', error);
      Alert.alert('Erro', 'Erro ao atualizar obras.');
    }
  };

  const renderSiteItem = ({ item }: { item: SiteWithStats }) => {
    const completionPercentage = item.tasksCount > 0
      ? Math.round((item.completedTasks / item.tasksCount) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={[styles.siteCard, isSmallScreen && styles.siteCardSmall]}
        onPress={() => handleSiteSelection(item)}
      >
        <View style={styles.siteIconContainer}>
          <Building2 size={isVerySmallScreen ? 18 : 20} color="#F97316" />
        </View>
        <View style={styles.siteInfo}>
          <View style={styles.siteHeaderRow}>
            <Text style={[styles.siteName, isVerySmallScreen && styles.siteNameSmall]} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <View style={styles.progressInfo}>
              <CheckCircle size={isVerySmallScreen ? 12 : 14} color="#10B981" />
              <Text style={[styles.taskRatio, isVerySmallScreen && styles.taskRatioSmall]}>
                {item.completedTasks}/{item.tasksCount}
              </Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <View style={[styles.miniBarContainer, isVerySmallScreen && styles.miniBarContainerSmall]}>
              <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${completionPercentage}%` }]} />
              </View>
            </View>
            <Text style={[styles.percentText, isVerySmallScreen && styles.percentTextSmall]}>
              {completionPercentage}%
            </Text>
          </View>
          <View style={styles.addressContainer}>
            <MapPin size={isVerySmallScreen ? 10 : 12} color="#666666" />
            <Text style={[styles.siteAddress, isVerySmallScreen && styles.siteAddressSmall]} numberOfLines={1} ellipsizeMode="tail">
              {item.address}
            </Text>
          </View>
        </View>
        <ChevronRight size={isVerySmallScreen ? 16 : 18} color="#CCCCCC" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando obras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.title, isVerySmallScreen && styles.titleSmall]}>
            Selecionar Obra
          </Text>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isVerySmallScreen && styles.userNameSmall]}>
              {user?.name}
            </Text>
            <Text style={[styles.userRole, isVerySmallScreen && styles.userRoleSmall]}>
              {user?.role === 'admin' ? 'Administrador' : 'Operário'}
            </Text>
          </View>
        </View>

        <Text style={[styles.subtitle, isVerySmallScreen && styles.subtitleSmall]}>
          Selecione uma obra para continuar
        </Text>

        <View style={styles.sitesContainer}>
          {sites.map((site) => (
            <View key={site.id}>
              {renderSiteItem({ item: site })}
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.updateButton, isVerySmallScreen && styles.updateButtonSmall]} onPress={handleForceUpdateSites}>
            <Text style={[styles.updateButtonText, isVerySmallScreen && styles.updateButtonTextSmall]}>
              Atualizar Obras
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.logoutButton, isVerySmallScreen && styles.logoutButtonSmall]} onPress={handleLogout}>
            <Text style={[styles.logoutButtonText, isVerySmallScreen && styles.logoutButtonTextSmall]}>
              Sair
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  titleSmall: {
    fontSize: 20,
    marginBottom: 6,
  },
  userInfo: {
    marginTop: 4,
  },
  userName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  userNameSmall: {
    fontSize: 14,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userRoleSmall: {
    fontSize: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  subtitleSmall: {
    fontSize: 13,
    marginBottom: 12,
  },
  sitesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  siteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  siteCardSmall: {
    padding: 12,
    minHeight: 90,
  },
  siteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  siteInfo: {
    flex: 1,
  },
  siteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  siteNameSmall: {
    fontSize: 14,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  taskRatio: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: 'bold',
    marginLeft: 4,
    marginRight: 8,
  },
  taskRatioSmall: {
    fontSize: 11,
    marginRight: 6,
  },
  miniBarContainer: {
    height: 8,
    width: 60,
    marginRight: 8,
  },
  miniBarContainerSmall: {
    width: 50,
    marginRight: 6,
  },
  miniBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 'bold',
    minWidth: 30,
  },
  percentTextSmall: {
    fontSize: 11,
    minWidth: 25,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  siteAddressSmall: {
    fontSize: 11,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  updateButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButtonSmall: {
    padding: 14,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButtonTextSmall: {
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonSmall: {
    padding: 14,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButtonTextSmall: {
    fontSize: 14,
  },
});
