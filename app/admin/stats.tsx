import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Users, ClipboardCheck, Clock, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { AuthService } from '../../services/AuthService';
import TaskService from '../../services/TaskService';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { shadows } from '../../utils/shadowUtils';

// Define Task type with status property
type Task = {
  status: string;
  dueDate?: string;
  // add other properties if needed
};

// Define User type
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  company?: string;
  sites?: string[];
  siteId?: string;
  funcao?: string;
};

// Define Site type
type Site = {
  id: string;
  name: string;
  // add other properties if needed
};

interface Stats {
  totalWorkers: number;
  activeWorkers: number;
  totalAdmins: number;
  activeAdmins: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats>({
    totalWorkers: 0,
    activeWorkers: 0,
    totalAdmins: 0,
    activeAdmins: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState<string | null>(null);
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 600;
  // Animação de entrada
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    AuthService.getCurrentSite().then((site: Site | null) => {
      setSiteId(site?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    // Buscar tarefas
    const unsubscribeTasks = TaskService.subscribeToTasksBySite(siteId, (tasks: Task[]) => {
      const completedTasks = tasks.filter((task: Task) => task.status === 'completed');
      const pendingTasks = tasks.filter((task: Task) => task.status === 'pending');
      const inProgressTasks = tasks.filter((task: Task) => task.status === 'in_progress');
      const now = new Date();
      const overdueTasks = tasks.filter((task: Task) => {
        if (!task.dueDate) return false;
        // Considere apenas tarefas com status 'delayed'
        if (task.status !== 'delayed') return false;
        const due = new Date(task.dueDate);
        return due < now;
      });
      setStats(prev => ({
        ...prev,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks: overdueTasks.length,
      }));
      setLoading(false);
    });
    // Buscar colaboradores (workers)
    AuthService.getWorkersBySite(siteId).then((workers: User[]) => {
      setStats(prev => ({
        ...prev,
        totalWorkers: workers.length,
        activeWorkers: workers.filter((w: User) => w.status === 'active').length,
      }));
    });
    // Buscar administradores (admins)
    AuthService.getAdminsBySite(siteId).then((admins: User[]) => {
      setStats(prev => ({
        ...prev,
        totalAdmins: admins.length,
        activeAdmins: admins.filter((a: User) => a.status === 'active').length,
      }));
    });
    return () => {
      unsubscribeTasks && unsubscribeTasks();
    };
  }, [siteId]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<User[]>([]);

  // Função para abrir modal de colaboradores
  const openWorkersModal = async () => {
    setModalTitle('Colaboradores da Obra');
    const site = await AuthService.getCurrentSite();
    if (site) {
      const workers = await AuthService.getWorkersBySite(site.id);
      setModalUsers(workers);
      setModalVisible(true);
    } else {
      setModalUsers([]);
      setModalVisible(true);
    }
  };
  // Função para abrir modal de administradores
  const openAdminsModal = async () => {
    setModalTitle('Administradores da Obra');
    const site = await AuthService.getCurrentSite();
    if (site) {
      const admins = await AuthService.getAdminsBySite(site.id);
      setModalUsers(admins);
      setModalVisible(true);
    }
  };

  // Função para navegação rápida ao clicar no card
  const handleCardPress = (status: string) => {
    router.push({ pathname: '/(tabs)', params: { filter: status } });
  };

  // Cores dinâmicas por status
  const statusColors = {
    total: isDarkMode ? '#2563EB' : '#2563EB',
    completed: isDarkMode ? '#22C55E' : '#16A34A',
    inProgress: isDarkMode ? '#F59E42' : '#F59E42',
    pending: isDarkMode ? '#3B82F6' : '#2563EB',
    overdue: isDarkMode ? '#EF4444' : '#DC2626',
  };

  const StatCard = ({ icon: Icon, value, title, color, onPress }: { icon: any; value: number; title: string; color: string; onPress?: () => void }) => (
    <Animated.View style={[styles.statCard, { backgroundColor: isDarkMode ? '#23272F' : '#fff', borderColor: color, opacity: fadeAnim }]}
      accessible accessibilityLabel={`${title}: ${value}`}
    >
      <TouchableOpacity style={{ alignItems: 'center' }} onPress={onPress} activeOpacity={0.8}>
        <Icon size={36} color={color} style={{ marginBottom: 4 }} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={[styles.statTitle, { color }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Estatísticas da Obra</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Colaboradores</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon={Users}
                value={stats.totalWorkers}
                title="Total"
                color={colors.primary}
                onPress={openWorkersModal}
              />
              <StatCard
                icon={Users}
                value={stats.activeWorkers}
                title="Ativos"
                color={colors.success}
                onPress={openWorkersModal}
              />
            </View>
            <Text style={styles.sectionTitle}>Administradores</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon={Users}
                value={stats.totalAdmins}
                title="Total"
                color={colors.primary}
                onPress={openAdminsModal}
              />
              <StatCard
                icon={Users}
                value={stats.activeAdmins}
                title="Ativos"
                color={colors.success}
                onPress={openAdminsModal}
              />
            </View>
            <Text style={styles.sectionTitle}>Tarefas</Text>
            <View style={[styles.statsGrid, isSmallScreen && { flexDirection: 'column', alignItems: 'center' }]}>
              <StatCard
                icon={ClipboardCheck}
                value={stats.totalTasks}
                title="Total"
                color={statusColors.total}
                onPress={() => handleCardPress('all')}
              />
              <StatCard
                icon={ClipboardCheck}
                value={stats.completedTasks}
                title="Concluídas"
                color={statusColors.completed}
                onPress={() => handleCardPress('completed')}
              />
              <StatCard
                icon={Clock}
                value={stats.inProgressTasks}
                title="Em Andamento"
                color={statusColors.inProgress}
                onPress={() => handleCardPress('in_progress')}
              />
              <StatCard
                icon={AlertCircle}
                value={stats.pendingTasks}
                title="Pendentes"
                color={statusColors.pending}
                onPress={() => handleCardPress('pending')}
              />
              <StatCard
                icon={AlertTriangle}
                value={stats.overdueTasks}
                title="Atrasadas"
                color={statusColors.overdue}
                onPress={() => handleCardPress('overdue')}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal de lista de usuários */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 320, maxWidth: 400, maxHeight: '80%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>{modalTitle}</Text>
            {modalUsers.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center' }}>Nenhum usuário encontrado.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 350 }}>
                {modalUsers.map((user, idx) => (
                  <View key={user.id || idx} style={{ borderBottomWidth: idx < modalUsers.length - 1 ? 1 : 0, borderBottomColor: '#eee', paddingVertical: 10 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{user.name}</Text>
                    <Text style={{ color: '#666', fontSize: 14 }}>{user.role === 'admin' ? 'Administrador' : 'Colaborador'}{user.funcao ? ` - ${user.funcao}` : ''}</Text>
                    {Boolean(user.company) && <Text style={{ color: '#888', fontSize: 13 }}>Empresa: {user.company}</Text>}
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={{ marginTop: 18, alignSelf: 'center' }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 16 }}>Fechar</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    flex: 1,
    minWidth: 180,
    maxWidth: 260,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      default: {
        elevation: 3,
      },
    }),
    borderWidth: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 16,
    color: '#444',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
});