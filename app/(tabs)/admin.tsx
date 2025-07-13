import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  Building2,
  Users,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  FileText,
  Shield,
  Loader,
  RefreshCw,
  MessageCircle,
} from 'lucide-react-native';
import { AuthService, User, Site } from '@/services/AuthService';
import { AdminService } from '@/services/AdminService';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/config/i18n';
import logo from '../(auth)/obra-limpa-logo.png';

interface AdminStats {
  totalSites: number;
  totalWorkers: number;
  totalTasks: number;
  completedTasks: number;
}

export default function AdminScreen() {
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalSites: 0,
    totalWorkers: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workersModalVisible, setWorkersModalVisible] = useState(false);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [sitesModalVisible, setSitesModalVisible] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);

      if (!currentUser || currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }
      
      loadAdminStats();
    };

    checkUserAndLoadData();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const adminStats = await AdminService.getAdminStats();
      setStats(adminStats);
    } catch (err) {
      setError('Falha ao carregar as estatísticas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const openWorkersModal = async () => {
    setLoadingWorkers(true);
    setWorkersModalVisible(true);
    try {
      const allWorkers = await AuthService.getInstance().getWorkers();
      setWorkers(allWorkers.filter(w => w.status === 'active'));
    } catch (e) {
      setWorkers([]);
      Alert.alert('Erro', 'Não foi possível carregar os colaboradores.');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const openSitesModal = async () => {
    setLoadingSites(true);
    setSitesModalVisible(true);
    try {
      const userSites = await AuthService.getUserSites();
      setSites(userSites);
    } catch (e) {
      setSites([]);
      Alert.alert('Erro', 'Não foi possível carregar as obras.');
    } finally {
      setLoadingSites(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Loader size={48} color={colors.primary} className="animate-spin" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Shield size={48} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Acesso Negado</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Você não tem permissão para acessar esta página.
        </Text>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.primaryButtonText}>Voltar para o Início</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const AdminCard = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    color = colors.primary 
  }: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity 
      style={[styles.adminCard, { backgroundColor: colors.surface, borderColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={[styles.cardIcon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = colors.primary, 
    onPress 
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color?: string;
    onPress?: () => void;
  }) => {
    const content = (
      <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.statIcon, { backgroundColor: color + '15' }]}> 
          {icon}
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
      </View>
    );
    if (onPress) {
      return <View style={{ width: '48%' }}><TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity></View>;
    }
    return <View style={{ width: '48%' }}>{content}</View>;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Painel Administrativo</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Gerencie suas obras e colaboradores
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.primary + '20' }]}
          onPress={loadAdminStats}
          disabled={loading}
        >
          <RefreshCw size={20} color={colors.primary} style={loading ? { opacity: 0.5 } : undefined} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estatísticas */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Visão Geral</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Obras"
              value={stats.totalSites}
              icon={<Building2 size={20} color={colors.primary} />}
              color={colors.primary}
              onPress={openSitesModal}
            />
            <StatCard
              title="Colaboradores"
              value={stats.totalWorkers}
              icon={<Users size={20} color={colors.success} />}
              color={colors.success}
              onPress={openWorkersModal}
            />
            <StatCard
              title="Tarefas"
              value={stats.totalTasks}
              icon={<FileText size={20} color={colors.accent} />}
              color={colors.accent}
              onPress={() => Alert.alert('Tarefas', 'Você clicou no card de Tarefas!')}
            />
            <StatCard
              title="Concluídas"
              value={stats.completedTasks}
              icon={<BarChart3 size={20} color={colors.warning} />}
              color={colors.warning}
              onPress={() => Alert.alert('Concluídas', 'Você clicou no card de Concluídas!')}
            />
          </View>
        </View>

        {/* Gerenciamento de Obras */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gerenciamento de Obras</Text>
          <AdminCard
            title="Gerenciar Obras"
            subtitle="Criar, editar e visualizar obras"
            icon={<Image source={logo} style={{ width: 32, height: 32, resizeMode: 'contain' }} />}
            onPress={() => router.push('/admin/sites')}
            color={colors.primary}
          />
          <AdminCard
            title="Criar Nova Obra"
            subtitle="Adicionar uma nova obra ao sistema"
            icon={<Plus size={24} color={colors.success} />}
            onPress={() => router.push('/admin/sites/create')}
            color={colors.success}
          />
        </View>

        {/* Gerenciamento de Colaboradores */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gerenciamento de Colaboradores</Text>
          <AdminCard
            title="Gerenciar Colaboradores"
            subtitle="Visualizar e editar equipe"
            icon={<Users size={24} color={colors.accent} />}
            onPress={() => router.push('/admin/workers')}
            color={colors.accent}
          />
          <AdminCard
            title="Convidar Colaborador"
            subtitle="Enviar convite para novo membro"
            icon={<UserPlus size={24} color={colors.warning} />}
            onPress={() => router.push('/admin/workers/invite')}
            color={colors.warning}
          />
          <AdminCard
            title="Chat"
            subtitle="Converse com outros administradores"
            icon={<MessageCircle size={24} color={colors.primary} />}
            onPress={() => router.push('/admin/chat')}
            color={colors.primary}
          />
        </View>

        {/* Configurações */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Configurações</Text>
          <AdminCard
            title="Configurações do Sistema"
            subtitle="Gerenciar configurações gerais"
            icon={<Settings size={24} color={colors.secondary} />}
            onPress={() => router.push('/admin/settings')}
            color={colors.secondary}
          />
        </View>
      </ScrollView>

      {/* Modal de Colaboradores */}
      <Modal
        visible={workersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWorkersModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', maxHeight: '80%', backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Colaboradores Ativos</Text>
            {loadingWorkers ? (
              <Text style={{ color: colors.text }}>Carregando...</Text>
            ) : workers.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Nenhum colaborador ativo encontrado.</Text>
            ) : (
              <FlatList
                data={workers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ fontSize: 16, color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>Função: {item.funcao || 'Não informada'}</Text>
                  </View>
                )}
                style={{ maxHeight: 350 }}
              />
            )}
            <TouchableOpacity onPress={() => setWorkersModalVisible(false)} style={{ marginTop: 20, alignSelf: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Obras */}
      <Modal
        visible={sitesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSitesModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', maxHeight: '80%', backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Obras</Text>
            {loadingSites ? (
              <Text style={{ color: colors.text }}>Carregando...</Text>
            ) : sites.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Nenhuma obra encontrada.</Text>
            ) : (
              <FlatList
                data={sites}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={{
                    backgroundColor: '#F3F4F6',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 2,
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#222' }}>{item.name}</Text>
                    <Text style={{ fontSize: 14, color: '#444', marginTop: 2 }}>{item.address || 'Endereço não informado'}</Text>
                  </View>
                )}
                style={{ maxHeight: 350 }}
              />
            )}
            <TouchableOpacity onPress={() => setSitesModalVisible(false)} style={{ marginTop: 20, alignSelf: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  refreshButton: {
    borderRadius: 20,
    padding: 8,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  statsSection: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  adminCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  primaryButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
