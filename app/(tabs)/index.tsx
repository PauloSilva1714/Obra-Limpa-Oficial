import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Clock,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  User,
  Calendar,
  Trash2,
  X,
  MessageCircle,
  Send,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import taskService, { Task, Comment, TaskService } from '@/services/TaskService';
import { AuthService } from '@/services/AuthService';
import { EmailService } from '@/services/EmailService';
import { TaskModal } from '@/components/TaskModal';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/config/i18n';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { TaskQuickView } from '@/components/TaskQuickView';

export default function TasksScreen() {
  console.log('[DEBUG] TasksScreen - Componente montado');
  
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'worker' | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [detailsMode, setDetailsMode] = useState(false);
  
  // Estados para comentários
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados para pesquisa
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estados para modal de foto
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedTaskForPhoto, setSelectedTaskForPhoto] = useState<Task | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Estados para TaskQuickView e Theater Mode
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [theaterVisible, setTheaterVisible] = useState(false);
  const [quickViewTask, setQuickViewTask] = useState<Task | null>(null);

  console.log('[DEBUG] TasksScreen - Estados iniciais:', { 
    loading, 
    refreshing, 
    isInitialized, 
    tasksLength: tasks.length,
    filteredTasksLength: filteredTasks.length 
  });

  useEffect(() => {
    console.log('[DEBUG] useEffect de inicialização executado - isInitialized:', isInitialized);
    if (isInitialized) {
      console.log('[DEBUG] Tela já inicializada, pulando...');
      return;
    }

    const initializeScreen = async () => {
      try {
        console.log('[DEBUG] Iniciando inicialização da tela...');
        console.log('[DEBUG] Estado atual - loading:', loading, 'refreshing:', refreshing);
        
        await loadTasks();
        console.log('[DEBUG] Tarefas carregadas na inicialização');
        
        setIsInitialized(true);
        console.log('[DEBUG] Tela inicializada com sucesso');
      } catch (error) {
        console.error('[DEBUG] Erro ao inicializar tela:', error);
        Alert.alert(t('error'), 'Erro ao inicializar tela de tarefas.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        console.log('[DEBUG] Estados de loading/resfreshing finalizados');
      }
    };

    console.log('[DEBUG] Chamando initializeScreen...');
    initializeScreen();
  }, [isInitialized]);

  useEffect(() => {
    // Buscar o papel do usuário ao montar o componente
    const fetchUserRole = async () => {
      try {
        const role = await AuthService.getUserRole();
        setUserRole(role);
      } catch (error) {
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, []);

  // Carregar usuário atual
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        console.log('[DEBUG] Carregando usuário atual...');
        const user = await AuthService.getCurrentUser();
        console.log('[DEBUG] Usuário carregado:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('[DEBUG] Erro ao carregar usuário:', error);
        setCurrentUser(null);
      }
    };
    loadCurrentUser();
  }, []);

  // Atualizar tarefas filtradas quando as tarefas mudarem
  useEffect(() => {
    if (searchQuery.trim()) {
      filterTasks(searchQuery);
    } else {
      setFilteredTasks(tasks);
    }
  }, [tasks, searchQuery]);

  const loadTasks = async () => {
    try {
      console.log('[DEBUG] Iniciando carregamento de tarefas...');
      const siteTasks = await taskService.getTasks();
      console.log('[DEBUG] Tarefas carregadas:', siteTasks);
      setTasks(siteTasks);
      setFilteredTasks(siteTasks);
    } catch (error) {
      console.error('[DEBUG] Erro ao carregar tarefas:', error);
      Alert.alert(t('error'), 'Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailsMode(true);
    setModalVisible(true);
  };

  // Substituir handleTaskPress para abrir o QuickView
  const handleTaskPress = (task: Task) => {
    setQuickViewTask(task);
    setQuickViewVisible(true);
  };

  const handleCreateTask = () => {
    console.log('[DEBUG] handleCreateTask chamado');
    setSelectedTask(null);
    setModalVisible(true);
  };

  useEffect(() => {
    console.log('[DEBUG] Estado modalVisible mudou:', modalVisible);
  }, [modalVisible]);

  const handleTaskSave = async (taskData: Partial<Task>) => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        Alert.alert(t('error'), 'Usuário não encontrado.');
        return;
      }

      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, taskData);
        
        const changes = [];
        if (taskData.title && taskData.title !== selectedTask.title) {
          changes.push(`Título alterado de "${selectedTask.title}" para "${taskData.title}"`);
        }
        if (taskData.description && taskData.description !== selectedTask.description) {
          changes.push('Descrição atualizada');
        }
        if (taskData.assignedTo && taskData.assignedTo !== selectedTask.assignedTo) {
          changes.push(`Designado de "${selectedTask.assignedTo}" para "${taskData.assignedTo}"`);
        }
        if (taskData.status && taskData.status !== selectedTask.status) {
          const statusText = {
            'pending': t('pending'),
            'in_progress': t('inProgress'),
            'completed': t('completed'),
            'delayed': t('delayed'),
          }[taskData.status] || taskData.status;
          changes.push(`Status alterado para "${statusText}"`);
        }
        if (taskData.priority && taskData.priority !== selectedTask.priority) {
          const priorityText = {
            'high': t('high'),
            'medium': t('medium'),
            'low': t('low')
          }[taskData.priority] || taskData.priority;
          changes.push(`Prioridade alterada para "${priorityText}"`);
        }

        if (changes.length > 0) {
          await EmailService.sendTaskUpdateConfirmation(
            currentUser,
            {
              title: taskData.title || selectedTask.title,
              status: taskData.status || selectedTask.status,
              updatedBy: currentUser.name,
              changes
            }
          );
        }
      } else {
        const currentSite = await AuthService.getCurrentSite();
        if (!currentSite) {
          Alert.alert(t('error'), 'Nenhum canteiro selecionado.');
          return;
        }
        
        const newTask = await taskService.addTask({
          ...taskData,
          siteId: currentSite.id,
        } as Omit<Task, 'id' | 'createdAt'>);

        await EmailService.sendTaskCreationConfirmation(
          currentUser,
          {
            title: taskData.title || '',
            description: taskData.description || '',
            assignedTo: taskData.assignedTo || '',
            dueDate: taskData.dueDate,
            area: taskData.area || '',
            priority: taskData.priority || 'low'
          }
        );
      }
      
      setModalVisible(false);
      await loadTasks();
      
      Alert.alert(
        t('success'), 
        selectedTask ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!'
      );
      
    } catch (error) {
      Alert.alert(t('error'), 'Erro ao salvar tarefa.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      await loadTasks();
      Alert.alert(t('success'), 'Tarefa excluída com sucesso!');
    } catch (error) {
      Alert.alert(t('error'), 'Erro ao excluir tarefa.');
    }
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await handleDeleteTask(taskToDelete);
      setDeleteModalVisible(false);
      setTaskToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setTaskToDelete(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#10B981" />;
      case 'in_progress':
        return <Clock size={16} color="#F59E0B" />;
      case 'delayed':
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('pending');
      case 'in_progress':
        return t('inProgress');
      case 'completed':
        return t('completed');
      case 'delayed':
        return t('delayed');
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const formatUserName = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0]} ${names[1]}`;
    }
    return names[0] || fullName;
  };

  const formatCommentDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeString = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${timeString}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${timeString}`;
    } else {
      return `${date.toLocaleDateString('pt-BR')} às ${timeString}`;
    }
  };

  const handleOpenComments = (task: Task) => {
    setSelectedTaskForComments(task);
    setCommentModalVisible(true);
  };

  const handleAddComment = async () => {
    console.log('[DEBUG] handleAddComment chamado com:', { newComment, selectedTaskForComments, currentUser });
    
    if (!newComment.trim()) {
      console.error('[DEBUG] newComment vazio');
      return;
    }
    
    if (!selectedTaskForComments) {
      console.error('[DEBUG] selectedTaskForComments é null');
      Alert.alert('Erro', 'Tarefa não encontrada');
      return;
    }
    
    if (!currentUser) {
      console.error('[DEBUG] currentUser é null');
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    try {
      console.log('[DEBUG] Criando comentário...');
      const comment: Comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
      };
      
      console.log('[DEBUG] Comentário criado:', comment);
      console.log('[DEBUG] Adicionando comentário à tarefa:', selectedTaskForComments.id);

      await TaskService.addComment(selectedTaskForComments.id, comment);
      console.log('[DEBUG] Comentário adicionado com sucesso');
      
      console.log('[DEBUG] Recarregando tarefas...');
      await loadTasks();
      console.log('[DEBUG] Tarefas recarregadas');
      
      setNewComment('');
      Alert.alert('Sucesso', 'Comentário adicionado!');
    } catch (error) {
      console.error('[DEBUG] Erro ao adicionar comentário:', error);
      Alert.alert('Erro', `Erro ao adicionar comentário: ${error.message}`);
    }
  };

  // Função para filtrar tarefas
  const filterTasks = (query: string) => {
    if (!query.trim()) {
      setFilteredTasks(tasks);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    
    const filtered = tasks.filter(task => {
      const title = task.title?.toLowerCase() || '';
      const description = task.description?.toLowerCase() || '';
      const assignedTo = task.assignedTo?.toLowerCase() || '';
      const area = task.area?.toLowerCase() || '';
      
      return title.includes(lowerQuery) ||
             description.includes(lowerQuery) ||
             assignedTo.includes(lowerQuery) ||
             area.includes(lowerQuery);
    });
    
    setFilteredTasks(filtered);
  };

  // Função para limpar pesquisa
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredTasks(tasks);
    setIsSearching(false);
  };

  // Funções para modal de foto
  const handleOpenPhotoModal = (task: Task) => {
    setSelectedTaskForPhoto(task);
    setCurrentPhotoIndex(0);
    setPhotoModalVisible(true);
  };

  const handleClosePhotoModal = () => {
    setPhotoModalVisible(false);
    setSelectedTaskForPhoto(null);
    setCurrentPhotoIndex(0);
  };

  const handleNextPhoto = () => {
    if (selectedTaskForPhoto?.photos && currentPhotoIndex < selectedTaskForPhoto.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handlePreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handlePhotoPress = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  // Função para abrir o modo teatro
  const handleOpenTheater = () => {
    setTheaterVisible(true);
    setQuickViewVisible(false);
  };

  // Função para fechar o modo teatro
  const handleCloseTheater = () => {
    setTheaterVisible(false);
  };

  // Função para adicionar comentário rápido
  const handleQuickAddComment = async (text: string) => {
    console.log('[DEBUG] handleQuickAddComment chamado com:', { text, quickViewTask, currentUser });
    
    if (!quickViewTask) {
      console.error('[DEBUG] quickViewTask é null');
      Alert.alert('Erro', 'Tarefa não encontrada');
      return;
    }
    
    if (!currentUser) {
      console.error('[DEBUG] currentUser é null');
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }
    
    if (!text.trim()) {
      console.error('[DEBUG] texto vazio');
      return;
    }
    
    try {
      console.log('[DEBUG] Criando comentário...');
      const comment: Comment = {
        id: Date.now().toString(),
        text,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
      };
      
      console.log('[DEBUG] Comentário criado:', comment);
      console.log('[DEBUG] Adicionando comentário à tarefa:', quickViewTask.id);
      
      await TaskService.addComment(quickViewTask.id, comment);
      console.log('[DEBUG] Comentário adicionado com sucesso');
      
      console.log('[DEBUG] Recarregando tarefas...');
      await loadTasks();
      console.log('[DEBUG] Tarefas recarregadas');
      
      Alert.alert('Sucesso', 'Comentário adicionado!');
    } catch (error) {
      console.error('[DEBUG] Erro ao adicionar comentário:', error);
      Alert.alert('Erro', `Erro ao adicionar comentário: ${error.message}`);
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    console.log('[DEBUG] Renderizando tarefa:', { id: item.id, title: item.title, photos: item.photos?.length });
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => handleTaskPress(item)}>
        <View style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header do Card */}
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <User size={16} color={colors.primary} />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {formatUserName(item.assignedTo || '')}
                </Text>
                <Text style={[styles.taskDate, { color: colors.textMuted }]}>
                  {formatCommentDateTime(item.createdAt)}
                </Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              {getStatusIcon(item.status)}
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>

          {/* Mídia em destaque */}
          {item.photos && item.photos.length > 0 ? (
            <Image
              source={{ uri: item.photos[0] }}
              style={styles.igCardMedia}
              resizeMode="cover"
              onError={(error) => {
                console.error('[DEBUG] Erro ao carregar imagem:', error.nativeEvent.error);
                console.error('[DEBUG] URL da imagem:', item.photos[0]);
              }}
              onLoad={() => {
                console.log('[DEBUG] Imagem carregada com sucesso:', item.photos[0]);
              }}
            />
          ) : (
            <View style={[styles.igCardMedia, { justifyContent: 'center', alignItems: 'center' }]}> 
              <Text style={{ color: '#888' }}>Sem mídia</Text>
            </View>
          )}

          {/* Ícones abaixo da mídia */}
          <View style={styles.igCardActions}>
            <TouchableOpacity onPress={() => handleOpenComments(item)}>
              <MessageCircle size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTaskDetails(item)} style={{ marginLeft: 16 }}>
              <Eye size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Informações da Tarefa */}
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>

            {item.description && (
              <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                {item.description}
              </Text>
            )}

            <View style={styles.taskDetails}>
              {item.area && (
                <View style={styles.detailItem}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.area}
                  </Text>
                </View>
              )}
              
              {item.dueDate && (
                <View style={styles.detailItem}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text style={[styles.detailText, { color: colors.textMuted }]}>
                    {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority === 'high' ? t('high') : item.priority === 'medium' ? t('medium') : t('low')}
              </Text>
            </View>
          </View>

          {/* Seção de Comentários */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>
                Comentários ({item.comments?.length || 0})
              </Text>
            </View>
            
            {item.comments && item.comments.length > 0 && (
              <View style={styles.commentsPreview}>
                {item.comments.slice(0, 2).map((comment, index) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <MessageCircle size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.commentText, { color: colors.textSecondary }]} numberOfLines={1}>
                      <Text style={styles.commentUser}>{comment.userName}:</Text> {comment.text}
                    </Text>
                  </View>
                ))}
                {item.comments.length > 2 && (
                  <TouchableOpacity onPress={() => handleOpenComments(item)}>
                    <Text style={[styles.viewMoreComments, { color: colors.primary }]}>
                      Ver mais {item.comments.length - 2} comentários
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    console.log('[DEBUG] Renderizando loading...');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando tarefas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('[DEBUG] Renderizando tela principal - tasks:', tasks.length, 'filteredTasks:', filteredTasks.length);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tasks')}</Text>
        {userRole === 'admin' && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateTask}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Campo de Pesquisa */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Pesquisar tarefas..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              filterTasks(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {isSearching && (
          <Text style={[styles.searchResults, { color: colors.textSecondary }]}>
            {filteredTasks.length} resultado{filteredTasks.length !== 1 ? 's' : ''} encontrado{filteredTasks.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Feed de Tarefas */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        style={styles.feedList}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isSearching 
                ? `Nenhuma tarefa encontrada para "${searchQuery}"`
                : 'Nenhuma tarefa encontrada'
              }
            </Text>
            {!isSearching && userRole === 'admin' && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateTask}
              >
                <Text style={styles.emptyButtonText}>Criar primeira tarefa</Text>
              </TouchableOpacity>
            )}
            {isSearching && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={clearSearch}
              >
                <Text style={styles.emptyButtonText}>Limpar pesquisa</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        onLayout={() => {
          console.log('[DEBUG] FlatList layout - filteredTasks:', filteredTasks.length, 'loading:', loading, 'isSearching:', isSearching);
        }}
        onEndReached={() => {
          console.log('[DEBUG] FlatList end reached');
        }}
        onEndReachedThreshold={0.1}
      />

      {/* Task Modal */}
      console.log('[DEBUG] Renderizando TaskModal - modalVisible:', modalVisible, 'selectedTask:', selectedTask);
      <TaskModal
        visible={modalVisible}
        task={selectedTask}
        userRole={userRole}
        onClose={() => setModalVisible(false)}
        onSave={handleTaskSave}
        detailsMode={detailsMode}
      />

      {/* Comments Modal - Instagram Style */}
      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.igOverlay}>
          <View style={[styles.igBottomSheet, { backgroundColor: colors.surface }]}>  
            {/* Carrossel de mídias */}
            {(selectedTaskForComments?.photos?.length ?? 0) > 0 || (selectedTaskForComments?.videos?.length ?? 0) > 0 ? (
              <FlatList
                data={[
                  ...(selectedTaskForComments?.photos || []).map(url => ({ type: 'photo', url })),
                  ...(selectedTaskForComments?.videos || []).map(url => ({ type: 'video', url })),
                ]}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item.type}-${index}`}
                style={styles.igCarousel}
                renderItem={({ item }) => (
                  item.type === 'photo' ? (
                    <Image source={{ uri: item.url }} style={styles.igMedia} />
                  ) : (
                    Platform.OS === 'web' ? (
                      <video src={item.url} controls style={styles.igMedia} />
                    ) : (
                      <ExpoVideo source={{ uri: item.url }} style={styles.igMedia} useNativeControls resizeMode={ResizeMode.COVER} isLooping />
                    )
                  )
                )}
              />
            ) : (
              <View style={[styles.igMedia, { justifyContent: 'center', alignItems: 'center' }]}> 
                <Text style={{ color: '#888' }}>Sem mídia</Text>
              </View>
            )}
            {/* Header */}
            <View style={styles.igHeader}>
              <Text style={[styles.igTitle, { color: colors.text }]}>Comentários</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {/* Lista de comentários */}
            <FlatList
              data={selectedTaskForComments?.comments || []}
              keyExtractor={item => item.id}
              style={styles.igCommentsList}
              contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              renderItem={({ item: comment }) => {
                const isOwnComment = currentUser && comment.userId === currentUser.id;
                return (
                  <View style={[
                    styles.commentItem,
                    isOwnComment ? styles.ownComment : styles.otherComment
                  ]}>
                    <View style={[
                      styles.commentBubble,
                      isOwnComment ? styles.ownCommentBubble : styles.otherCommentBubble
                    ]}>
                      <Text style={[styles.commentText, { color: '#1F2937' }]} numberOfLines={2}>
                        {comment.text}
                      </Text>
                      <Text style={[styles.commentTime, { color: '#6B7280' }]}>
                        {formatCommentDateTime(comment.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>Nenhum comentário ainda.</Text>}
            />
            {/* Campo para adicionar comentário */}
            <View style={styles.igInputContainer}>
              <TextInput
                style={[styles.igInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Adicionar comentário..."
                placeholderTextColor={colors.textMuted}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                onSubmitEditing={() => {
                  if (newComment.trim()) handleAddComment();
                }}
                blurOnSubmit={false}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.igSendButton,
                  { backgroundColor: newComment.trim() ? colors.primary : colors.textMuted + '30' }
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
                activeOpacity={0.7}
              >
                <Send size={22} color="#FFFFFF" style={{ opacity: newComment.trim() ? 1 : 0.5 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: colors.surface }]}>
            <View style={styles.deleteModalHeader}>
              <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Confirmar Exclusão</Text>
              <TouchableOpacity onPress={cancelDelete}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.deleteModalText, { color: colors.textSecondary }]}>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={cancelDelete}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton, { backgroundColor: colors.error }]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Modal - Instagram Style */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClosePhotoModal}
      >
        <View style={styles.photoModalOverlay}>
          {/* Header do Modal */}
          <View style={styles.photoModalHeader}>
            <TouchableOpacity onPress={handleClosePhotoModal} style={styles.photoCloseButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.photoModalTitle}>
              {selectedTaskForPhoto?.title}
            </Text>
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {currentPhotoIndex + 1} / {selectedTaskForPhoto?.photos?.length || 1}
              </Text>
            </View>
          </View>

          {/* Área da Foto Principal */}
          <View style={styles.photoMainContainer}>
            {selectedTaskForPhoto?.photos && selectedTaskForPhoto.photos.length > 0 && (
              <Image
                source={{ uri: selectedTaskForPhoto.photos[currentPhotoIndex] }}
                style={styles.photoMainImage}
                resizeMode="contain"
              />
            )}
            
            {/* Navegação entre fotos */}
            {selectedTaskForPhoto?.photos && selectedTaskForPhoto.photos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.photoNavButton, styles.photoNavLeft]}
                  onPress={handlePreviousPhoto}
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoNavButton, styles.photoNavRight]}
                  onPress={handleNextPhoto}
                  disabled={currentPhotoIndex === selectedTaskForPhoto.photos.length - 1}
                >
                  <ChevronRight size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Informações da Tarefa */}
          <View style={styles.photoTaskInfo}>
            <View style={styles.photoTaskHeader}>
              <View style={styles.photoUserInfo}>
                <View style={styles.photoAvatar}>
                  <User size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.photoUserName}>
                    {formatUserName(selectedTaskForPhoto?.assignedTo || '')}
                  </Text>
                  <Text style={styles.photoTaskDate}>
                    {selectedTaskForPhoto?.createdAt ? formatCommentDateTime(selectedTaskForPhoto.createdAt) : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.photoStatusContainer}>
                {selectedTaskForPhoto && getStatusIcon(selectedTaskForPhoto.status)}
                <Text style={styles.photoStatusText}>
                  {selectedTaskForPhoto ? getStatusText(selectedTaskForPhoto.status) : ''}
                </Text>
              </View>
            </View>

            {selectedTaskForPhoto?.description && (
              <Text style={styles.photoTaskDescription} numberOfLines={3}>
                {selectedTaskForPhoto.description}
              </Text>
            )}

            <View style={styles.photoTaskDetails}>
              {selectedTaskForPhoto?.area && (
                <View style={styles.photoDetailItem}>
                  <MapPin size={14} color="#FFFFFF" />
                  <Text style={styles.photoDetailText} numberOfLines={1}>
                    {selectedTaskForPhoto.area}
                  </Text>
                </View>
              )}
              
              {selectedTaskForPhoto?.dueDate && (
                <View style={styles.photoDetailItem}>
                  <Calendar size={14} color="#FFFFFF" />
                  <Text style={styles.photoDetailText}>
                    {new Date(selectedTaskForPhoto.dueDate).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              )}
            </View>

            {selectedTaskForPhoto && (
              <View style={[styles.photoPriorityBadge, { backgroundColor: getPriorityColor(selectedTaskForPhoto.priority) + '20' }]}>
                <Text style={[styles.photoPriorityText, { color: getPriorityColor(selectedTaskForPhoto.priority) }]}>
                  {selectedTaskForPhoto.priority === 'high' ? t('high') : selectedTaskForPhoto.priority === 'medium' ? t('medium') : t('low')}
                </Text>
              </View>
            )}
          </View>

          {/* Miniaturas das Fotos */}
          {selectedTaskForPhoto?.photos && selectedTaskForPhoto.photos.length > 1 && (
            <View style={styles.photoThumbnailsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedTaskForPhoto.photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.photoThumbnail,
                      index === currentPhotoIndex && styles.photoThumbnailActive
                    ]}
                    onPress={() => handlePhotoPress(index)}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoThumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Quick View Modal */}
      <TaskQuickView
        visible={quickViewVisible}
        task={quickViewTask}
        onClose={() => setQuickViewVisible(false)}
        onOpenTheater={handleOpenTheater}
        onAddComment={handleQuickAddComment}
      />
      {/* Theater Mode Modal */}
      <TaskModal
        visible={theaterVisible}
        task={quickViewTask}
        userRole={userRole}
        onSave={handleTaskSave}
        onClose={handleCloseTheater}
        detailsMode={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedList: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  taskCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  taskDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  taskInfo: {
    padding: 16,
    paddingTop: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  commentsPreview: {
    gap: 4,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownComment: {
    justifyContent: 'flex-end',
  },
  otherComment: {
    justifyContent: 'flex-start',
  },
  commentBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
  },
  ownCommentBubble: {
    backgroundColor: '#E3F2FD',
  },
  otherCommentBubble: {
    backgroundColor: '#F5F5F5',
  },
  commentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    alignSelf: 'flex-end',
  },
  viewMoreComments: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  deleteModalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  ownCommentFull: {
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  otherCommentFull: {
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  commentBubbleFull: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
  },
  ownCommentBubbleFull: {
    backgroundColor: '#E3F2FD',
  },
  otherCommentBubbleFull: {
    backgroundColor: '#F5F5F5',
  },
  commentUserName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  searchIcon: {
    marginHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  searchResults: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  photoIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 2,
  },
  photoIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  photoCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  photoCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  photoMainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoMainImage: {
    width: '100%',
    height: '100%',
  },
  photoNavButton: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
  },
  photoNavLeft: {
    left: 20,
  },
  photoNavRight: {
    right: 20,
  },
  photoTaskInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  photoTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  photoUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  photoTaskDate: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  photoStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  photoTaskDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  photoTaskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  photoDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  photoDetailText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  photoPriorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoPriorityText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  photoThumbnailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  photoThumbnailActive: {
    borderColor: '#FFFFFF',
  },
  photoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  igOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  igBottomSheet: {
    width: '100%',
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  igCarousel: {
    width: '100%',
    backgroundColor: '#000',
  },
  igMedia: {
    width: '100%',
    aspectRatio: 1.7,
    backgroundColor: '#000',
  },
  igHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  igTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  igCommentsList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  igInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: 'rgba(34,40,49,0.97)',
    gap: 8,
  },
  igInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  igSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  igCardMedia: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  igCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
});
