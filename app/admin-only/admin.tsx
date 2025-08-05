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
  const router = useRouter();
  const { colors } = useTheme();
  const { currentSite, updateCurrentSite } = useSite();
  const [stats, setStats] = useState<AdminStats>({
    totalSites: 0,
    totalWorkers: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalWorkers, setTotalWorkers] = useState(0);

  // Estados para o modal detalhado
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [modalType, setModalType] = useState<'users' | 'sites'>('users');

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  // Recarregar dados quando a obra mudar
  useEffect(() => {
    if (currentSite) {
      loadAdminStats();
      updateTotalWorkers();
    }
  }, [currentSite?.id]);

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
      const sites = await AuthService.getUserSites();

      // Buscar tarefas da obra atual
      const currentSite = await AuthService.getCurrentSite();
      let tasks = [];
      let completedTasks = [];

      if (currentSite) {
        // Buscar tarefas da obra atual
        tasks = await TaskService.getTasksBySite(currentSite.id);
        completedTasks = tasks.filter(task => task.status === 'completed');
        console.log('[loadAdminStats] Tarefas da obra atual:', {
          obra: currentSite.name,
          totalTarefas: tasks.length,
          tarefasConcluidas: completedTasks.length
        });
      } else {
        // Se não há obra selecionada, buscar todas as tarefas
        tasks = await TaskService.getAllTasks();
        completedTasks = tasks.filter(task => task.status === 'completed');
        console.log('[loadAdminStats] Nenhuma obra selecionada. Buscando todas as tarefas:', {
          totalTarefas: tasks.length,
          tarefasConcluidas: completedTasks.length
        });
      }

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
      const allUsers = await AuthService.getAllUsersFromCurrentSite();
      setTotalWorkers(allUsers.length);
      setStats(prev => ({ ...prev, totalWorkers: allUsers.length }));
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

    const openWorkersModal = async () => {
    try {
      setModalTitle('Colaboradores');
      setModalType('users');
      const allUsers = await AuthService.getAllUsersFromCurrentSite();
      const currentUser = await AuthService.getCurrentUser();

      // Adicionar marcação especial para o usuário logado
      const usersWithHighlight = allUsers.map(user => ({
        ...user,
        funcao: user.id === currentUser?.id ? `${user.funcao || user.role} 🟢` : user.funcao || user.role
      }));

      setModalUsers(usersWithHighlight);
      setModalVisible(true);
    } catch (error) {
      console.error('Erro ao abrir modal de colaboradores:', error);
    }
  };

  const openSitesModal = async () => {
    try {
      setModalTitle('Selecionar Obra');
      setModalType('sites');
      const sites = await AuthService.getUserSites();
      setModalUsers(sites.map(site => ({
        id: site.id,
        name: site.name,
        email: site.address,
        role: 'site',
        funcao: currentSite?.id === site.id ? 'Obra Atual' : '',
        company: site.address
      })));
      setModalVisible(true);
    } catch (error) {
      console.error('Erro ao abrir modal de obras:', error);
    }
  };

  const handleSiteSelection = async (siteId: string) => {
    try {
      const sites = await AuthService.getUserSites();
      const selectedSite = sites.find(site => site.id === siteId);
      if (selectedSite) {
        await AuthService.setCurrentSite(selectedSite);
        // Atualizar o contexto imediatamente
        updateCurrentSite({ ...selectedSite, company: '' });
        setModalVisible(false);
        // Recarregar dados após mudança de obra
        await loadAdminStats();
        await updateTotalWorkers();
      }
    } catch (error) {
      console.error('Erro ao selecionar obra:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // Laranja
      case 'in_progress':
        return '#3B82F6'; // Azul
      case 'completed':
        return '#10B981'; // Verde
      case 'delayed':
        return '#EF4444'; // Vermelho
      default:
        return '#6B7280'; // Cinza
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      case 'delayed':
        return 'Atrasada';
      default:
        return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return '#EF4444'; // Vermelho para administradores
      case 'worker':
      case 'colaborador':
        return '#3B82F6'; // Azul para colaboradores
      case 'auxiliar':
        return '#10B981'; // Verde para auxiliares
      case 'supervisor':
        return '#F59E0B'; // Laranja para supervisores
      case 'gerente':
        return '#8B5CF6'; // Roxo para gerentes
      case 'coordenador':
        return '#06B6D4'; // Ciano para coordenadores
      default:
        return '#6B7280'; // Cinza para outros
    }
  };

  const getAllResponsiblesFromTask = async (task: any): Promise<string[]> => {
    try {
      console.log('[getAllResponsiblesFromTask] Processando tarefa:', {
        id: task.id,
        title: task.title,
        assignedTo: task.assignedTo,
        userId: task.userId,
        status: task.status
      });

      // Log completo da tarefa para debug
      console.log('[getAllResponsiblesFromTask] Tarefa completa:', JSON.stringify(task, null, 2));

      const responsibles: string[] = [];

      // Verificar se tem userId (usuário cadastrado na obra)
      if (task.userId) {
        console.log('[getAllResponsiblesFromTask] Usando userId:', task.userId);
        const user = await AuthService.getUserById(task.userId);
        if (user) {
          const responsibleText = user.company ? `${user.name} (${user.company})` : user.name;
          responsibles.push(responsibleText);
          console.log('[getAllResponsiblesFromTask] Usuário cadastrado adicionado:', responsibleText);
        } else {
          console.log('[getAllResponsiblesFromTask] Usuário não encontrado para userId:', task.userId);
        }
      }

            // Verificar se tem userId nos comentários (usuário cadastrado na obra)
      if (task.comments && Array.isArray(task.comments) && task.comments.length > 0) {
        console.log('[getAllResponsiblesFromTask] Verificando comentários para userId');

        // Pegar o primeiro comentário que tem userId
        const commentWithUserId = task.comments.find(comment => comment.userId);
        if (commentWithUserId && commentWithUserId.userId) {
          console.log('[getAllResponsiblesFromTask] Encontrado userId nos comentários:', commentWithUserId.userId);

          const user = await AuthService.getUserById(commentWithUserId.userId);
          if (user) {
            const responsibleText = user.company ? `${user.name} (${user.company})` : user.name;
            // Verificar se já não existe este usuário na lista
            const existingUser = responsibles.find(resp => resp === responsibleText);
            if (!existingUser) {
              responsibles.push(responsibleText);
              console.log('[getAllResponsiblesFromTask] Usuário dos comentários adicionado:', responsibleText);
            } else {
              console.log('[getAllResponsiblesFromTask] Usuário já existe na lista:', responsibleText);
            }
          } else if (commentWithUserId.userName) {
            // Verificar se já não existe este nome na lista
            const existingUser = responsibles.find(resp => resp === commentWithUserId.userName);
            if (!existingUser) {
              responsibles.push(commentWithUserId.userName);
              console.log('[getAllResponsiblesFromTask] Usando userName do comentário:', commentWithUserId.userName);
            } else {
              console.log('[getAllResponsiblesFromTask] Nome já existe na lista:', commentWithUserId.userName);
            }
          }
        }
      }

      // Verificar se tem assignedTo (usuário não cadastrado na obra)
      if (task.assignedTo) {
        console.log('[getAllResponsiblesFromTask] Usando assignedTo:', task.assignedTo);

        if (Array.isArray(task.assignedTo)) {
          console.log('[getAllResponsiblesFromTask] assignedTo é array com', task.assignedTo.length, 'elementos');

          // Processar todos os elementos do array
          for (let i = 0; i < task.assignedTo.length; i++) {
            const element = task.assignedTo[i];
            console.log(`[getAllResponsiblesFromTask] Processando elemento ${i}:`, element);

            if (typeof element === 'string') {
              // Se for o primeiro elemento, pode ser ID
              if (i === 0) {
                // Tentar buscar usuário pelo ID
                const user = await AuthService.getUserById(element);
                if (user) {
                  const responsibleText = user.company ? `${user.name} (${user.company})` : user.name;
                  // Verificar se já não existe este usuário na lista
                  const existingUser = responsibles.find(resp => resp === responsibleText);
                  if (!existingUser) {
                    responsibles.push(responsibleText);
                    console.log('[getAllResponsiblesFromTask] Usuário encontrado via ID:', responsibleText);
                  } else {
                    console.log('[getAllResponsiblesFromTask] Usuário já existe na lista:', responsibleText);
                  }
                } else {
                  // Se não encontrou, usar como nome
                  const existingUser = responsibles.find(resp => resp === element);
                  if (!existingUser) {
                    responsibles.push(element);
                    console.log('[getAllResponsiblesFromTask] Usando como nome:', element);
                  } else {
                    console.log('[getAllResponsiblesFromTask] Nome já existe na lista:', element);
                  }
                }
              } else {
                // Elementos subsequentes são nomes
                const existingUser = responsibles.find(resp => resp === element);
                if (!existingUser) {
                  responsibles.push(element);
                  console.log('[getAllResponsiblesFromTask] Adicionando nome:', element);
                } else {
                  console.log('[getAllResponsiblesFromTask] Nome já existe na lista:', element);
                }
              }
            }
          }
        } else if (typeof task.assignedTo === 'string') {
          const user = await AuthService.getUserById(task.assignedTo);
          if (user) {
            const responsibleText = user.company ? `${user.name} (${user.company})` : user.name;
            responsibles.push(responsibleText);
            console.log('[getAllResponsiblesFromTask] Usuário encontrado via assignedTo string:', responsibleText);
          }
        }
      }

      // Se não encontrou nenhum responsável
      if (responsibles.length === 0) {
        responsibles.push('Não atribuída');
      }

      const result = responsibles.join(', ');
      console.log('[getAllResponsiblesFromTask] Resultado final:', result);

      return responsibles;
    } catch (error) {
      console.error('[getAllResponsiblesFromTask] Erro ao buscar informações dos usuários:', error);
      return ['Erro ao buscar usuários'];
    }
  };

  const getTasksWithUserNames = async (tasks: any[]) => {
    try {
      console.log('[getTasksWithUserNames] Processando', tasks.length, 'tarefas');

      const tasksWithNames = await Promise.all(
        tasks.map(async (task, index) => {
          console.log(`[getTasksWithUserNames] Tarefa ${index + 1}:`, {
            id: task.id,
            title: task.title,
            assignedTo: task.assignedTo,
            userId: task.userId,
            status: task.status
          });

          const responsibles = await getAllResponsiblesFromTask(task);
          const responsibleText = responsibles.join(', ');

          const result = {
            id: task.id,
            name: task.title,
            email: task.description || '',
            role: 'task',
            funcao: task.status,
            company: responsibleText
          };

          console.log(`[getTasksWithUserNames] Resultado tarefa ${index + 1}:`, {
            title: result.name,
            responsible: result.company
          });

          return result;
        })
      );

      console.log('[getTasksWithUserNames] Processamento concluído');
      return tasksWithNames;
    } catch (error) {
      console.error('[getTasksWithUserNames] Erro ao buscar nomes dos usuários:', error);
      return tasks.map(task => ({
        id: task.id,
        name: task.title,
        email: task.description || '',
        role: 'task',
        funcao: task.status,
        company: task.assignedTo || 'Não atribuída'
      }));
    }
  };

    const openCompletedTasksModal = async () => {
    try {
      setModalTitle('Tarefas Concluídas');
      setModalType('users');

      // Buscar tarefas da obra atual
      const currentSite = await AuthService.getCurrentSite();
      let tasks = [];

      if (currentSite) {
        // Buscar tarefas da obra atual
        tasks = await TaskService.getTasksBySite(currentSite.id);
        console.log('[openCompletedTasksModal] Tarefas da obra atual:', {
          obra: currentSite.name,
          totalTarefas: tasks.length
        });
      } else {
        // Se não há obra selecionada, buscar todas as tarefas
        tasks = await TaskService.getAllTasks();
        console.log('[openCompletedTasksModal] Nenhuma obra selecionada. Buscando todas as tarefas:', {
          totalTarefas: tasks.length
        });
      }

      const completedTasks = tasks.filter(task => task.status === 'completed');

      if (completedTasks.length === 0) {
        // Se não há tarefas concluídas, mostrar mensagem
        setModalUsers([{
          id: 'no-tasks',
          name: 'Nenhuma tarefa encontrada',
          email: '',
          role: 'task',
          funcao: 'Nenhuma tarefa concluída',
          company: ''
        }]);
      } else {
        const tasksWithNames = await getTasksWithUserNames(completedTasks);
        setModalUsers(tasksWithNames);
      }

      setModalVisible(true);
    } catch (error) {
      console.error('Erro ao abrir modal de tarefas concluídas:', error);
    }
  };

    const openAllTasksModal = async () => {
    try {
      setModalTitle('Todas as Tarefas');
      setModalType('users');

      // Buscar tarefas da obra atual
      const currentSite = await AuthService.getCurrentSite();
      let tasks = [];

      if (currentSite) {
        // Buscar tarefas da obra atual
        tasks = await TaskService.getTasksBySite(currentSite.id);
        console.log('[openAllTasksModal] Tarefas da obra atual:', {
          obra: currentSite.name,
          totalTarefas: tasks.length
        });
      } else {
        // Se não há obra selecionada, buscar todas as tarefas
        tasks = await TaskService.getAllTasks();
        console.log('[openAllTasksModal] Nenhuma obra selecionada. Buscando todas as tarefas:', {
          totalTarefas: tasks.length
        });
      }

      if (tasks.length === 0) {
        // Se não há tarefas, mostrar mensagem
        setModalUsers([{
          id: 'no-tasks',
          name: 'Nenhuma tarefa encontrada',
          email: '',
          role: 'task',
          funcao: 'Nenhuma tarefa cadastrada',
          company: ''
        }]);
      } else {
        const tasksWithNames = await getTasksWithUserNames(tasks);
        setModalUsers(tasksWithNames);
      }

      setModalVisible(true);
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

            {/* Modal de lista de colaboradores/obras */}
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
              <Text style={{ color: '#888', textAlign: 'center' }}>
                {modalType === 'sites' ? 'Nenhuma obra encontrada.' : 'Nenhum colaborador encontrado.'}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 350 }}>
                {modalUsers.map((user, idx) => (
                  <TouchableOpacity
                    key={user.id || idx}
                    style={{
                      borderBottomWidth: idx < modalUsers.length - 1 ? 1 : 0,
                      borderBottomColor: '#eee',
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderRadius: 8,
                      backgroundColor: user.funcao === 'Obra Atual' ? '#E3F2FD' : 'transparent',
                      borderWidth: user.funcao === 'Obra Atual' ? 2 : 0,
                      borderColor: user.funcao === 'Obra Atual' ? '#2196F3' : 'transparent',
                    }}
                    onPress={() => {
                      if (modalType === 'sites') {
                        handleSiteSelection(user.id);
                      }
                    }}
                    disabled={modalType === 'users'}
                    activeOpacity={modalType === 'sites' ? 0.7 : 1}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontWeight: 'bold',
                          fontSize: 16,
                          color: user.funcao === 'Obra Atual' ? '#2196F3' : '#000'
                        }}>
                          {user.name}
                        </Text>
                        {modalType === 'users' ? (
                          user.role === 'task' ? (
                            <>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <View style={{
                                  backgroundColor: getStatusColor(user.funcao),
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderRadius: 12,
                                  marginRight: 8
                                }}>
                                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                    {getStatusText(user.funcao)}
                                  </Text>
                                </View>
                              </View>
                              {Boolean(user.email) && (
                                <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                                  {user.email.length > 50 ? user.email.substring(0, 50) + '...' : user.email}
                                </Text>
                              )}
                              {Boolean(user.company) && (
                                <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                                  Responsável: {user.company}
                                </Text>
                              )}
                            </>
                          ) : (
                            <>
                              <Text style={{
                                color: getRoleColor(user.role),
                                fontSize: 14,
                                fontWeight: 'bold'
                              }}>
                                {user.role === 'admin' ? 'Administrador' : 'Colaborador'}{user.funcao ? ` - ${user.funcao}` : ''}
                              </Text>
                              {Boolean(user.company) && <Text style={{ color: '#888', fontSize: 13 }}>Empresa: {user.company}</Text>}
                            </>
                          )
                        ) : (
                          <>
                            <Text style={{ color: '#666', fontSize: 14 }}>
                              {user.funcao === 'Obra Atual' ? '⭐ Obra Atual' : 'Clique para selecionar'}
                            </Text>
                            <Text style={{ color: '#888', fontSize: 13 }}>Endereço: {user.email}</Text>
                          </>
                        )}
                      </View>
                      {modalType === 'sites' && (
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: user.funcao === 'Obra Atual' ? '#2196F3' : '#E0E0E0',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {user.funcao === 'Obra Atual' && (
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
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
