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
  Image,
} from 'react-native';
import { Send, ArrowLeft, Trash2, User, Check, Camera, Paperclip } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AdminService, AdminDirectMessage } from '../services/AdminService';
import { AuthService } from '../services/AuthService';
import { uploadImageAsync } from '../services/PhotoService';


import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Timestamp, FieldValue, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createUniqueId } from '../utils/idUtils';

interface AdminDirectChatProps {
  siteId: string;
  otherUserId: string;
  otherUserName: string;
  onBack: () => void;
  style?: any;
}

export default function AdminDirectChat({
  siteId,
  otherUserId,
  otherUserName,
  onBack,
  style
}: AdminDirectChatProps) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<AdminDirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<AdminDirectMessage[]>([]);
  const [otherUserPhotoURL, setOtherUserPhotoURL] = useState<string | null>(null);


  const [otherUserStatus, setOtherUserStatus] = useState<string>('Carregando...');

  const flatListRef = useRef<FlatList>(null);
  const unsubscribeMessages = useRef<(() => void) | null>(null);

  // Função utilitária para ordenar mensagens
  function sortMessages(msgs: AdminDirectMessage[]) {
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

  // useEffect do listener
  useEffect(() => {
    let isMounted = true;
    const initializeComponent = async () => {
      try {
        console.log('🔍 [AdminDirectChat] Inicializando componente:', { siteId, otherUserId, otherUserName });
        setLoading(true);

        console.log('🔍 [AdminDirectChat] Buscando mensagens iniciais...');
        const messagesData = await AdminService.getDirectMessages(siteId, otherUserId, {});
        console.log('🔍 [AdminDirectChat] Mensagens encontradas:', messagesData.length, messagesData);

        if (isMounted) {
          const sortedMessages = sortMessages(messagesData);
          console.log('🔍 [AdminDirectChat] Mensagens ordenadas:', sortedMessages.length);
          setMessages(sortedMessages);
        }

        if (unsubscribeMessages.current) unsubscribeMessages.current();

        console.log('🔍 [AdminDirectChat] Configurando subscrição em tempo real...');
        const unsubscribe = await AdminService.subscribeToDirectMessages(
          siteId,
          otherUserId,
          (newMessages) => {
            console.log('🔍 [AdminDirectChat] Mensagens recebidas via subscrição:', newMessages.length);

            if (isMounted) {
              setPendingMessages((pending) => {
                // Usar clientId para identificar mensagens confirmadas
                const confirmedClientIds = newMessages.map(msg => msg.clientId).filter(Boolean);
                const updatedPending = pending.filter(pmsg => !confirmedClientIds.includes(pmsg.clientId));
                const updatedMessages = sortMessages([...newMessages, ...updatedPending]);
                console.log('🔍 [AdminDirectChat] Mensagens finais após processamento:', updatedMessages.length);
                setMessages(updatedMessages);
                return updatedPending;
              });
            }
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        );
        unsubscribeMessages.current = unsubscribe;
        console.log('🔍 [AdminDirectChat] Subscrição configurada com sucesso');
      } catch (error) {
        console.error('❌ [AdminDirectChat] Erro ao inicializar chat individual:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeComponent();
    return () => {
      isMounted = false;
      if (unsubscribeMessages.current) {
        try {
          unsubscribeMessages.current();
        } catch (error) {
          console.error('Erro ao desinscrever mensagens:', error);
        }
      }
    };
  }, [siteId, otherUserId]);

  useEffect(() => {
    AuthService.getCurrentUser().then(setCurrentUser);
  }, []);

  useEffect(() => {
    // Buscar foto de perfil do outro usuário
    AuthService.getUserById(otherUserId).then(user => {
      setOtherUserPhotoURL(user?.photoURL || null);
    });
  }, [otherUserId]);

  // useEffect para monitorar status online do outro usuário
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    const updateOtherUserStatus = async () => {
      try {
        console.log('🔍 [AdminDirectChat] Buscando status do usuário:', otherUserId);
        const status = await AuthService.getUserOnlineStatus(otherUserId);
        console.log('🔍 [AdminDirectChat] Status recebido:', status);
        const formattedStatus = AuthService.formatOnlineStatus(status);
        console.log('🔍 [AdminDirectChat] Status formatado:', formattedStatus);
        setOtherUserStatus(formattedStatus);
      } catch (error) {
        console.error('❌ [AdminDirectChat] Erro ao buscar status do usuário:', error);
        setOtherUserStatus('Offline');
      }
    };

    // Buscar status inicial
    console.log('🔍 [AdminDirectChat] Iniciando monitoramento de status para:', otherUserId);
    updateOtherUserStatus();

    // Atualizar status a cada 30 segundos
    statusInterval = setInterval(updateOtherUserStatus, 30000);

    return () => {
      console.log('🔍 [AdminDirectChat] Parando monitoramento de status para:', otherUserId);
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [otherUserId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      setSending(true);
      // Mensagem otimista com clientId
      const clientId = createUniqueId();
      const tempId = 'temp-' + clientId;
      const optimisticMsg: AdminDirectMessage = {
        id: tempId,
        siteId,
        senderId: currentUser?.id || '',
        senderName: currentUser?.name || 'Você',
        senderEmail: currentUser?.email || '',
        recipientId: otherUserId,
        recipientName: otherUserName,
        recipientEmail: '',
        content: newMessage,
        type: 'text',
        createdAt: new Date().toISOString(),
        readBy: [currentUser?.id || ''],
        attachments: [],
        clientId,
      };

      setPendingMessages((prev) => [...prev, optimisticMsg]);
      setMessages((prev) => sortMessages([...prev, optimisticMsg]));
      setNewMessage('');
      await AdminService.sendDirectMessage(siteId, otherUserId, optimisticMsg.content, 'text', clientId);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem: ' + (error?.message || ''));
    } finally {
      setSending(false);
    }
  };





  // Função para abrir câmera para foto
  const openCameraForPhoto = async () => {
    try {
      // Solicitar permissões
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para tirar fotos.');
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permite edição/crop nativo
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await handleSendImage(imageUri);
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera');
    }
  };

  // Função para abrir câmera para vídeo
  const openCameraForVideo = async () => {
    try {
      // Solicitar permissões
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para gravar vídeos.');
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true, // Permite edição nativa
        videoMaxDuration: 60, // 60 segundos máximo
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        await handleSendImage(videoUri);
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera');
    }
  };

  // Função para processar e enviar imagem
  const handleSendImage = async (imageUri: string) => {
    try {
      setSending(true);
      
      // Upload da imagem para o Firebase Storage
      const uploadedUrl = await uploadImageAsync(imageUri, currentUser?.id || '');
      
      const clientId = createUniqueId();
      const tempId = 'temp-' + clientId;
      
      // Mensagem otimista
      const optimisticMsg: AdminDirectMessage = {
        id: tempId,
        siteId,
        senderId: currentUser?.id || '',
        senderName: currentUser?.name || 'Você',
        senderEmail: currentUser?.email || '',
        recipientId: otherUserId,
        recipientName: otherUserName,
        content: '📷 Foto',
        type: 'image',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readBy: [currentUser?.id || ''],
        attachments: [uploadedUrl],
        clientId,
      };

      setPendingMessages((prev) => [...prev, optimisticMsg]);
      setMessages((prev) => sortMessages([...prev, optimisticMsg]));

      await AdminService.sendDirectMessage(
        siteId,
        otherUserId,
        '📷 Foto',
        'image',
        clientId,
        [uploadedUrl]
      );

    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível enviar a imagem: ' + (error?.message || ''));
    } finally {
      setSending(false);
    }
  };



  // Função para selecionar foto da galeria com crop
  const selectPhotoFromGallery = async () => {
    try {
      // Solicitar permissões
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para selecionar fotos.');
        return;
      }

      // Abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permite edição/crop nativo
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await handleSendImage(imageUri);
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto');
    }
  };

  // Função para selecionar vídeo da galeria
  const selectVideoFromGallery = async () => {
    try {
      // Solicitar permissões
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para selecionar vídeos.');
        return;
      }

      // Abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true, // Permite edição nativa
        videoMaxDuration: 60, // 60 segundos máximo
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        await handleSendImage(videoUri);
      }
    } catch (error) {
      console.error('Erro ao selecionar vídeo:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o vídeo');
    }
  };

  // Função para selecionar documentos/arquivos
  const selectDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Documento selecionado:', asset);
        
        // Verificar tamanho do arquivo (máximo 10MB)
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Alert.alert('Erro', 'O arquivo é muito grande. Tamanho máximo permitido: 10MB');
          return;
        }

        await handleSendDocument(asset.uri, asset.name || 'documento', asset.mimeType || 'application/octet-stream');
      }
    } catch (error) {
      console.error('Erro ao selecionar documento:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o documento');
    }
  };

  // Função para enviar documento
  const handleSendDocument = async (documentUri: string, fileName: string, mimeType: string) => {
    try {
      setSending(true);
      
      // Upload do documento para o Firebase Storage
      const uploadedUrl = await uploadImageAsync(documentUri, currentUser?.id || '');
      
      const messageText = `📎 ${fileName}`;
      const clientId = createUniqueId();
      const tempId = 'temp-' + clientId;
      
      // Mensagem otimista
      const optimisticMsg: AdminDirectMessage = {
        id: tempId,
        siteId,
        senderId: currentUser?.id || '',
        senderName: currentUser?.name || 'Você',
        senderEmail: currentUser?.email || '',
        recipientId: otherUserId,
        recipientName: otherUserName,
        content: messageText,
        type: 'file',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readBy: [currentUser?.id || ''],
        attachments: [uploadedUrl],
        clientId,
      };

      setPendingMessages((prev) => [...prev, optimisticMsg]);
      setMessages((prev) => sortMessages([...prev, optimisticMsg]));

      await AdminService.sendDirectMessage(
        siteId,
        otherUserId,
        messageText,
        'file',
        clientId,
        [uploadedUrl]
      );

    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível enviar o documento: ' + (error?.message || ''));
    } finally {
      setSending(false);
    }
  };

  // Enviar ao pressionar Enter (sem Shift)
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.shiftKey) {
      e.preventDefault?.();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await AdminService.deleteDirectMessage(messageToDelete);
      setDeleteModalVisible(false);
      setMessageToDelete(null);
      // Atualizar lista de mensagens após exclusão
      const messagesData = await AdminService.getDirectMessages(siteId, otherUserId);
      setMessages(messagesData);
    } catch (error: any) {
      setDeleteModalVisible(false);
      setMessageToDelete(null);
      Alert.alert('Erro', 'Não foi possível excluir a mensagem: ' + (error?.message || ''));
    }
  };

  const cancelDeleteMessage = () => {
    setDeleteModalVisible(false);
    setMessageToDelete(null);
  };

  const formatDate = (createdAt: string | Timestamp | FieldValue | undefined) => {
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

  const renderMessage = ({ item }: { item: AdminDirectMessage }) => {
    const isOwnMessage = currentUser?.id === item.senderId;
    const initial = item.senderName ? item.senderName.charAt(0).toUpperCase() : '?';

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}>
        <View style={styles.messageHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: isOwnMessage ? colors.primary : colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.avatarText, { color: isOwnMessage ? 'white' : colors.text }]}>{initial}</Text>
            </View>
            <View style={styles.messageInfo}>
              <Text style={[styles.senderName, { color: colors.text }]}>
                {isOwnMessage ? 'Você' : item.senderName}
              </Text>
              <Text style={[styles.messageTime, { color: colors.textMuted }]}>
                {formatDate(item.createdAt)}
                {/* Confirmação de leitura */}
                {isOwnMessage && (
                  (() => {
                    if (item.readBy && item.readBy.length === 1 && item.readBy[0] === currentUser?.id) {
                      return <Text style={{ marginLeft: 4, color: colors.textMuted, fontSize: 14 }}>✔️</Text>;
                    }
                    if (item.readBy && item.readBy.includes(item.recipientId)) {
                      if (item.readAt) {
                        return <Text style={{ marginLeft: 4, color: '#2563EB', fontSize: 14 }}>✔✔️</Text>; // azul
                      }
                      return <Text style={{ marginLeft: 4, color: colors.textMuted, fontSize: 14 }}>✔✔️</Text>; // cinza
                    }
                    return null;
                  })()
                )}
              </Text>
            </View>
          </View>
          <View style={styles.messageActions}>
            {isOwnMessage && currentUser && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteMessage(item.id)}
              >
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={[styles.messageBubble, { backgroundColor: isOwnMessage ? colors.primary : colors.surface, borderColor: colors.border }]}>
          {/* Renderizar anexos */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment, index) => {
                // Verificar se é uma imagem ou arquivo
                const isImage = item.type === 'image' || attachment.includes('.jpg') || attachment.includes('.jpeg') || attachment.includes('.png') || attachment.includes('.gif');
                const isFile = item.type === 'file' || !isImage;
                
                if (isImage) {
                  return (
                    <TouchableOpacity key={index} style={styles.attachmentContainer}>
                      <Image
                        source={{ uri: attachment }}
                        style={styles.attachmentImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.fileAttachmentContainer, { backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }]}
                      onPress={() => {
                        // Abrir arquivo (implementar se necessário)
                        console.log('Abrir arquivo:', attachment);
                      }}
                    >
                      <Paperclip size={16} color={isOwnMessage ? 'white' : colors.primary} />
                      <Text style={[styles.fileAttachmentText, { color: isOwnMessage ? 'white' : colors.primary }]}>
                        Arquivo anexado
                      </Text>
                    </TouchableOpacity>
                  );
                }
              })}
            </View>
          )}

          {/* Texto da mensagem */}
          <Text style={[styles.messageText, { color: isOwnMessage ? 'white' : colors.text }]}>
            {item.content || '[Mensagem sem conteúdo]'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }, style]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Carregando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            {otherUserPhotoURL ? (
              <Image
                source={{ uri: otherUserPhotoURL }}
                style={[styles.headerAvatar, { backgroundColor: colors.primary }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.headerAvatarText, { color: 'white' }]}>{otherUserName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.headerUserInfo}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {otherUserName}
              </Text>
              <View style={styles.statusContainer}>
                {otherUserStatus === 'Online' && (
                  <View style={styles.onlineIndicator} />
                )}
                <Text style={[styles.headerSubtitle, { color: colors.text }]}>
                  {otherUserStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <User size={20} color={colors.primary} />
        </View>
      </View>

      {/* Messages List */}
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
      <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        {/* Área de opções (emojis + indicador de chat) */}
        {showOptions && (
          <>
            {/* Emojis sugeridos */}
            <View style={{ flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' }}>
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

            {/* Chat Type Indicator */}
            <View style={[styles.chatTypeIndicator, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
              <User size={16} color={colors.primary} />
              <Text style={[styles.chatTypeText, { color: colors.primary }]}>
                Chat Individual - Enviando para {otherUserName}
              </Text>
            </View>
          </>
        )}

        {/* Campo de mensagem e botões - sempre visíveis */}
        <View style={styles.inputRow}>
          {/* Botões de mídia - sempre visíveis */}
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: colors.primary, marginRight: 8 }]}
            onPress={() => {
               Alert.alert(
                 'Selecionar Mídia',
                 'Escolha uma opção:',
                 [
                   {
                     text: 'Foto - Câmera',
                     onPress: () => openCameraForPhoto(),
                   },
                   {
                     text: 'Vídeo - Câmera',
                     onPress: () => openCameraForVideo(),
                   },
                   {
                     text: 'Foto - Galeria',
                     onPress: () => selectPhotoFromGallery(),
                   },
                   {
                     text: 'Vídeo - Galeria',
                     onPress: () => selectVideoFromGallery(),
                   },
                   {
                     text: 'Cancelar',
                     style: 'cancel',
                   },
                 ]
               );
             }}
          >
            <Camera size={18} color="white" />
          </TouchableOpacity>

          {/* Botão de anexo (clipe de papel) */}
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: colors.primary, marginRight: 8 }]}
            onPress={() => {
              console.log('Attachment button pressed - opening document picker');
              selectDocument();
            }}
            accessibilityLabel="Anexar arquivo"
          >
            <Paperclip size={18} color="white" />
          </TouchableOpacity>

          {/* Botão de emoji movido para a linha de input */}
          <TouchableOpacity
            onPress={() => setShowOptions(!showOptions)}
            style={[styles.mediaButton, { backgroundColor: colors.primary, marginRight: 8 }]}
            accessibilityLabel={showOptions ? 'Esconder opções' : 'Mostrar opções'}
          >
            <Text style={{ fontSize: 18, color: 'white' }}>{showOptions ? '❌' : '😊'}</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.messageInput, {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder={`Digite sua mensagem para ${otherUserName}...`}
            placeholderTextColor={colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            onKeyPress={handleKeyPress}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
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

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteMessage}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Confirmar Exclusão</Text>
            <Text style={[styles.deleteModalText, { color: colors.textSecondary }]}>Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.</Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={cancelDeleteMessage}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton, { backgroundColor: colors.error }]}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerActions: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '100%',
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageBubble: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    maxWidth: '85%',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  chatTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  chatTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerUserInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  attachmentContainer: {
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  fileAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  fileAttachmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Verde para online
  },
});
