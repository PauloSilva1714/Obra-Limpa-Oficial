import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Search, MessageCircle, User, Camera, MoreVertical, ArrowLeft, Paperclip, Send, Smile, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import { AdminService } from '@/services/AdminService';
import { useTheme } from '@/contexts/ThemeContext';

import AdminDirectChat from '@/components/AdminDirectChat';
import * as ImagePicker from 'expo-image-picker';
import CameraScreen from '../../components/CameraScreen';
import { Video } from 'expo-av';
import { Timestamp, FieldValue } from 'firebase/firestore';

// Componente VideoPlayer personalizado
const VideoPlayer = ({ source, style, filter, getFilterStyle }: {
  source: { uri: string };
  style: any;
  filter?: string;
  getFilterStyle: (filter: string | null) => any;
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        }
    }
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
    setTimeout(() => {
      if (showControls) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleVideoPress}
      style={styles.videoTouchableWrapper}
    >
      <Video
        ref={videoRef}
        source={source}
        style={style}
        useNativeControls={false}
        resizeMode="cover"
        shouldPlay={isPlaying}
        isLooping={false}
        volume={1.0}
        isMuted={false}
        usePoster={false}
      />

      {/* Controles customizados */}
      {showControls && (
        <View style={styles.videoControlsOverlay}>
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={togglePlayPause}
          >
            <Text style={styles.playPauseIcon}>
              {isPlaying ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overlay do filtro para vídeo */}
      {filter && filter !== 'Normal' && (
        <View
          style={[
            styles.filterOverlay,
            getFilterStyle(filter),
            { pointerEvents: 'none' }
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  photoURL?: string;
  company?: string;
  isOnline?: boolean;
  lastSeen?: string;
  lastActivity?: string;
}

interface ChatSession {
  id: string;
  participants: string[];
  participantNames: string[];
  participantPhotos?: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  isPhoto?: boolean;
  mediaType?: 'photo' | 'video' | 'gallery';
  uri?: string;
  edits?: {
    filter: string | null;
    texts: Array<{
      id: string;
      text: string;
      x: number;
      y: number;
      color: string;
      size: number;
    }>;
    emojis: Array<{
      id: string;
      emoji: string;
      x: number;
      y: number;
    }>;
    stickers: Array<{
      id: string;
      sticker: string;
      x: number;
      y: number;
    }>;
  };
}

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [lastMessages, setLastMessages] = useState<{[key: string]: {message: string, time: string}}>({});

  // Estados para chat em grupo
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [groupMessageText, setGroupMessageText] = useState('');
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'grupo' | 'novo'>('individual');
  const [selectedChat, setSelectedChat] = useState<{ userId: string; userName: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showCameraScreen, setShowCameraScreen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');

  // Estado para status online dos administradores
  const [adminOnlineStatus, setAdminOnlineStatus] = useState<{[key: string]: {isOnline: boolean, lastSeen?: string, lastActivity?: string}}>({});

  // Ref para o FlatList do chat de grupo
  const groupMessagesFlatListRef = useRef<FlatList>(null);

  // Array de emojis disponíveis
  const EMOJIS = ['😊', '😂', '❤️', '👍', '🎉', '😎', '😢', '🔥', '💯', '❤️'];

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        const role = await AuthService.getUserRole();

        setIsAdmin(role === 'admin');
        setCurrentUser(user);

        if (role !== 'admin') {
          router.replace('/(worker-tabs)');
          return;
        }

        await loadAdmins(user);
        await loadChatSessions();

        // Iniciar monitoramento de presença
        await AuthService.startPresenceMonitoring();

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Carregar mensagens de grupo quando a aba for selecionada
  useEffect(() => {
    if (activeTab === 'grupo') {
      loadGroupMessages();
    }
  }, [activeTab]);

  // Carregar últimas mensagens quando a aba "novo" for selecionada
  useEffect(() => {
    const loadMessagesForNewChatTab = async () => {
      if (activeTab === 'novo' && admins.length > 0 && currentUser) {
        try {
          const currentSite = await AuthService.getCurrentSite();
          if (currentSite) {
            await loadLastMessages(currentSite.id, admins);
          }
        } catch (error) {
          }
      }
    };

    loadMessagesForNewChatTab();
  }, [activeTab, admins.length, currentUser?.id]);

  // Rolar para o final do chat de grupo quando as mensagens forem carregadas
  useEffect(() => {
    if (groupMessagesFlatListRef.current && groupMessages.length > 0 && !loadingGroupMessages) {
      groupMessagesFlatListRef.current.scrollToEnd({ animated: true });
    }
  }, [groupMessages.length, loadingGroupMessages]);

  // Rolar para o final quando uma nova mensagem for enviada
  useEffect(() => {
    if (groupMessagesFlatListRef.current && groupMessages.length > 0) {
      setTimeout(() => {
        groupMessagesFlatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [groupMessages.length]);

  // Atualizar status online periodicamente
  useEffect(() => {
    if (activeTab === 'novo' && admins.length > 0) {
      const interval = setInterval(() => {
        loadAdminOnlineStatus(admins);
      }, 30000); // Atualizar a cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [activeTab, admins.length]);

  const loadAdmins = async (user: any) => {
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        const allAdmins = await AuthService.getAdminsBySite(currentSite.id);

        // Filtrar o usuário atual da lista - versão mais robusta
        let filteredAdmins = allAdmins;
        if (user && user.id) {
          filteredAdmins = allAdmins.filter(admin => {
            const shouldInclude = admin.id !== user.id;
            : ${shouldInclude ? 'INCLUÍDO' : 'FILTRADO'}`);
            return shouldInclude;
          });

          // Verificação adicional para garantir que o usuário atual não está na lista
          const currentUserInList = filteredAdmins.find(admin => admin.id === user.id);
          if (currentUserInList) {
            filteredAdmins = filteredAdmins.filter(admin => admin.id !== user.id);
          }
        }

        ));

        setAdmins(filteredAdmins);
        setFilteredAdmins(filteredAdmins);

        // Buscar última mensagem de cada administrador
        await loadLastMessages(currentSite.id, filteredAdmins);

        // Carregar status online dos administradores
        await loadAdminOnlineStatus(filteredAdmins);
      }
    } catch (error) {
      }
  };

  const loadLastMessages = async (siteId: string, adminsList: Admin[]) => {
    try {
      // Usar o mesmo método que a aba Individual - buscar sessões de chat
      const sessions = await AdminService.getChatSessions(siteId);
      const messagesMap: {[key: string]: {message: string, time: string}} = {};

      for (const admin of adminsList) {
        if (admin.id !== currentUser?.id) {
          // Procurar a sessão de chat correspondente a este admin
          const session = sessions.find(s =>
            s.participants.includes(admin.id) && s.participants.includes(currentUser?.id || '')
          );

          if (session && session.lastMessage) {
            messagesMap[admin.id] = {
              message: session.lastMessage,
              time: session.lastMessageTime || new Date().toISOString()
            };
          }
        }
      }

      setLastMessages(messagesMap);
    } catch (error) {
      }
  };

  const loadAdminOnlineStatus = async (adminsList: Admin[]) => {
    try {
      const statusMap: {[key: string]: {isOnline: boolean, lastSeen?: string, lastActivity?: string}} = {};

      for (const admin of adminsList) {
        if (admin.id !== currentUser?.id) {
          try {
            const status = await AuthService.getUserOnlineStatus(admin.id);
            statusMap[admin.id] = status;
            } catch (error) {
            statusMap[admin.id] = { isOnline: false };
          }
        }
      }

      setAdminOnlineStatus(statusMap);
      .length);
    } catch (error) {
      }
  };

  const loadChatSessions = async () => {
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        const sessions = await AdminService.getChatSessions(currentSite.id);

        // Buscar informações completas dos participantes para incluir fotos
        const sessionsWithPhotos = await Promise.all(
          sessions.map(async (session) => {
            const participantPhotos: string[] = [];

            for (const participantId of session.participants) {
              try {
                const user = await AuthService.getUserById(participantId);
                participantPhotos.push(user?.photoURL || '');
              } catch (error) {
                participantPhotos.push('');
              }
            }

            return {
              ...session,
              participantPhotos
            };
          })
        );

        setChatSessions(sessionsWithPhotos);
      }
    } catch (error) {
      }
  };

  // Funções para chat em grupo
    const loadGroupMessages = async () => {
    try {
      setLoadingGroupMessages(true);
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        const messages = await AdminService.getMessages(currentSite.id);
        // Log detalhado das mensagens
        messages.forEach((msg, index) => {
          });

        // Ordenar mensagens por data (mais recentes primeiro)
        const sortedMessages = messages.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });

        setGroupMessages(sortedMessages);
      } else {
        }
    } catch (error) {
      } finally {
      setLoadingGroupMessages(false);
    }
  };

  const sendGroupMessage = async () => {
    if (!groupMessageText.trim()) return;

    );

    try {
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        const result = await AdminService.sendMessage(
          currentSite.id,
          groupMessageText.trim(),
          'general',
          'medium'
        );

        setGroupMessageText('');
        // Recarregar mensagens após enviar
        await loadGroupMessages();
        } else {
        }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
    }
  };

  // Função para enviar imagem no chat de grupo
  const handleSendGroupImage = async (imageUrl: string) => {
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        await AdminService.sendMessage(
          currentSite.id,
          '', // Sem texto
          'image', // Tipo imagem
          'medium',
          undefined,
          [imageUrl]
        );
        await loadGroupMessages();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a imagem.');
    }
  };

  // Função para enviar vídeo no chat de grupo
  const handleSendGroupVideo = async (videoUrl: string) => {
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        await AdminService.sendMessage(
          currentSite.id,
          '🎥 Vídeo', // Texto para vídeo
          'video', // Tipo vídeo
          'medium',
          undefined,
          [videoUrl]
        );
        await loadGroupMessages();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar o vídeo.');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredAdmins(admins);
    } else {
      const filtered = admins.filter(admin =>
        admin.name.toLowerCase().includes(query.toLowerCase()) ||
        admin.email.toLowerCase().includes(query.toLowerCase())
      );

      ));

      // Garantir que o usuário atual não está na lista de busca
      const finalFiltered = filtered.filter(admin => admin.id !== currentUser?.id);
      ));

      setFilteredAdmins(finalFiltered);
    }
  };

  const handleSelectAdmin = (admin: Admin) => {
    setSelectedChat({ userId: admin.id, userName: admin.name });
  };

  const getFilterStyle = (filterName: string | null) => {
    if (!filterName || filterName === 'Normal') return {};

    switch (filterName) {
      case 'Vintage':
        return {
          backgroundColor: 'rgba(244, 164, 96, 0.3)',
          opacity: 0.9
        };
      case 'B&W':
        return {
          backgroundColor: 'rgba(128, 128, 128, 0.5)',
          opacity: 0.8
        };
      case 'Sepia':
        return {
          backgroundColor: 'rgba(222, 184, 135, 0.4)',
          opacity: 0.9
        };
      case 'Vivid':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          opacity: 1
        };
      case 'Cool':
        return {
          backgroundColor: 'rgba(135, 206, 235, 0.3)',
          opacity: 0.9
        };
      default:
        return {};
    }
  };

  const renderEditOverlays = (edits: any) => {
    if (!edits) return null;

    return (
      <View style={styles.editOverlaysContainer}>
        {/* Renderizar textos */}
        {edits.texts?.map((textItem: any) => (
          <Text
            key={textItem.id}
            style={[
              styles.overlayText,
              {
                position: 'absolute',
                left: textItem.x,
                top: textItem.y,
                color: textItem.color,
                fontSize: textItem.size,
              }
            ]}
          >
            {textItem.text}
          </Text>
        ))}

        {/* Renderizar emojis */}
        {edits.emojis?.map((emojiItem: any) => (
          <Text
            key={emojiItem.id}
            style={[
              styles.overlayEmoji,
              {
                position: 'absolute',
                left: emojiItem.x,
                top: emojiItem.y,
              }
            ]}
          >
            {emojiItem.emoji}
          </Text>
        ))}

        {/* Renderizar stickers */}
        {edits.stickers?.map((stickerItem: any) => (
          <Text
            key={stickerItem.id}
            style={[
              styles.overlaySticker,
              {
                position: 'absolute',
                left: stickerItem.x,
                top: stickerItem.y,
              }
            ]}
          >
            {stickerItem.sticker}
          </Text>
        ))}
      </View>
    );
  };

  const sendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        sender: currentUser?.id,
        timestamp: new Date().toISOString(),
        isOwn: true
      };
      setMessages([...messages, newMessage]);
      setMessageText('');
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissões Necessárias',
        'Precisamos de permissão para acessar a câmera e galeria para enviar fotos e vídeos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleCameraPress = async () => {
    const hasPermissions = await requestPermissions();

    if (!hasPermissions) {
      return;
    }

    // Abrir CameraScreen com interface completa
    setShowCameraScreen(true);
  };

  const openCameraDirectly = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Sintaxe correta
        allowsEditing: false,
        quality: 1.0, // Qualidade máxima
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Determinar tipo de mídia
        const isVideo = asset.type === 'video';
        // Enviar mídia diretamente sem abrir modal
        const mediaMessage: Message = {
          id: Date.now().toString(),
          text: '',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: isVideo ? 'video' : 'photo',
          uri: asset.uri
        };

        setMessages([...messages, mediaMessage]);
      } else {
        }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  };

  const takePhotoComplete = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Sintaxe correta
        allowsEditing: false, // Sem crop intermediário
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Enviar foto diretamente sem abrir modal
        const mediaMessage: Message = {
          id: Date.now().toString(),
          text: '',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: 'photo',
          uri: asset.uri
        };

        setMessages([...messages, mediaMessage]);
      } else {
        }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const recordVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Sintaxe correta
        allowsEditing: false, // Sem crop intermediário
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Enviar vídeo diretamente sem abrir modal
        const mediaMessage: Message = {
          id: Date.now().toString(),
          text: '',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: 'video',
          uri: asset.uri
        };

        setMessages([...messages, mediaMessage]);
      } else {
        }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gravar o vídeo.');
    }
  };

  const selectMediaComplete = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Enviar mídia diretamente sem abrir modal
        const isVideo = asset.type === 'video';
        if (isVideo) {
          // (mantém lógica de vídeo se necessário)
        } else {
          // Enviar imagem corretamente para o grupo
          await handleSendGroupImage(asset.uri);
        }
      } else {
        }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a mídia.');
    }
  };

  const handleMoreOptionsPress = () => {
    // Modal removido - função não faz nada
  };

  const handleBackToChatList = () => {
    setSelectedChat(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Agora';

    const date = new Date(dateString);

    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Agora';
    }

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffInMinutes < 1) return 'Agora';
      return `${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Função para formatar data/hora relativa (igual ao chat individual)
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

  const getOtherParticipant = (session: ChatSession) => {
    if (!currentUser) return { id: '', name: '', photoURL: '' };

    const currentUserIndex = session.participants.findIndex(id => id === currentUser.id);
    if (currentUserIndex === -1) {
      return {
        id: session.participants[0] || '',
        name: session.participantNames[0] || 'Usuário desconhecido',
        photoURL: session.participantPhotos?.[0] || '',
      };
    }

    const otherIndex = currentUserIndex === 0 ? 1 : 0;
    return {
      id: session.participants[otherIndex] || '',
      name: session.participantNames[otherIndex] || 'Usuário desconhecido',
      photoURL: session.participantPhotos?.[otherIndex] || '',
    };
  };

  const renderAdminItem = ({ item }: { item: Admin }) => {
    const lastMessage = lastMessages[item.id];
    const onlineStatus = adminOnlineStatus[item.id];

    // Log de debug para verificar se está renderizando o usuário atual
    - É usuário atual? ${item.id === currentUser?.id}`);

    // Formatar status online
    const getOnlineStatusText = () => {
      if (!onlineStatus) return 'Offline';

      if (onlineStatus.isOnline) {
        return 'Online';
      }

      return AuthService.formatOnlineStatus(onlineStatus);
    };

    const getOnlineStatusColor = () => {
      if (!onlineStatus) return '#9CA3AF';

      if (onlineStatus.isOnline) {
        return '#10B981'; // Verde para online
      }

      return '#9CA3AF'; // Cinza para offline
    };

    return (
      <TouchableOpacity
        style={[styles.adminItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        onPress={() => handleSelectAdmin(item)}
      >
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#F97316' }]}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
          )}
          {/* Indicador de status online */}
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: getOnlineStatusColor() }
          ]} />
        </View>
        <View style={styles.adminInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.adminName, { color: colors.text }]}>{item.name}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              {lastMessage ? (
                <Text style={[styles.timeText, { color: colors.textMuted }]}>
                  {formatTime(lastMessage.time)}
                </Text>
              ) : (
                <Text style={[styles.timeText, { color: colors.textMuted }]}>Agora</Text>
              )}
              <Text style={[styles.onlineStatusText, { color: getOnlineStatusColor() }]}>
                {getOnlineStatusText()}
              </Text>
            </View>
          </View>
          {lastMessage ? (
            <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1}>
              {lastMessage.message}
            </Text>
          ) : (
            <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1}>
              Iniciar conversa
            </Text>
          )}
          {item.company && (
            <Text style={[styles.adminCompany, { color: colors.textSecondary }]}>{item.company}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === currentUser?.id;

    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}

        {/* Renderizar anexos de mídia */}
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {item.attachments.map((attachment: string, index: number) => {
              // Verificar tipo de mídia baseado no tipo da mensagem e extensão do arquivo
              const isImage = item.type === 'image' || attachment.includes('.jpg') || attachment.includes('.jpeg') || attachment.includes('.png') || attachment.includes('.gif');
              const isVideo = item.type === 'video' || attachment.includes('.mp4') || attachment.includes('.mov') || attachment.includes('.avi');

              if (isImage) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={{ marginBottom: 8 }}
                    onPress={() => {
                      setCurrentImageUrl(attachment);
                      setImageModalVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: attachment }}
                      style={{ width: 200, height: 150, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              } else if (isVideo) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.videoAttachmentContainer}
                    onPress={() => {
                      setCurrentVideoUrl(attachment);
                      setVideoModalVisible(true);
                    }}
                  >
                    <View style={styles.videoThumbnail}>
                      <View style={styles.videoPlayButton}>
                        <Text style={styles.videoPlayIcon}>▶</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }
              return null;
            })}
          </View>
        )}

        {/* Texto da mensagem - não exibir quando for imagem */}
        {item.content && item.type !== 'image' && (
          <Text style={styles.messageText}>{item.content}</Text>
        )}
        <Text style={styles.messageTime}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  const renderChatSession = ({ item }: { item: ChatSession }) => {
    const otherParticipant = getOtherParticipant(item);
    const initials = getInitials(otherParticipant.name);

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        onPress={() => handleSelectAdmin({ id: otherParticipant.id, name: otherParticipant.name, email: '', role: '' })}
      >
        <View style={styles.avatarContainer}>
          {otherParticipant.photoURL ? (
            <Image source={{ uri: otherParticipant.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.text }]}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>{otherParticipant.name}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {item.lastMessageTime ? formatTime(item.lastMessageTime) : 'Agora'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1}>
              {item.lastMessage || 'Nenhuma mensagem'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadText, { color: colors.text }]}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
      return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primary }]}>Carregando chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Se um chat foi selecionado, mostrar a tela de chat individual usando AdminDirectChat
  if (selectedChat) {
    return (
      <AdminDirectChat
        siteId={currentUser?.siteId || ''}
        otherUserId={selectedChat.userId}
        otherUserName={selectedChat.userName}
        onBack={handleBackToChatList}
        style={styles.container}
      />
    );
  }

  // Manter o resto do código de câmera para não quebrar funcionalidades existentes
  // Modal de edição de imagem removido - não será mais usado

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Pesquisar administradores..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'individual' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('individual')}
          >
            <User size={16} color={activeTab === 'individual' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'individual' ? '#FFFFFF' : colors.textMuted }]}>
              Individual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grupo' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('grupo')}
          >
            <Users size={16} color={activeTab === 'grupo' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'grupo' ? '#FFFFFF' : colors.textMuted }]}>
              Grupo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'novo' && { backgroundColor: colors.primary }]}
            onPress={async () => {
               setActiveTab('novo');

               // Recarregar as últimas mensagens quando a aba "novo" for selecionada
               if (admins.length > 0 && currentUser) {
                 try {
                   const currentSite = await AuthService.getCurrentSite();
                   if (currentSite) {
                     await loadLastMessages(currentSite.id, admins);
                   }
                 } catch (error) {
                   }
               }
             }}
          >
            <MessageCircle size={16} color={activeTab === 'novo' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'novo' ? '#FFFFFF' : colors.textMuted }]}>
              Novo Chat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
        {activeTab === 'individual' && (
          <FlatList
            data={chatSessions}
            renderItem={renderChatSession}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MessageCircle size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma conversa encontrada</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  Use o botão "Novo Chat" para iniciar uma conversa individual
                </Text>
              </View>
            }
          />
        )}

        {activeTab === 'grupo' && (
          <View style={[styles.groupChatContainer, { backgroundColor: colors.background }]}>
            {loadingGroupMessages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.primary }]}>Carregando mensagens...</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={groupMessages}
                  renderItem={renderGroupMessage}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <MessageCircle size={48} color={colors.textMuted} />
                      <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma mensagem ainda</Text>
                      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                        Seja o primeiro a enviar uma mensagem para o grupo!
                      </Text>
                    </View>
                  }
                  ref={groupMessagesFlatListRef}
                />

                {/* Input de mensagem */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.mediaButton}
                      onPress={() => {
                        Alert.alert(
                          'Selecionar Mídia',
                          'Escolha uma opção:',
                          [
                            {
                              text: 'Foto - Câmera',
                              onPress: async () => {
                                try {
                                  const { status } = await ImagePicker.requestCameraPermissionsAsync();
                                  if (status !== 'granted') {
                                    Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para tirar fotos.');
                                    return;
                                  }

                                  const result = await ImagePicker.launchCameraAsync({
                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                    allowsEditing: true,
                                    aspect: [4, 3],
                                    quality: 0.8,
                                  });

                                  if (!result.canceled && result.assets && result.assets[0]) {
                                    await handleSendGroupImage(result.assets[0].uri);
                                  }
                                } catch (error) {
                                  Alert.alert('Erro', 'Não foi possível tirar a foto.');
                                }
                              },
                            },
                            {
                              text: 'Vídeo - Câmera',
                              onPress: async () => {
                                try {
                                  const { status } = await ImagePicker.requestCameraPermissionsAsync();
                                  if (status !== 'granted') {
                                    Alert.alert('Permissão necessária', 'É necessário permitir o acesso à câmera para gravar vídeos.');
                                    return;
                                  }

                                  const result = await ImagePicker.launchCameraAsync({
                                    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                                    allowsEditing: true,
                                    videoMaxDuration: 60,
                                    quality: 0.8,
                                  });

                                  if (!result.canceled && result.assets && result.assets[0]) {
                                    // Enviar vídeo para o grupo
                                    await handleSendGroupVideo(result.assets[0].uri);
                                  }
                                } catch (error) {
                                  Alert.alert('Erro', 'Não foi possível gravar o vídeo.');
                                }
                              },
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

                    <TouchableOpacity style={styles.mediaButton} onPress={selectMediaComplete}>
                      <Paperclip size={18} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.mediaButton} onPress={() => setShowOptions(!showOptions)}>
                      <Text style={{ fontSize: 18, color: 'white' }}>😊</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={styles.messageInput}
                      placeholder="Digite sua mensagem..."
                      placeholderTextColor="#9CA3AF"
                      value={groupMessageText}
                      onChangeText={setGroupMessageText}
                      multiline
                      maxLength={500}
                      blurOnSubmit={false}
                      returnKeyType="default"
                      textAlignVertical="center"
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, !groupMessageText.trim() && styles.sendButtonDisabled]}
                      onPress={sendGroupMessage}
                      disabled={!groupMessageText.trim()}
                    >
                      <Send size={20} color="white" />
                    </TouchableOpacity>
                  </View>

                  {/* Lista de emojis */}
                  {showOptions && (
                    <View style={styles.emojiContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {EMOJIS.map((emoji, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.emojiButton}
                            onPress={() => {
                              setGroupMessageText(prev => prev + emoji);
                              setShowOptions(false);
                            }}
                          >
                            <Text style={styles.emojiText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'novo' && (
          <FlatList
            data={filteredAdmins}
            renderItem={renderAdminItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <User size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum administrador encontrado</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {searchQuery ? 'Tente uma busca diferente' : 'Não há administradores disponíveis'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal de visualização de imagem em tela cheia */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              zIndex: 2,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 20,
              padding: 8,
            }}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: currentImageUrl }}
            style={{ width: '95%', height: '80%', borderRadius: 12 }}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Modal de visualização de vídeo em tela cheia */}
      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              zIndex: 2,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 20,
              padding: 8,
            }}
            onPress={() => setVideoModalVisible(false)}
          >
            <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
          </TouchableOpacity>

          {currentVideoUrl.includes('.mp4') || currentVideoUrl.includes('.mov') || currentVideoUrl.includes('.avi') ? (
            Platform.OS === 'web' ? (
              <video
                src={currentVideoUrl}
                controls
                autoPlay
                style={{
                  width: '95%',
                  height: '80%',
                  borderRadius: 12,
                }}
              />
            ) : (
              <Video
                source={{ uri: currentVideoUrl }}
                style={{ width: '95%', height: '80%', borderRadius: 12 }}
                useNativeControls
                shouldPlay
                isLooping={false}
                resizeMode="contain"
              />
            )
          ) : (
            <Image
              source={{ uri: currentVideoUrl }}
              style={{ width: '95%', height: '80%', borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F97316',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F97316',
  },
  tabText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerButton: {
    padding: 8,
  },
  chatMessagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  messageContainer: {
    marginVertical: 2,
    maxWidth: '90%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
  },
  ownMessageText: {
    backgroundColor: '#F97316',
    color: '#FFFFFF',
  },
  otherMessageText: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'right',
  },
  mediaMessageContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    overflow: 'hidden',
    width: 280,
    height: 280,
  },
  mediaContentContainer: {
    position: 'relative',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaImage: {
    width: 280,
    height: 280,
  },

  mediaIconContainer: {
    padding: 10,
    alignItems: 'center',
  },
  mediaIcon: {
    fontSize: 32,
  },
  mediaTextContainer: {
    padding: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    padding: 15,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    lineHeight: 20,
  },

  sendButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraEditorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  cameraEditorToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  toolbarButton: {
    padding: 10,
  },
  toolbarIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  cameraEditorPreview: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 20,
  },
  cameraEditorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  cameraEditorBottom: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  filterButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonActive: {
    backgroundColor: '#F97316',
  },
  captionContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  sendInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sendInfoText: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  sendButtonIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },

  toolbarButtonActive: {
    backgroundColor: '#F97316',
  },
  editOverlaysContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  overlayEmoji: {
    fontSize: 32,
  },
  overlaySticker: {
    fontSize: 40,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
  },
  videoTouchableWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playPauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    fontSize: 24,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
    marginTop: 2,
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  onlineStatusText: {
    fontSize: 11,
    marginTop: 2,
  },
  // Estilos para chat em grupo
  groupChatContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#F97316',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  sendButton: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  adminInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  // Estilos para anexos de mídia
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
  videoAttachmentContainer: {
    marginBottom: 4,
  },
  videoThumbnail: {
    width: 200,
    height: 150,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  videoPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  adminCompany: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emojiContainer: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
  },
  emojiButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#4B5563',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
});
