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
      {/* Header do Card */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <User size={16} color={colors.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {task.assignedTo || 'Não designado'}
            </Text>
            <Text style={[styles.taskDate, { color: colors.textMuted }]}>
              {new Date(task.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(task.status)}
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {getStatusText(task.status)}
          </Text>
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
          <TouchableOpacity onPress={() => onOpenComments(task)}>
            <MessageCircle size={16} color={colors.primary} />
          </TouchableOpacity>
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

      {/* Ações do Card */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => onTaskDetails(task)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Ver Detalhes</Text>
        </TouchableOpacity>
        
        {userRole === 'admin' && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => onDeleteTask(task.id)}
          >
            <Trash2 size={16} color={colors.error} />
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
}); 