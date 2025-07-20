import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, ChevronRight, MapPin, CheckCircle } from 'lucide-react-native';
import { AuthService, User } from '../../services/AuthService';
import { SiteService, SiteWithStats } from '../../services/SiteService';

export default function SiteSelectionScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 500;
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'worker'>('worker');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadSites = async () => {
      try {
        setLoading(true);
        console.log('Carregando canteiros...');
        const userSites = await SiteService.getUserSites();
        console.log('Canteiros carregados:', userSites);
        setSites(userSites);

        const userData = await AuthService.getCurrentUser();
        console.log('Dados do usuário carregados:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Alert.alert('Erro', 'Erro ao carregar obras disponíveis.');
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, []);

  const handleSiteSelection = async (site: SiteWithStats) => {
    try {
      console.log('Selecionando canteiro:', site);
      await AuthService.setCurrentSite(site);
      console.log('Canteiro selecionado com sucesso');
      
      // Verificar se o canteiro foi salvo corretamente
      const currentSite = await AuthService.getCurrentSite();
      console.log('Canteiro atual após seleção:', currentSite);
      
      if (currentSite) {
        console.log('Tentando navegar para /(tabs)');
        router.replace('/(tabs)');
        console.log('Navegação concluída');
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
      console.log('Fazendo logout...');
      await AuthService.logout();
      console.log('Logout concluído, redirecionando para login');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Erro ao fazer logout.');
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
        <View style={[styles.siteHeader, isSmallScreen && styles.siteHeaderSmall]}>  
          <View style={styles.siteIconContainer}>
            <Building2 size={24} color="#F97316" />
          </View>
          <View style={[styles.siteInfo, { flex: 1 }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={styles.siteName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
              <CheckCircle size={16} color="#10B981" style={{ marginLeft: 8, marginRight: 2 }} />
              <Text style={styles.taskRatio} numberOfLines={1}>{item.completedTasks}/{item.tasksCount}</Text>
              <View style={styles.miniBarContainer}>
                <View style={styles.miniBarBg}>
                  <View style={[styles.miniBarFill, { width: `${completionPercentage}%` }]} />
                </View>
                <Text style={styles.percentText}>{completionPercentage}%</Text>
              </View>
            </View>
            <View style={styles.addressContainer}>
              <MapPin size={14} color="#666666" />
              <Text style={styles.siteAddress} numberOfLines={1} ellipsizeMode="tail">{item.address}</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#CCCCCC" />
        </View>
        {/* Mantém as estatísticas detalhadas e barra grande se quiser */}
        {/* <View style={[styles.siteStats, isSmallScreen && styles.siteStatsSmall]}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.tasksCount}</Text>
            <Text style={styles.statLabel}>Tarefas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.completedTasks}</Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completionPercentage}%</Text>
            <Text style={styles.statLabel}>Progresso</Text>
          </View>
        </View> */}
        {/* <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${completionPercentage}%` }
              ]} 
            />
          </View>
        </View> */}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecionar Obra</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role === 'admin' ? 'Administrador' : 'Operário'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Selecione uma obra para continuar</Text>
        
        <FlatList
          data={sites}
          renderItem={renderSiteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  userInfo: {
    marginTop: 8,
  },
  userName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  siteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  siteCardSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  siteHeaderSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskRatio: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
    marginLeft: 4,
    marginRight: 8,
  },
  miniBarContainer: {
    height: 10,
    width: 50,
    marginLeft: 8,
    justifyContent: 'center',
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
    fontSize: 13,
    color: '#374151',
    marginLeft: 6,
    fontWeight: 'bold',
    minWidth: 28,
    textAlign: 'right',
  },
  siteStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    width: '100%',
  },
  siteStatsSmall: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F97316',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  siteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});