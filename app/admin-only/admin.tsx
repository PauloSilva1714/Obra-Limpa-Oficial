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
  Dimensions,
} from 'react-native';
import { router, useRouter } from 'expo-router';
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
  X,
  CheckCircle,
  Clock,
  Play,
  AlertTriangle,
} from 'lucide-react-native';
import { AuthService, User, Site } from '../../services/AuthService';
import { AdminService } from '../../services/AdminService';
import { TaskService, Task } from '../../services/TaskService';
import { useTheme } from '../../contexts/ThemeContext';
import { useSite } from '../../contexts/SiteContext';
import { t } from '../../config/i18n';
import logo from '../(auth)/obra-limpa-logo.png';
import TabBarToggleButton from '../../components/TabBarToggleButton';

interface AdminStats {
  totalSites: number;
  totalWorkers: number;
  totalTasks: number;
  completedTasks: number;
}

const { width: screenWidth } = Dimensions.get('window');

function AdminTab() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    AuthService.getUserRole().then(role => {
      setIsAdmin(role === 'admin');
      if (role !== 'admin') {
        router.replace('/(tabs)');
      }
    });
  }, []);

  if (isAdmin === null) return null;

  return isAdmin ? <AdminScreen /> : null;
}

export default function AdminScreen() {
  const { colors } = useTheme();
  const { currentSite } = useSite();
  const [stats, setStats] = useState<AdminStats>({
    totalSites: 0,
    totalWorkers: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalWorkers, setTotalWorkers] = useState(0);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const userRole = await AuthService.getUserRole();
      if (userRole !== 'admin') {
        router.replace('/(tabs)');
        return;
      }
      await loadAdminStats();
      await updateTotalWorkers();
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      router.replace('/(tabs)');
    }
  };

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const sites = await AdminService.getAllSites();
      const tasks = await TaskService.getAllTasks();
      const completedTasks = tasks.filter(task => task.status === 'completed');

      setStats({
        totalSites: sites.length,
        totalWorkers: totalWorkers,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTotalWorkers = async () => {
    try {
      const allWorkers = await AuthService.getAllWorkers();
      setTotalWorkers(allWorkers.length);
      setStats(prev => ({ ...prev, totalWorkers: allWorkers.length }));
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const openWorkersModal = async () => {
    try {
      const workers = await AuthService.getAllWorkers();
      Alert.alert(
        'Colaboradores',
        `Total de colaboradores: ${workers.length}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao abrir modal de colaboradores:', error);
    }
  };

  const openSitesModal = async () => {
    try {
      const sites = await AdminService.getAllSites();
      Alert.alert(
        'Obras',
        `Total de obras: ${sites.length}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao abrir modal de obras:', error);
    }
  };

  const openCompletedTasksModal = async () => {
    try {
      const tasks = await TaskService.getAllTasks();
      const completedTasks = tasks.filter(task => task.status === 'completed');
      Alert.alert(
        'Tarefas Concluídas',
        `Total de tarefas concluídas: ${completedTasks.length}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao abrir modal de tarefas concluídas:', error);
    }
  };

  const openAllTasksModal = async () => {
    try {
      const tasks = await TaskService.getAllTasks();
      Alert.alert(
        'Tarefas',
        `Total de tarefas: ${tasks.length}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao abrir modal de tarefas:', error);
    }
  };

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
      return (
        <TouchableOpacity
          style={styles.statCardWrapper}
          onPress={onPress}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
      );
    }
    return <View style={styles.statCardWrapper}>{content}</View>;
  };

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
      activeOpacity={0.8}
    >
      <View style={[styles.cardIcon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.primary + '15' }]} onPress={loadAdminStats}>
              <RefreshCw size={24} color={colors.primary} />
            </TouchableOpacity>
            <TabBarToggleButton size={20} variant="glass" />
          </View>
          <Text style={styles.title}>Painel Administrativo</Text>
          {currentSite?.name && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 2,
              marginLeft: 8,
              paddingHorizontal: 14,
              paddingVertical: 4,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary,
            }}>
              <Building2 size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 15 }}>
                {currentSite.name}
                {Boolean(stats.totalTasks > 0) && ` (${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%)`}
              </Text>
            </View>
          )}
          <Text style={styles.subtitle}>Gerencie suas obras e colaboradores</Text>
        </View>

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
              value={totalWorkers}
              icon={<Users size={20} color={colors.success} />}
              color={colors.success}
              onPress={openWorkersModal}
            />
            <StatCard
              title="Tarefas"
              value={stats.totalTasks}
              icon={<FileText size={20} color={colors.accent} />}
              color={colors.accent}
              onPress={openAllTasksModal}
            />
            <StatCard
              title="Concluídas"
              value={stats.completedTasks}
              icon={<BarChart3 size={20} color={colors.warning} />}
              color={colors.warning}
              onPress={openCompletedTasksModal}
            />
          </View>
        </View>

        {/* Gerenciamento de Obras */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gerenciamento de Obras</Text>
          <AdminCard
            title="Gerenciar Obras"
            subtitle="Criar, editar e visualizar obras"
            icon={<Building2 size={24} color={colors.primary} />}
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
            subtitle="Visualizar e gerenciar colaboradores"
            icon={<Users size={24} color={colors.primary} />}
            onPress={() => router.push('/admin/workers')}
            color={colors.primary}
          />
          <AdminCard
            title="Convidar Colaborador"
            subtitle="Adicionar novo colaborador ao sistema"
            icon={<UserPlus size={24} color={colors.success} />}
            onPress={() => router.push('/admin/workers/invite')}
            color={colors.success}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    color: '#F97316',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  statsSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
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
    gap: screenWidth < 400 ? 8 : 12,
  },
  statCardWrapper: {
    width: screenWidth < 400 ? '48%' : '48%',
    minWidth: screenWidth < 400 ? 120 : 140,
  },
  statCard: {
    borderRadius: 12,
    padding: screenWidth < 400 ? 12 : 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: screenWidth < 400 ? 70 : 80,
  },
  statIcon: {
    width: screenWidth < 400 ? 36 : 40,
    height: screenWidth < 400 ? 36 : 40,
    borderRadius: screenWidth < 400 ? 18 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth < 400 ? 8 : 12,
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: screenWidth < 400 ? 20 : 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: screenWidth < 400 ? 10 : 12,
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
