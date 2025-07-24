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

export default function AdminScreen() {
  const { colors } = useTheme();
  const router = useRouter();
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
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [sitesModalVisible, setSitesModalVisible] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [completedTasksModalVisible, setCompletedTasksModalVisible] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loadingCompletedTasks, setLoadingCompletedTasks] = useState(false);
  const [allTasksModalVisible, setAllTasksModalVisible] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loadingAllTasks, setLoadingAllTasks] = useState(false);
  const { currentSite, setCurrentSite } = useSite();


  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);

      if (!currentUser || currentUser.role !== 'admin') {
        router.replace('/(tabs)');
        setLoading(false);
        return;
      }
      loadAdminStats();
      updateTotalWorkers();
    };

    checkUserAndLoadData();
  }, [currentSite]);

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

  const updateTotalWorkers = async () => {
    if (!currentSite) {
      setTotalWorkers(0);
      return;
    }
    try {
      const siteWorkers = await AuthService.getWorkersBySite(currentSite.id);
      const siteAdmins = await AuthService.getAdminsBySite(currentSite.id);
      let workers = siteWorkers.concat(siteAdmins);
      // Remover duplicados
      const uniqueWorkers = Array.from(new Map(workers.map((w: User) => [w.id, w])).values());
      const activeWorkers = uniqueWorkers.filter((w: User) => w.status === 'active');
      setTotalWorkers(activeWorkers.length);
    } catch {
      setTotalWorkers(0);
    }
  };

  const openWorkersModal = async () => {
    setLoadingWorkers(true);
    setWorkersModalVisible(true);
    try {
        if (!currentSite) {
            throw new Error("Nenhuma obra selecionada");
        }
        const siteWorkers = await AuthService.getWorkersBySite(currentSite.id);
        const siteAdmins = await AuthService.getAdminsBySite(currentSite.id);
        let workers = siteWorkers.concat(siteAdmins);
        // Remover duplicados
        let uniqueWorkers = Array.from(new Map(workers.map((w: User) => [w.id, w])).values());
        let activeWorkers = uniqueWorkers.filter((w: User) => w.status === 'active');
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser && currentUser.role === 'admin' && currentUser.status === 'active') {
          // Remove se já existe
          activeWorkers = activeWorkers.filter((w: User) => w.id !== currentUser.id);
          // Adiciona no topo
          activeWorkers = [currentUser, ...activeWorkers];
        }
        setWorkers(activeWorkers);
    } catch (e) {
        setWorkers([]);
        Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível carregar os colaboradores.');
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

  const openCompletedTasksModal = async () => {
    setLoadingCompletedTasks(true);
    setCompletedTasksModalVisible(true);
    try {
      const allTasks = await TaskService.getTasks();
      const completed = allTasks.filter((task: Task) => task.status === 'completed');
      setCompletedTasks(completed);
    } catch (e) {
      setCompletedTasks([]);
      Alert.alert('Erro', 'Não foi possível carregar as tarefas concluídas.');
    } finally {
      setLoadingCompletedTasks(false);
    }
  };

  const openAllTasksModal = async () => {
    setLoadingAllTasks(true);
    setAllTasksModalVisible(true);
    try {
      const tasks = await TaskService.getTasks();
      setAllTasks(tasks);
    } catch (e) {
      setAllTasks([]);
      Alert.alert('Erro', 'Não foi possível carregar as tarefas.');
    } finally {
      setLoadingAllTasks(false);
    }
  };

  const getTaskStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={20} color={colors.warning} />,
          color: colors.warning,
          label: 'Pendente',
          bgColor: colors.warning + '15'
        };
      case 'in_progress':
        return {
          icon: <Play size={20} color={colors.accent} />,
          color: colors.accent,
          label: 'Em andamento',
          bgColor: colors.accent + '15'
        };
      case 'completed':
        return {
          icon: <CheckCircle size={20} color={colors.success} />,
          color: colors.success,
          label: 'Concluída',
          bgColor: colors.success + '15'
        };
      case 'delayed':
        return {
          icon: <AlertTriangle size={20} color={colors.error} />,
          color: colors.error,
          label: 'Atrasada',
          bgColor: colors.error + '15'
        };
      default:
        return {
          icon: <Clock size={20} color={colors.textMuted} />,
          color: colors.textMuted,
          label: 'Indefinido',
          bgColor: colors.textMuted + '15'
        };
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho agora dentro do ScrollView */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity style={styles.refreshButton} onPress={loadAdminStats}>
              <RefreshCw size={24} color={colors.primary} />
            </TouchableOpacity>
            <TabBarToggleButton size={20} />
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
              boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            }}>
              <Building2 size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 15 }}>
                {currentSite.name}
                {stats.totalTasks > 0 && ` (${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%)`}
              </Text>
            </View>
          )}
          <Text style={styles.subtitle}>Gerencie suas obras e colaboradores</Text>
        </View>
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
            icon={<Image source={logo} resizeMode="contain" style={{ width: 32, height: 32 }} />}
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
                    <Text style={{ fontSize: 16, color: colors.text }}>
                      {item.name}
                      {item.company ? ` (${item.company})` : ''}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      Função: {item.funcao ? item.funcao : (item.role === 'admin' ? 'Administrador' : 'Não informada')}
                    </Text>
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
                  <TouchableOpacity
                    style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}
                    onPress={async () => {
                      await AuthService.setCurrentSite(item);
                      setCurrentSite({ ...item, company: '' });
                      setSitesModalVisible(false);
                      loadAdminStats();
                    }}
                  >
                    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{item.name}</Text>
                    <Text style={{ color: '#374151', fontSize: 14 }}>{item.address}</Text>
                  </TouchableOpacity>
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

      {/* Modal de Tarefas Concluídas */}
      <Modal
        visible={completedTasksModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompletedTasksModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', maxHeight: '80%', backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Tarefas Concluídas</Text>
              <TouchableOpacity onPress={() => setCompletedTasksModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {loadingCompletedTasks ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Loader size={32} color={colors.primary} />
                <Text style={{ color: colors.text, marginTop: 10 }}>Carregando tarefas...</Text>
              </View>
            ) : completedTasks.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <CheckCircle size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 10 }}>Nenhuma tarefa concluída encontrada.</Text>
              </View>
            ) : (
              <FlatList
                data={completedTasks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={{ 
                    backgroundColor: colors.background, 
                    borderRadius: 12, 
                    padding: 16, 
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.success
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <CheckCircle size={20} color={colors.success} style={{ marginRight: 8 }} />
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text, flex: 1 }}>
                        {item.title}
                      </Text>
                    </View>
                    {item.description && (
                      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>
                        {item.description}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.area && (
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          Área: {item.area}
                        </Text>
                      )}
                      {item.completedAt && (
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          Concluída em: {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para Todas as Tarefas */}
      <Modal
        visible={allTasksModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAllTasksModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: 20, 
            borderBottomWidth: 1, 
            borderBottomColor: colors.border 
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
              Todas as Tarefas
            </Text>
            <TouchableOpacity onPress={() => setAllTasksModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, padding: 20 }}>
            {loadingAllTasks ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Loader size={32} color={colors.primary} className="animate-spin" />
                <Text style={{ marginTop: 16, color: colors.textSecondary }}>
                  Carregando tarefas...
                </Text>
              </View>
            ) : allTasks.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <FileText size={48} color={colors.textMuted} />
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: colors.text, 
                  marginTop: 16, 
                  marginBottom: 8 
                }}>
                  Nenhuma tarefa encontrada
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  Não há tarefas criadas ainda.
                </Text>
              </View>
            ) : (
              <FlatList
                data={allTasks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const statusInfo = getTaskStatusInfo(item.status);
                  return (
                    <View style={{ 
                      backgroundColor: colors.background, 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: statusInfo.color,
                      ...(item.status === 'delayed' && {
                        backgroundColor: colors.error + '10',
                        borderColor: colors.error,
                        borderWidth: 1
                      })
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        {statusInfo.icon}
                        <Text style={{ 
                          fontWeight: 'bold', 
                          fontSize: 16, 
                          color: item.status === 'delayed' ? colors.error : colors.text, 
                          flex: 1, 
                          marginLeft: 8 
                        }}>
                          {item.title}
                        </Text>
                        <View style={{
                          backgroundColor: statusInfo.bgColor,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: statusInfo.color + '30'
                        }}>
                          <Text style={{ 
                            color: statusInfo.color, 
                            fontSize: 12, 
                            fontWeight: '600' 
                          }}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>
                      {item.description && (
                        <Text style={{ 
                          color: item.status === 'delayed' ? colors.error : colors.textSecondary, 
                          fontSize: 14, 
                          marginBottom: 8 
                        }}>
                          {item.description}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        {item.area && (
                          <Text style={{ 
                            color: item.status === 'delayed' ? colors.error : colors.textMuted, 
                            fontSize: 12 
                          }}>
                            Área: {item.area}
                          </Text>
                        )}
                        {item.dueDate && (
                          <Text style={{ 
                            color: item.status === 'delayed' ? colors.error : colors.textMuted, 
                            fontSize: 12 
                          }}>
                            Prazo: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                          </Text>
                        )}
                      </View>
                      {item.status === 'delayed' && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          marginTop: 8, 
                          padding: 8, 
                          backgroundColor: colors.error + '15', 
                          borderRadius: 8 
                        }}>
                          <AlertTriangle size={16} color={colors.error} />
                          <Text style={{ 
                            color: colors.error, 
                            fontSize: 12, 
                            fontWeight: '600', 
                            marginLeft: 4 
                          }}>
                            Esta tarefa está atrasada
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                }}
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
              />
            )}
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    // Voltar a usar as cores do tema
    // backgroundColor: '#FFFFFF',
    // borderBottomColor: '#E0E0E0',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // elevation: 3,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    color: '#F97316', // Laranja destaque
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
