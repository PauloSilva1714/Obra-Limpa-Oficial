import React, { useEffect, useState } from 'react';
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
  Pencil as Edit, // Adiciona o ícone de lápis
} from 'lucide-react-native';
import { Task, Comment } from '@/services/TaskService';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/config/i18n';
import { AuthService } from '@/services/AuthService';

interface TaskFeedCardProps {
  task: Task;
  userRole: 'admin' | 'worker' | null;
  onTaskPress: (task: Task) => void;
  onTaskDetails: (task: Task) => void;
  onOpenComments: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (task: Task) => void; // Adiciona prop para editar
}

export const TaskFeedCard: React.FC<TaskFeedCardProps> = ({
  task,
  userRole,
  onTaskPress,
  onTaskDetails,
  onOpenComments,
  onDeleteTask,
  onEditTask,
}) => {
  const { colors } = useTheme();
  const [workers, setWorkers] = useState<any[]>([]);

  useEffect(() => {
    AuthService.getCurrentSite().then(site => {
      if (site && site.id) {
        AuthService.getWorkersBySite(site.id).then((users) => {
          setWorkers(users);
        });
      } else {
        setWorkers([]);
      }
    });
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F97316';
      case 'in_progress':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'delayed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#fff', color: '#F97316', borderColor: '#F97316', borderWidth: 1 };
      case 'in_progress':
        return { backgroundColor: '#FDE68A', color: '#B45309' };
      case 'completed':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'delayed':
        return { backgroundColor: '#FECACA', color: '#B91C1C' };
      default:
        return { backgroundColor: '#E5E7EB', color: '#374151' };
    }
  };

  // Função utilitária para exibir nomes dos responsáveis
  const getAssigneesNames = () => {
    if (!task.assignedTo) return 'Não atribuído';
    
    let assignees: string[] = [];
    
    if (Array.isArray(task.assignedTo)) {
      assignees = task.assignedTo;
    } else if (typeof task.assignedTo === 'string') {
      assignees = task.assignedTo.split(', ').map(a => a.trim());
    }
    
    // Converter IDs para nomes reais
    const realNames = assignees.map(assignee => {
      // Verificar se é um ID de worker (formato de ID do Firestore)
      const worker = workers.find(w => w.id === assignee);
      if (worker) {
        return worker.name;
      }
      // Se não encontrou o worker, retornar o nome como está (pode ser um nome manual)
      return assignee;
    });
    
    return realNames.length > 0 ? realNames.join(', ') : 'Não atribuído';
  };

  return (
    <View style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.fbHeader}>
        <View style={styles.fbAvatar}>
          {task.createdByPhotoURL ? (
            <Image
              source={{ uri: task.createdByPhotoURL }}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee' }}
              resizeMode="cover"
            />
          ) : (
          <User size={20} color={colors.primary} />
          )}
        </View>
        <View style={styles.fbHeaderInfo}>
          <Text style={styles.fbUserName}>{task.createdByName || 'Usuário'}</Text>
          <Text style={styles.fbDate}>{new Date(task.createdAt).toLocaleDateString('pt-BR')}</Text>
          <Text style={[styles.fbAssignees, { color: colors.textMuted }]}>
            {getAssigneesNames()}
          </Text>
          </View>
        <View style={styles.statusRiskBadges}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
            <Text style={{ fontWeight: 'bold', color: getStatusBadgeStyle(task.status).color, fontSize: 13 }}>
              {task.status === 'pending' ? 'Pendente' :
               task.status === 'in_progress' ? 'Em Andamento' :
               task.status === 'completed' ? 'Concluída' :
               task.status === 'delayed' ? 'Atrasada' : task.status}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20', marginLeft: 8, minWidth: 48, alignItems: 'center' }] }>
            <Text style={{ color: getPriorityColor(task.priority), fontWeight: 'bold', fontSize: 13 }}>
              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
            </Text>
          </View>
        </View>
      </View>

      {task.photos && task.photos.length > 0 && (
        <TouchableOpacity onPress={() => onTaskPress(task)}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: task.photos[0] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
        <Text style={[styles.taskDescription, { color: colors.textMuted }]}>
          {task.description}
        </Text>
        
        <View style={styles.taskDetails}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{getPriorityText(task.priority)}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={12} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textMuted }]}>{task.area}</Text>
          </View>
        </View>
      </View>

      <View style={styles.commentsSection}>
        {task.comments && task.comments.length > 0 && (
          <TouchableOpacity onPress={() => onOpenComments(task)}>
            <Text style={[styles.viewMoreComments, { color: colors.primary }]}>
              Ver {task.comments.length} comentário{task.comments.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.fbActionsBar, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.fbActionButton}
          onPress={() => onTaskDetails(task)}
        >
          <Eye size={18} color={colors.primary} />
          <Text style={[styles.fbActionText, { color: colors.primary }]}>Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fbActionButton}
          onPress={() => onOpenComments(task)}
        >
          <MessageCircle size={18} color={colors.textMuted} />
          <Text style={[styles.fbActionText, { color: colors.textMuted }]}>
            Comentar
          </Text>
        </TouchableOpacity>

        {userRole === 'admin' && (
          <>
            <TouchableOpacity
              style={styles.fbActionButton}
              onPress={() => onEditTask && onEditTask(task)}
            >
              <Edit size={18} color={colors.textMuted} />
              <Text style={[styles.fbActionText, { color: colors.textMuted }]}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fbActionButton}
              onPress={() => onDeleteTask(task.id)}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={[styles.fbActionText, { color: "#ef4444" }]}>Excluir</Text>
            </TouchableOpacity>
          </>
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
  fbAssigneesLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 2,
  },
  fbAssigneesLabel: {
    fontSize: 11,
    color: '#6B7280', // cinza
    fontFamily: 'Inter-Regular',
  },
  fbAssignees: {
    fontSize: 13,
    color: '#2563EB',
    fontFamily: 'Inter-Medium',
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusRiskBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 8,
  },
});