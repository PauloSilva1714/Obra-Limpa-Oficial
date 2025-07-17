import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  User,
  Clock,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Calendar,
  Trash2,
  MessageCircle,
  MapPin,
  Eye,
} from 'lucide-react-native';
import { Task, Comment } from '@/services/TaskService';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/config/i18n';

interface TaskFeedCardProps {
  task: Task;
  userRole: 'admin' | 'worker' | null;
  onTaskPress: (task: Task) => void;
  onTaskDetails: (task: Task) => void;
  onOpenComments: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskFeedCard: React.FC<TaskFeedCardProps> = ({
  task,
  userRole,
  onTaskPress,
  onTaskDetails,
  onOpenComments,
  onDeleteTask,
}) => {
  const { colors } = useTheme();

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

  return (
    <View style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Substituir o header do card para exibir o nome de quem criou a tarefa no topo, estilo Facebook */}
      <View style={styles.fbHeader}>
        <View style={styles.fbAvatar}>
          <User size={20} color={colors.primary} />
        </View>
        <View style={styles.fbHeaderInfo}>
          <Text style={styles.fbUserName}>{task.createdByName || 'Usuário'}</Text>
          <Text style={styles.fbDate}>{new Date(task.createdAt).toLocaleDateString('pt-BR')}</Text>
        </View>
      </View>

      {/* Foto Principal */}
      {task.photos && task.photos.length > 0 && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: task.photos[0] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Informações da Tarefa */}
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
          {task.title}
        </Text>
        
        {task.description && (
          <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={3}>
            {task.description}
          </Text>
        )}

        <View style={styles.taskDetails}>
          {task.area && (
            <View style={styles.detailItem}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
                {task.area}
              </Text>
            </View>
          )}
          
          {task.dueDate && (
            <View style={styles.detailItem}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={[styles.detailText, { color: colors.textMuted }]}>
                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
            {task.priority === 'high' ? t('high') : task.priority === 'medium' ? t('medium') : t('low')}
          </Text>
        </View>
      </View>

      {/* Seção de Comentários */}
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeader}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>
            Comentários ({task.comments?.length || 0})
          </Text>
          {/* Ícone de comentário removido daqui para evitar duplicidade */}
        </View>
        
        {task.comments && task.comments.length > 0 && (
          <View style={styles.commentsPreview}>
            {task.comments.slice(0, 2).map((comment, index) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={[styles.commentUserName, { color: colors.text }]}>
                  {comment.userName}
                </Text>
                <Text style={[styles.commentText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {comment.text}
                </Text>
              </View>
            ))}
            {task.comments.length > 2 && (
              <TouchableOpacity onPress={() => onOpenComments(task)}>
                <Text style={[styles.viewMoreComments, { color: colors.primary }]}>
                  Ver mais {task.comments.length - 2} comentários
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Barra de ações estilo Facebook na parte inferior */}
      <View style={styles.fbActionsBar}>
        <TouchableOpacity onPress={() => onOpenComments(task)} style={styles.fbActionButton}>
          <MessageCircle size={20} color={colors.primary} />
          <Text style={styles.fbActionText}>Comentar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTaskDetails(task)} style={styles.fbActionButton}>
          <Eye size={20} color={colors.primary} />
          <Text style={styles.fbActionText}>Ver Detalhes</Text>
        </TouchableOpacity>
        {userRole === 'admin' && (
          <TouchableOpacity onPress={() => onDeleteTask(task.id)} style={styles.fbActionButton}>
            <Trash2 size={20} color={colors.error} />
            <Text style={[styles.fbActionText, { color: colors.error }]}>Excluir</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  commentUserName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  commentText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    flex: 1,
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
  fbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f2f5', // Facebook-like background
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fbAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fbHeaderInfo: {
    flex: 1,
  },
  fbUserName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1c1e21',
  },
  fbDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#606770',
  },
  fbActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f0f2f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fbActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fbActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#385898', // Facebook blue
  },
}); 