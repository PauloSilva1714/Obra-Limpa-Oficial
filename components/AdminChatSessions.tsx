import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { MessageCircle, User, Clock, Trash2 } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AdminService, AdminChatSession } from '../services/AdminService';
import { AuthService } from '../services/AuthService';

interface AdminChatSessionsProps {
  siteId: string;
  onSelectSession: (otherUserId: string, otherUserName: string) => void;
  style?: any;
}

export default function AdminChatSessions({ 
  siteId, 
  onSelectSession, 
  style 
}: AdminChatSessionsProps) {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<AdminChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<AdminChatSession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const unsubscribeSessions = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await loadSessions();
        await setupRealtimeListener();
        AuthService.getCurrentUser().then(setCurrentUser);
      } catch (error) {
        console.error('Erro ao inicializar sessões de chat:', error);
      }
    };

    initializeComponent();

    return () => {
      if (unsubscribeSessions.current) {
        try {
          unsubscribeSessions.current();
        } catch (error) {
          console.error('Erro ao desinscrever sessões:', error);
        }
      }
    };
  }, [siteId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      const sessionsData = await AdminService.getChatSessions(siteId);
      setSessions(sessionsData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as sessões de chat');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeListener = async () => {
    try {
      const unsubscribe = await AdminService.subscribeToChatSessions(
        siteId,
        (newSessions) => {
          setSessions(newSessions);
        }
      );
      unsubscribeSessions.current = unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener em tempo real:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffInMinutes < 1) {
        return 'Agora';
      }
      return `${diffInMinutes}min atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getOtherParticipant = (session: AdminChatSession) => {
    if (!currentUser) return { id: '', name: '' };
    
    // Encontrar o índice do usuário atual nos participantes
    const currentUserIndex = session.participants.findIndex(id => id === currentUser.id);
    
    // Se não encontrou o usuário atual, retornar o primeiro participante
    if (currentUserIndex === -1) {
      return {
        id: session.participants[0] || '',
        name: session.participantNames[0] || 'Usuário desconhecido',
      };
    }
    
    // Retornar o outro participante (não o atual)
    const otherIndex = currentUserIndex === 0 ? 1 : 0;
    return {
      id: session.participants[otherIndex] || '',
      name: session.participantNames[otherIndex] || 'Usuário desconhecido',
    };
  };

  const handleDeleteSession = (session: AdminChatSession) => {
    setSessionToDelete(session);
    setDeleteModalVisible(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      // Deletar todas as mensagens da sessão
      await AdminService.deleteDirectMessagesForSession(sessionToDelete.siteId, sessionToDelete.participants);
      // Deletar a sessão
      await AdminService.deleteChatSession(sessionToDelete.id);
      setDeleteModalVisible(false);
      setSessionToDelete(null);
      setDeleting(false);
      // Atualizar lista
      await loadSessions();
    } catch (error: any) {
      setDeleteModalVisible(false);
      setSessionToDelete(null);
      setDeleting(false);
      Alert.alert('Erro', 'Não foi possível excluir a conversa: ' + (error?.message || ''));
    }
  };

  const cancelDeleteSession = () => {
    setDeleteModalVisible(false);
    setSessionToDelete(null);
  };

  const renderSession = ({ item }: { item: AdminChatSession }) => {
    const otherParticipant = getOtherParticipant(item);
    const initial = otherParticipant.name ? otherParticipant.name.charAt(0).toUpperCase() : '?';
    
    return (
      <View style={[styles.sessionContainer, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => onSelectSession(otherParticipant.id, otherParticipant.name)}
        >
          <View style={styles.sessionHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}> 
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>
                {otherParticipant.name}
              </Text>
            </View>
            <Text style={[styles.sessionTime, { color: colors.textMuted }]}>
              {item.lastMessageTime ? formatDate(item.lastMessageTime) : ''}
            </Text>
          </View>
          {item.lastMessage && (
            <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={2}>
              {item.lastMessage}
            </Text>
          )}
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* Botão de lixeira */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSession(item)}
        >
          <Trash2 size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Carregando conversas...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {/* Header Indicator */}
      <View style={[styles.headerIndicator, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
        <MessageCircle size={16} color={colors.primary} />
        <Text style={[styles.headerIndicatorText, { color: colors.primary }]}>
          Conversas Individuais - Clique em uma conversa para abrir
        </Text>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        style={styles.sessionsList}
        contentContainerStyle={styles.sessionsContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma conversa encontrada
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Use o botão "Novo Chat" no canto superior direito para iniciar uma conversa individual
            </Text>
          </View>
        }
      />

      {/* Modal de confirmação de exclusão da sessão */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteSession}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Confirmar Exclusão</Text>
            <Text style={[styles.deleteModalText, { color: colors.textSecondary }]}>Tem certeza que deseja excluir toda a conversa? Todas as mensagens serão removidas. Esta ação não pode ser desfeita.</Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={cancelDeleteSession}
                disabled={deleting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton, { backgroundColor: colors.error }]}
                onPress={confirmDeleteSession}
                disabled={deleting}
              >
                <Text style={styles.confirmButtonText}>{deleting ? 'Excluindo...' : 'Excluir'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  sessionsList: {
    flex: 1,
  },
  sessionsContent: {
    padding: 15,
  },
  sessionContainer: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sessionTime: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  headerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
  },
  headerIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 14,
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
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 