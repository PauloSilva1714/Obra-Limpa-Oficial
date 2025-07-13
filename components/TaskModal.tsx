import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { X, User, Calendar, Flag, MapPin, ImagePlus, Video, Trash2, Send, MessageCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Task } from '../services/TaskService';
import { TaskService } from '../services/TaskService';
import { AuthService } from '../services/AuthService';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImageAsync } from '../services/PhotoService';

interface TaskModalProps {
  visible: boolean;
  task: Task | null;
  userRole: 'admin' | 'worker' | null;
  onSave: (task: Partial<Task>) => void;
  onClose: () => void;
  detailsMode?: boolean;
  onEditMode?: () => void;
}

const areas = ['Canteiro', 'Almoxarifado', 'Instalações', 'Área Externa', 'Escritório', 'Depósito'];

export function TaskModal({ visible, task, userRole, onSave, onClose, detailsMode = false, onEditMode }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    companyName: '', // Novo campo
    description: '',
    status: 'pending' as Task['status'],
    priority: 'medium' as Task['priority'],
    assignedTo: '',
    dueDate: '',
    completedDate: '',
    area: '',
    photos: [] as string[],
    videos: [] as string[],
  });
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(null);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  
  // Estados para comentários
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        companyName: task.companyName || '', // Novo campo
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate || '',
        completedDate: task.completedAt || '',
        area: task.area || '',
        photos: task.photos || [],
        videos: task.videos || [],
      });
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        companyName: '', // Novo campo
        description: '',
        status: 'pending',
        priority: 'medium',
        assignedTo: '',
        dueDate: new Date().toISOString().split('T')[0],
        completedDate: '',
        area: '',
        photos: [],
        videos: [],
      });
    }
  }, [task, visible]);

  // Atualizar comentários quando a tarefa mudar
  useEffect(() => {
    if (task && task.comments) {
      // Forçar re-render quando os comentários mudarem
      setFormData(prev => ({ ...prev }));
    }
  }, [task?.comments]);

  const handleSave = () => {
    if (!formData.title.trim()) {
      Alert.alert('Erro', 'O título da tarefa é obrigatório.');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erro', 'A descrição da tarefa é obrigatória.');
      return;
    }

    // Novo: pode validar companyName se quiser
    // if (!formData.companyName.trim()) {
    //   Alert.alert('Erro', 'O nome da empresa é obrigatório.');
    //   return;
    // }

    const taskData = { ...formData };
    // Converter datas para YYYY-MM-DD antes de salvar
    if (taskData.dueDate) {
      taskData.dueDate = formatDateForStorage(taskData.dueDate);
    }
    if (taskData.completedDate) {
      (taskData as any).completedAt = formatDateForStorage(taskData.completedDate);
    }
    delete (taskData as any).completedDate;
    if (!(taskData as any).completedAt) {
      delete (taskData as any).completedAt;
    }
    onSave(taskData);
  };

  const isReadOnly = detailsMode || (userRole === 'worker' && task?.status === 'completed');
  const isEditing = !!task;
  const canEdit = userRole === 'admin' || (userRole === 'worker' && !isReadOnly);

  const StatusButton = ({ status, label }: { status: Task['status']; label: string }) => (
    <TouchableOpacity
      style={[
        styles.modernStatusButton,
        formData.status === status && styles.modernStatusButtonActive,
        !canEdit && styles.buttonDisabled,
      ]}
      onPress={() => {
        if (canEdit) {
          const newFormData = { ...formData, status };
          // Se o status for "completed", preencher automaticamente a data de finalização no formato DD/MM/AAAA
          if (status === 'completed' && !formData.completedDate) {
            const today = new Date();
            const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth()+1).padStart(2, '0')}/${today.getFullYear()}`;
            newFormData.completedDate = formattedDate;
          }
          // Se o status for alterado de "completed" para outro, limpar a data de finalização
          if (formData.status === 'completed' && status !== 'completed') {
            newFormData.completedDate = '';
          }
          setFormData(newFormData);
        }
      }}
      disabled={!canEdit}
    >
      <Text
        style={[
          styles.modernStatusButtonText,
          formData.status === status && styles.modernStatusButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const PriorityButton = ({ priority, label, color }: { priority: Task['priority']; label: string; color: string }) => (
    <TouchableOpacity
      style={[
        styles.modernPriorityButton,
        formData.priority === priority && { backgroundColor: color + '15', borderColor: color },
        !canEdit && styles.buttonDisabled,
      ]}
      onPress={() => canEdit && setFormData({ ...formData, priority })}
      disabled={!canEdit}
    >
      <Flag size={16} color={formData.priority === priority ? color : '#6B7280'} />
      <Text
        style={[
          styles.modernPriorityButtonText,
          formData.priority === priority && { color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = async (e: Event) => {
          const files = (e.target as HTMLInputElement).files;
          if (files) {
            const uploadedUrls: string[] = [];
            const user = await AuthService.getCurrentUser();
            for (const file of Array.from(files)) {
              const url = await uploadImageAsync(file, user?.id || 'anon');
              uploadedUrls.push(url);
            }
            if (uploadedUrls.length > 0) {
              setFormData(prev => ({
                ...prev,
                photos: [...prev.photos, ...uploadedUrls]
              }));
            }
          }
        };
        input.click();
        return;
      }
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0].uri) {
        const user = await AuthService.getCurrentUser();
        const url = await uploadImageAsync(result.assets[0].uri, user?.id || 'anon');
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, url]
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const pickVideo = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.multiple = true;
        input.onchange = async (e: Event) => {
          const files = (e.target as HTMLInputElement).files;
          if (files) {
            const uploadedUrls: string[] = [];
            const user = await AuthService.getCurrentUser();
            for (const file of Array.from(files)) {
              const url = await uploadImageAsync(file, user?.id || 'anon');
              uploadedUrls.push(url);
            }
            if (uploadedUrls.length > 0) {
              setFormData(prev => ({
                ...prev,
                videos: [...prev.videos, ...uploadedUrls]
              }));
            }
          }
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar seus vídeos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setFormData(prev => ({
          ...prev,
          videos: [...prev.videos, result.assets[0].uri]
        }));
      }
    } catch (error) {
      console.error('Erro ao selecionar vídeo:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o vídeo.');
    }
  };

  const removeMedia = (type: 'photo' | 'video', index: number) => {
    if (type === 'photo') {
      const newPhotos = [...formData.photos];
      if (Platform.OS === 'web') {
        URL.revokeObjectURL(newPhotos[index]);
      }
      newPhotos.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        photos: newPhotos
      }));
    } else {
      const newVideos = [...formData.videos];
      if (Platform.OS === 'web') {
        URL.revokeObjectURL(newVideos[index]);
      }
      newVideos.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        videos: newVideos
      }));
    }
  };

  const openFullscreenMedia = (type: 'photo' | 'video', url: string) => {
    setFullscreenMedia({ type, url });
    setFullscreenVisible(true);
  };

  const closeFullscreenMedia = () => {
    setFullscreenVisible(false);
    setFullscreenMedia(null);
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      default:
        return '#EF4444';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in_progress':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      default:
        return 'Baixa';
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Se a data já está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (dateString.includes('-') && dateString.length === 10) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Se é uma data válida, formatar
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  const formatDateForStorage = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
      if (dateString.includes('/') && dateString.length === 10) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
      }
      
      // Se é uma data válida, retornar no formato YYYY-MM-DD
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao formatar data para armazenamento:', error);
      return '';
    }
  };

  // Função para adicionar comentário
  const handleAddComment = async () => {
    if (!commentText.trim() || !task) return;
    
    try {
      setIsAddingComment(true);
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Erro', 'Usuário não encontrado.');
        return;
      }

      const comment = {
        id: Date.now().toString(),
        text: commentText.trim(),
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
      };

      // Adicionar comentário à tarefa usando TaskService
      await TaskService.addComment(task.id, comment);
      
      // Limpar campo de comentário
      setCommentText('');
      
      // Atualizar a tarefa local para refletir o novo comentário
      if (task) {
        const updatedComments = [...(task.comments || []), comment];
        task.comments = updatedComments;
        
        // Forçar re-render do componente
        setFormData(prev => ({ ...prev }));
      }
      
      // Mostrar feedback visual
      Alert.alert('Sucesso', 'Comentário adicionado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o comentário.');
    } finally {
      setIsAddingComment(false);
    }
  };

  // Função para formatar data do comentário
  const formatCommentDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
          <Text style={styles.title}>
              {detailsMode ? 'Detalhes da Tarefa' : isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </Text>
            {detailsMode && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(formData.status) }]}>
                <Text style={styles.statusBadgeText}>{getStatusText(formData.status)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {detailsMode ? (
            // Layout moderno para modo detalhes
            <View style={styles.detailsContainer}>
              {/* Card Principal */}
              <View style={styles.mainCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{formData.title}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(formData.priority) }]}>
                    <Text style={styles.priorityBadgeText}>{getPriorityText(formData.priority)}</Text>
                  </View>
                </View>

                {/* Mídias integradas no card principal */}
                {(formData.photos.length > 0 || formData.videos.length > 0) && (
                  <View style={styles.inlineMediaSection}>
                    <View style={styles.inlineMediaGrid}>
                      {formData.photos.map((photo, index) => (
                        <TouchableOpacity
                          key={`photo-${index}`}
                          style={styles.inlineMediaItem}
                          onPress={() => openFullscreenMedia('photo', photo)}
                        >
                          <Image source={{ uri: photo }} style={styles.inlineMediaThumbnail} />
                          <View style={styles.inlineMediaOverlay}>
                            <Text style={styles.inlineMediaType}>📷</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      {formData.videos.map((video, index) => (
                        <TouchableOpacity
                          key={`video-${index}`}
                          style={styles.inlineMediaItem}
                          onPress={() => openFullscreenMedia('video', video)}
                        >
                          <View style={styles.inlineVideoThumbnail}>
                            <Video size={20} color="#FFFFFF" />
                          </View>
                          <View style={styles.inlineMediaOverlay}>
                            <Text style={styles.inlineMediaType}>🎥</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.inlineMediaHint}>Toque nas mídias para visualizar em tela cheia</Text>
                  </View>
                )}

                <Text style={styles.descriptionText}>{formData.description}</Text>
              </View>

              {/* Card de Informações */}
              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Informações</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoIcon}>
                      <User size={16} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Responsável</Text>
                      <Text style={styles.infoValue}>{formData.assignedTo || 'Não atribuído'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoIcon}>
                      <MapPin size={16} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Local</Text>
                      <Text style={styles.infoValue}>{formData.area || 'Não especificado'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoIcon}>
                      <Calendar size={16} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Data de Entrada</Text>
                      <Text style={styles.infoValue}>
                        {formatDateForDisplay(formData.dueDate)}
                      </Text>
                    </View>
                  </View>
                  
                  {formData.completedDate && (
                    <View style={styles.infoItem}>
                      <View style={styles.infoIcon}>
                        <Calendar size={16} color="#6B7280" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Data de Finalização</Text>
                        <Text style={styles.infoValue}>
                          {formatDateForDisplay(formData.completedDate)}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoIcon}>
                      <Flag size={16} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Prioridade</Text>
                      <Text style={styles.infoValue}>{getPriorityText(formData.priority)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card de Comentários */}
              <View style={styles.commentsCard}>
                <View style={styles.commentsHeader}>
                  <View style={styles.commentsHeaderContent}>
                    <MessageCircle size={20} color="#6B7280" />
                    <Text style={styles.commentsTitle}>Comentários</Text>
                    <Text style={styles.commentsCount}>
                      ({task?.comments?.length || 0})
                    </Text>
                  </View>
                </View>

                {/* Lista de Comentários */}
                <View style={styles.commentsList}>
                  {task?.comments && task.comments.length > 0 ? (
                    task.comments.map((comment) => (
                      <View key={comment.id} style={styles.commentItem}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentUserName}>{comment.userName}</Text>
                          <Text style={styles.commentDate}>
                            {formatCommentDate(comment.timestamp)}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.noCommentsContainer}>
                      <MessageCircle size={24} color="#9CA3AF" />
                      <Text style={styles.noCommentsText}>
                        Nenhum comentário ainda. Seja o primeiro a comentar!
                      </Text>
                    </View>
                  )}
                </View>

                {/* Campo para adicionar comentário */}
                <View style={styles.addCommentContainer}>
                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Adicionar comentário..."
                      placeholderTextColor="#9CA3AF"
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendCommentButton,
                        { backgroundColor: commentText.trim() ? '#F97316' : '#E5E7EB' }
                      ]}
                      onPress={handleAddComment}
                      disabled={!commentText.trim() || isAddingComment}
                    >
                      {isAddingComment ? (
                        <Text style={styles.sendCommentButtonText}>...</Text>
                      ) : (
                        <Send size={16} color={commentText.trim() ? '#FFFFFF' : '#9CA3AF'} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.commentHint}>
                    Pressione Enter para enviar
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // Layout moderno para edição
            <View style={styles.modernEditContainer}>
              {/* Card Principal - Título e Descrição */}
              <View style={styles.mainEditCard}>
                <View style={styles.cardHeaderEdit}>
                  <Text style={styles.cardTitle}>Informações Básicas</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>Obrigatório</Text>
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.modernLabel}>Título da Tarefa</Text>
            <TextInput
                    style={[styles.modernInput, !canEdit && styles.inputDisabled]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Digite um título claro e objetivo"
                    placeholderTextColor="#9CA3AF"
              editable={canEdit}
            />
          </View>

                {/* Novo campo: Nome da Empresa */}
                <View style={styles.inputGroup}>
                  <Text style={styles.modernLabel}>Nome da Empresa</Text>
                  <TextInput
                    style={[styles.modernInput, !canEdit && styles.inputDisabled]}
                    value={formData.companyName}
                    onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                    placeholder="Digite o nome da empresa"
                    placeholderTextColor="#9CA3AF"
                    editable={canEdit}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modernLabel}>Descrição Detalhada</Text>
            <TextInput
                    style={[styles.modernTextArea, !canEdit && styles.inputDisabled]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Descreva os detalhes, requisitos e especificações da tarefa"
                    placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              editable={canEdit}
            />
                </View>
          </View>

              {/* Card de Status e Prioridade */}
              <View style={styles.statusPriorityCard}>
                <View style={styles.cardHeaderEdit}>
                  <Text style={styles.cardTitle}>Status e Prioridade</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>Configuração</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modernLabel}>Status Atual</Text>
                  <View style={styles.modernStatusContainer}>
              <StatusButton status="pending" label="Pendente" />
              <StatusButton status="in_progress" label="Em Andamento" />
              <StatusButton status="completed" label="Concluída" />
            </View>
          </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modernLabel}>Nível de Prioridade</Text>
                  <View style={styles.modernPriorityContainer}>
              <PriorityButton priority="low" label="Baixa" color="#10B981" />
              <PriorityButton priority="medium" label="Média" color="#F59E0B" />
              <PriorityButton priority="high" label="Alta" color="#EF4444" />
                  </View>
            </View>
          </View>

              {/* Card de Atribuição e Local */}
              <View style={styles.assignmentCard}>
                <View style={styles.cardHeaderEdit}>
                  <Text style={styles.cardTitle}>Atribuição e Local</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>Organização</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelWithIcon}>
                    <User size={16} color="#6B7280" />
                    <Text style={styles.modernLabel}>Responsável pela Tarefa</Text>
                  </View>
            <TextInput
                    style={[styles.modernInput, !canEdit && styles.inputDisabled]}
              value={formData.assignedTo}
              onChangeText={(text) => setFormData({ ...formData, assignedTo: text })}
                    placeholder="Nome do responsável pela execução"
                    placeholderTextColor="#9CA3AF"
              editable={canEdit}
            />
          </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelWithIcon}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.modernLabel}>Local de Execução</Text>
                  </View>
            <TextInput
                    style={[styles.modernInput, !canEdit && styles.inputDisabled]}
              value={formData.area}
              onChangeText={(text) => setFormData({ ...formData, area: text })}
                    placeholder="Área ou local específico da tarefa"
                    placeholderTextColor="#9CA3AF"
              editable={canEdit}
            />
                </View>
          </View>

              {/* Card de Datas */}
              <View style={styles.datesCard}>
                <View style={styles.cardHeaderEdit}>
                  <Text style={styles.cardTitle}>Cronograma</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>Tempo</Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateInputGroup}>
                    <View style={styles.dateLabelContainer}>
                      <View style={styles.dateIconContainer}>
                        <Calendar size={18} color="#F97316" />
                      </View>
                      <View style={styles.dateLabelContent}>
                        <Text style={styles.dateLabel}>Data de Entrada</Text>
                        <Text style={styles.dateSubtext}>Quando a tarefa foi criada</Text>
                      </View>
                    </View>
                    <View style={styles.dateInputContainer}>
            <TextInput
                        style={[styles.modernDateInput, !canEdit && styles.inputDisabled]}
              value={formData.dueDate}
              onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#9CA3AF"
              editable={canEdit}
            />
                      <View style={styles.dateInputIcon}>
                        <Calendar size={16} color="#6B7280" />
                      </View>
                    </View>
          </View>

                  <View style={styles.dateInputGroup}>
                    <View style={styles.dateLabelContainer}>
                      <View style={[styles.dateIconContainer, styles.completedIconContainer]}>
                        <Calendar size={18} color="#10B981" />
                      </View>
                      <View style={styles.dateLabelContent}>
                        <Text style={styles.dateLabel}>Data de Finalização</Text>
                        <Text style={styles.dateSubtext}>Quando foi concluída</Text>
                      </View>
                    </View>
                    <View style={styles.dateInputContainer}>
                      <TextInput
                        style={[styles.modernDateInput, !canEdit && styles.inputDisabled]}
                        value={formData.completedDate}
                        onChangeText={(text) => setFormData({ ...formData, completedDate: text })}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#9CA3AF"
                        editable={canEdit}
                      />
                      <View style={styles.dateInputIcon}>
                        <Calendar size={16} color="#6B7280" />
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card de Mídia */}
              <View style={styles.mediaCard}>
                <View style={styles.cardHeaderEdit}>
                  <Text style={styles.cardTitle}>Mídia e Documentação</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>Opcional</Text>
                  </View>
                </View>

                <View style={styles.modernMediaButtons}>
              <TouchableOpacity 
                    style={[styles.modernMediaButton, !canEdit && styles.buttonDisabled]} 
                onPress={pickImage}
                disabled={!canEdit}
              >
                    <View style={styles.mediaButtonIcon}>
                <ImagePlus size={20} color="#6B7280" />
                    </View>
                    <Text style={styles.modernMediaButtonText}>Adicionar Fotos</Text>
                    <Text style={styles.mediaButtonSubtext}>Documentar progresso</Text>
              </TouchableOpacity>
                  
              <TouchableOpacity 
                    style={[styles.modernMediaButton, !canEdit && styles.buttonDisabled]} 
                onPress={pickVideo}
                disabled={!canEdit}
              >
                    <View style={styles.mediaButtonIcon}>
                <Video size={20} color="#6B7280" />
                    </View>
                    <Text style={styles.modernMediaButtonText}>Adicionar Vídeos</Text>
                    <Text style={styles.mediaButtonSubtext}>Demonstrar processo</Text>
              </TouchableOpacity>
            </View>

            {(formData.photos.length > 0 || formData.videos.length > 0) && (
                  <View style={styles.modernMediaContainer}>
                    <Text style={styles.mediaSectionTitle}>Mídias Anexadas</Text>
                    <View style={styles.modernMediaGrid}>
                {formData.photos.map((photo, index) => (
                        <View key={`photo-${index}`} style={styles.modernMediaItem}>
                          <TouchableOpacity
                            onPress={() => openFullscreenMedia('photo', photo)}
                            style={styles.modernMediaTouchable}
                          >
                            <Image source={{ uri: photo }} style={styles.modernMediaPreview} />
                            <View style={styles.mediaTypeBadge}>
                              <Text style={styles.mediaTypeText}>📷</Text>
                            </View>
                          </TouchableOpacity>
                    {canEdit && (
                      <TouchableOpacity 
                              style={styles.modernRemoveButton}
                        onPress={() => removeMedia('photo', index)}
                      >
                              <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {formData.videos.map((video, index) => (
                        <View key={`video-${index}`} style={styles.modernMediaItem}>
                          <TouchableOpacity
                            onPress={() => openFullscreenMedia('video', video)}
                            style={styles.modernMediaTouchable}
                          >
                            <View style={styles.modernVideoPreview}>
                      <Video size={24} color="#6B7280" />
                              <Text style={styles.videoPlayText}>▶</Text>
                    </View>
                            <View style={styles.mediaTypeBadge}>
                              <Text style={styles.mediaTypeText}>🎥</Text>
                            </View>
                          </TouchableOpacity>
                    {canEdit && (
                      <TouchableOpacity 
                              style={styles.modernRemoveButton}
                        onPress={() => removeMedia('video', index)}
                      >
                              <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                    </View>
              </View>
            )}
          </View>
            </View>
          )}
        </ScrollView>

        {!detailsMode && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          {userRole === 'admin' && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Salvar' : 'Criar Tarefa'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        )}

        {detailsMode && userRole === 'admin' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Fechar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={() => {
              // Mudar do modo de detalhes para o modo de edição
              // Isso será tratado pelo componente pai através de uma nova prop
              if (onEditMode) {
                onEditMode();
              }
            }}
          >
            <Text style={styles.saveButtonText}>Editar Tarefa</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Area Picker Modal */}
        <Modal
          visible={showAreaPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecione a Área</Text>
                <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {areas.map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, area });
                      setShowAreaPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{area}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Fullscreen Media Modal */}
        {fullscreenMedia && (
          <Modal
            visible={fullscreenVisible}
            transparent
            animationType="fade"
            onRequestClose={closeFullscreenMedia}
          >
            <TouchableOpacity 
              style={styles.fullscreenOverlay} 
              activeOpacity={1}
              onPress={closeFullscreenMedia}
            >
              <View style={styles.fullscreenContainer}>
                <TouchableOpacity 
                  style={styles.fullscreenContent}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <TouchableOpacity 
                    style={styles.closeFullscreenButton} 
                    onPress={closeFullscreenMedia}
                  >
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  {fullscreenMedia.type === 'photo' && (
                    <Image 
                      source={{ uri: fullscreenMedia.url }} 
                      style={styles.fullscreenImage}
                      resizeMode="contain"
                    />
                  )}
                  
                  {fullscreenMedia.type === 'video' && (
                    <View style={styles.fullscreenVideoContainer}>
                      {Platform.OS === 'web' ? (
                        <video
                          src={fullscreenMedia.url}
                          controls
                          style={styles.fullscreenVideo}
                          autoPlay
                        />
                      ) : (
                        <View style={styles.fullscreenVideoPlaceholder}>
                          <Video size={48} color="#6B7280" />
                          <Text style={styles.fullscreenVideoText}>
                            Vídeo não suportado nesta plataforma
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerTextDisabled: {
    color: '#9CA3AF',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  pickerOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flex: 1,
  },
  mediaButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  mediaItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)',
    elevation: 5,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  fullscreenContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeFullscreenButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  fullscreenVideoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  fullscreenVideoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreenVideoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  inlineMediaSection: {
    marginBottom: 20,
    marginTop: 8,
  },
  inlineMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  inlineMediaItem: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inlineMediaThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  inlineMediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  inlineMediaType: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  inlineVideoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineMediaHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernEditContainer: {
    flex: 1,
    padding: 20,
  },
  mainEditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  cardHeaderEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardBadge: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  cardBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  modernLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  modernInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  modernTextArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusPriorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  modernStatusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modernPriorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabelContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  dateInputIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernDateInput: {
    borderWidth: 0,
    padding: 0,
    fontSize: 16,
    color: '#374151',
    backgroundColor: 'transparent',
  },
  completedIconContainer: {
    backgroundColor: '#10B981',
  },
  mediaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  modernMediaButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modernMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flex: 1,
  },
  mediaButtonIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernMediaButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modernMediaContainer: {
    marginBottom: 16,
  },
  mediaSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  modernMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  modernMediaItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modernMediaTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernMediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mediaTypeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  modernRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)',
    elevation: 5,
  },
  modernVideoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modernStatusButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modernStatusButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  modernStatusButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  modernStatusButtonTextActive: {
    color: '#FFFFFF',
  },
  modernPriorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  modernPriorityButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  commentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  commentsCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  commentDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  commentText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    lineHeight: 22,
  },
  noCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  noCommentsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  addCommentContainer: {
    marginTop: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  sendCommentButton: {
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  sendCommentButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  commentHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});