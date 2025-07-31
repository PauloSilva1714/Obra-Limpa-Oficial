import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {
  Send,
  MessageCircle,
  Bell,
  Users,
  Trash2,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  AdminService,
  AdminMessage,
  AdminNotification,
} from '../services/AdminService';
import { AuthService } from '../services/AuthService';
import { Timestamp, FieldValue } from 'firebase/firestore';

interface AdminChatProps {
  siteId: string;
  style?: any;
}

export default function AdminChat({ siteId, style }: AdminChatProps) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>(
    'messages'
  );
  const [messageType, setMessageType] = useState<
    'general' | 'task' | 'alert' | 'announcement'
  >('general');
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'
  >('medium');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const unsubscribeMessages = useRef<(() => void) | null>(null);
  const unsubscribeNotifications = useRef<(() => void) | null>(null);

  // Função utilitária para ordenar mensagens
  function sortMessages(msgs: AdminMessage[]) {
    return [...msgs].sort((a, b) => {
      const getTime = (createdAt: any) => {
        if (!createdAt) return 0;
        if (typeof createdAt === 'string') return new Date(createdAt).getTime();
        if (createdAt.toDate) return createdAt.toDate().getTime();
        return 0;
      };
      const timeA = getTime(a.createdAt);
      const timeB = getTime(b.createdAt);
      if (timeA !== timeB) return timeA - timeB;
      // Fallback: comparar por id
      return (a.id || '').localeCompare(b.id || '');
    });
  }

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await loadInitialData();
        await setupRealtimeListeners();
        AuthService.getCurrentUser().then(setCurrentUser);
      } catch (error) {
        console.error('❌ Erro ao inicializar AdminChat:', error);
      }
    };

    initializeComponent();

    return () => {
      // Verificar se as funções de unsubscribe existem antes de chamá-las
      if (unsubscribeMessages.current) {
        try {
          unsubscribeMessages.current();
        } catch (error) {
          console.error('❌ Erro ao desinscrever mensagens:', error);
        }
      }

      if (unsubscribeNotifications.current) {
        try {
          unsubscribeNotifications.current();
        } catch (error) {
          console.error('❌ Erro ao desinscrever notificações:', error);
        }
      }
    };
  }, [siteId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const messagesData = await AdminService.getMessages(siteId, {});

      const notificationsData = await AdminService.getNotifications();

      setMessages(sortMessages(messagesData));
      setNotifications(notificationsData);
    } catch (error) {
      console.error(
        '❌ AdminChat.loadInitialData() - Erro ao carregar dados iniciais:',
        error
      );
      Alert.alert('Erro', 'Não foi possível carregar as mensagens');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = async () => {
    try {
      // Listener para mensagens em tempo real
      const messagesUnsubscribe = await AdminService.subscribeToMessages(
        siteId,
        (newMessages) => {
          setMessages(sortMessages(newMessages));
        }
      );
      unsubscribeMessages.current = messagesUnsubscribe;

      // Listener para notificações em tempo real
      const notificationsUnsubscribe =
        await AdminService.subscribeToNotifications((newNotifications) => {
          setNotifications(newNotifications);
        });
      unsubscribeNotifications.current = notificationsUnsubscribe;
    } catch (error) {
      console.error('❌ Erro ao configurar listeners em tempo real:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await AdminService.sendMessage(
        siteId,
        newMessage.trim(),
        messageType,
        priority
      );
      setNewMessage('');
      setMessageType('general');
      setPriority('medium');

      // Scroll para a última mensagem
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await AdminService.deleteMessage(messageToDelete);
      setDeleteModalVisible(false);
      setMessageToDelete(null);
      await loadInitialData();
    } catch (error: any) {
      setDeleteModalVisible(false);
      setMessageToDelete(null);
      Alert.alert(
        'Erro',
        'Não foi possível excluir a mensagem: ' + (error?.message || '')
      );
    }
  };

  const cancelDeleteMessage = () => {
    setDeleteModalVisible(false);
    setMessageToDelete(null);
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await AdminService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#DC2626';
      case 'high':
        return '#EA580C';
      case 'medium':
        return '#D97706';
      case 'low':
        return '#059669';
      default:
        return colors.primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle size={16} color="#DC2626" />;
      case 'announcement':
        return <Info size={16} color="#2563EB" />;
      case 'task':
        return <MessageCircle size={16} color="#059669" />;
      default:
        return <MessageCircle size={16} color={colors.primary} />;
    }
  };

  const formatDate = (
    createdAt: string | Timestamp | FieldValue | undefined
  ) => {
    if (!createdAt) return 'Enviando...';
    let date: Date;
    if (typeof createdAt === 'string') {
      date = new Date(createdAt);
    } else if (createdAt instanceof Timestamp) {
      date = createdAt.toDate();
    } else {
      return 'Enviando...';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffMs / (1000 * 60));
    const diffInHours = diffMs / (1000 * 60 * 60);
    if (diffInMinutes < 1) {
      return 'Agora';
    } else if (diffInHours < 1) {
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

  const renderMessage = ({ item }: { item: AdminMessage }) => {
    const isOwnMessage = currentUser?.id === item.senderId;
    const isUnread = !item.readBy.includes(currentUser?.id || '');

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          { backgroundColor: isOwnMessage ? colors.primary : colors.surface },
        ]}
      >
        <View style={styles.messageHeader}>
          <Text
            style={[
              styles.senderName,
              { color: isOwnMessage ? 'white' : colors.text },
            ]}
          >
            {item.senderName}
          </Text>
          <View style={styles.messageMeta}>
            {getTypeIcon(item.type)}
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
            >
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
            <Text
              style={[
                styles.messageTime,
                { color: isOwnMessage ? '#E0E7FF' : colors.textMuted },
              ]}
            >
              {formatDate(item.createdAt)}
            </Text>
            {isOwnMessage && currentUser && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteMessage(item.id)}
              >
                <Trash2 size={16} color="#DC2626" />
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text
          style={[
            styles.messageText,
            { color: isOwnMessage ? 'white' : colors.text },
          ]}
        >
          {item.message}
        </Text>

        {isUnread && !isOwnMessage && (
          <View style={styles.unreadIndicator}>
            <Text style={styles.unreadText}>Nova</Text>
          </View>
        )}
      </View>
    );
  };

  const renderNotification = ({ item }: { item: AdminNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationContainer,
        {
          backgroundColor: item.read ? colors.surface : '#FEF3C7',
          borderLeftColor: item.read ? colors.border : '#F59E0B',
        },
      ]}
      onPress={() => handleMarkNotificationAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      <Text style={[styles.notificationMessage, { color: colors.textMuted }]}>
        {item.message}
      </Text>

      <Text style={[styles.notificationSender, { color: colors.primary }]}>
        Por: {item.senderName}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
          style,
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '😎', '😢', '🎉', '🚀', '❤️'];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'messages' && { borderBottomColor: colors.primary },
            ]}
            onPress={() => {
              setActiveTab('messages');
              // Marcar todas as notificações como lidas quando mudar para a aba de mensagens
              if (activeTab === 'notifications') {
                notifications
                  .filter((n) => !n.read)
                  .forEach((notification) => {
                    handleMarkNotificationAsRead(notification.id);
                  });
              }
            }}
          >
            <MessageCircle
              size={20}
              color={
                activeTab === 'messages' ? colors.primary : colors.textMuted
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'messages'
                      ? colors.primary
                      : colors.textMuted,
                },
              ]}
            >
              Chat em Grupo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'notifications' && {
                borderBottomColor: colors.primary,
              },
            ]}
            onPress={() => setActiveTab('notifications')}
          >
            <Bell
              size={20}
              color={
                activeTab === 'notifications'
                  ? colors.primary
                  : colors.textMuted
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'notifications'
                      ? colors.primary
                      : colors.textMuted,
                },
              ]}
            >
              Notificações
            </Text>
            {notifications.filter((n) => !n.read).length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>
                  {notifications.filter((n) => !n.read).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'messages' ? (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Message Input */}
          <View
            style={[
              styles.inputContainer,
              {
                borderTopColor: colors.border,
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
              },
            ]}
          >
            {!showOptions && (
              <TouchableOpacity
                onPress={() => setShowOptions(true)}
                style={{ alignSelf: 'flex-end', margin: 8 }}
                accessibilityLabel={'Mostrar área de digitação'}
              >
                <Text style={{ fontSize: 28 }}>😊</Text>
              </TouchableOpacity>
            )}
            {showOptions && (
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => setShowOptions(false)}
                  style={{ alignSelf: 'flex-end', marginBottom: 4 }}
                  accessibilityLabel={'Esconder área de digitação'}
                >
                  <Text style={{ fontSize: 22 }}>❌</Text>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setNewMessage(newMessage + emoji)}
                      style={{ marginRight: 8, marginBottom: 4 }}
                      accessibilityLabel={`Adicionar emoji ${emoji}`}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View
                  style={[
                    styles.chatTypeIndicator,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Users size={16} color={colors.primary} />
                  <Text
                    style={[styles.chatTypeText, { color: colors.primary }]}
                  >
                    Chat em Grupo - Enviando para todos os administradores
                  </Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.messageInput,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Digite sua mensagem para o grupo..."
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Send size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          style={styles.notificationsList}
          contentContainerStyle={styles.notificationsContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteMessage}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.deleteModal, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>
              Confirmar Exclusão
            </Text>
            <Text
              style={[styles.deleteModalText, { color: colors.textSecondary }]}
            >
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode
              ser desfeita.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={cancelDeleteMessage}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  styles.confirmButton,
                  { backgroundColor: colors.error },
                ]}
                onPress={confirmDeleteMessage}
              >
                <Text style={styles.confirmButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 20,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  messageTime: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  unreadIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 15,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageOptions: {
    marginTop: 15,
    gap: 10,
  },
  optionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  optionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 15,
  },
  notificationContainer: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationSender: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  chatTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
  },
  chatTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
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
});
