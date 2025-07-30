import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Search, MessageCircle, User, Camera, MoreVertical, ArrowLeft, Paperclip } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import { AdminService } from '@/services/AdminService';
import TabBarToggleButton from '@/components/TabBarToggleButton';
import * as ImagePicker from 'expo-image-picker';
import CameraScreen from '@/components/CameraScreen';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  photoURL?: string;
  company?: string;
}

interface ChatSession {
  id: string;
  participants: string[];
  participantNames: string[];
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
}

export default function ChatScreen() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeTab, setActiveTab] = useState<'individual' | 'grupo' | 'novo'>('individual');
  const [selectedChat, setSelectedChat] = useState<{ userId: string; userName: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showCameraEditor, setShowCameraEditor] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{
    uri: string;
    type: 'photo' | 'video';
    width?: number;
    height?: number;
  } | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [appliedFilter, setAppliedFilter] = useState<string>('');
  const [appliedSticker, setAppliedSticker] = useState<string>('');
  const [appliedText, setAppliedText] = useState<string>('');
  const [drawingMode, setDrawingMode] = useState<string>('');
  const [cropMode, setCropMode] = useState<string>('');
  const [showCameraScreen, setShowCameraScreen] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        const role = await AuthService.getUserRole();

        setIsAdmin(role === 'admin');
        setCurrentUser(user);

        if (role !== 'admin') {
          router.replace('/(tabs)');
          return;
        }

        await loadAdmins();
        await loadChatSessions();
        setLoading(false);
      } catch (error) {
        console.error('Erro ao inicializar chat:', error);
        setLoading(false);
      }
    };

    initializeChat();
  }, []);

  const loadAdmins = async () => {
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        const siteAdmins = await AuthService.getAdminsBySite(currentSite.id);
        setAdmins(siteAdmins);
        setFilteredAdmins(siteAdmins);
      }
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
    }
  };

  const loadChatSessions = async () => {
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        const sessions = await AdminService.getChatSessions(currentSite.id);
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões de chat:', error);
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
      setFilteredAdmins(filtered);
    }
  };

  const handleSelectAdmin = (admin: Admin) => {
    setSelectedChat({ userId: admin.id, userName: admin.name });
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
      // Solicitar permissões
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
        return;
      }

      console.log('=== DEBUG: Abrindo câmera diretamente ===');
      
      // Abrir câmera nativa com configurações mínimas para interface completa
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Voltando para a sintaxe original
        allowsEditing: false,
        quality: 1.0, // Qualidade máxima
      });

      console.log('=== DEBUG: Resultado da câmera:', result);
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('=== DEBUG: Mídia capturada:', asset.uri);

        // Determinar tipo de mídia
        const isVideo = asset.type === 'video';
        console.log('=== DEBUG: Tipo de mídia:', isVideo ? 'video' : 'photo');

        // Abrir diretamente o editor (como na imagem)
        console.log('=== DEBUG: Definindo capturedMedia ===');
        setCapturedMedia({
          uri: asset.uri,
          type: isVideo ? 'video' : 'photo',
          width: asset.width,
          height: asset.height,
        });
        console.log('=== DEBUG: Definindo showCameraEditor como true ===');
        setShowCameraEditor(true);
        console.log('=== DEBUG: Estados definidos ===');
      } else {
        console.log('=== DEBUG: Câmera cancelada ou sem assets ===');
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  };

  const takePhotoComplete = async () => {
    try {
      console.log('=== DEBUG: takePhotoComplete iniciada ===');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Voltando para a sintaxe original
        allowsEditing: false, // Sem crop intermediário
        quality: 0.8,
      });

      console.log('=== DEBUG: Resultado da câmera:', result);
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('=== DEBUG: Foto capturada:', asset.uri);

        // Abrir diretamente o editor (como na imagem)
        console.log('=== DEBUG: Definindo capturedMedia ===');
        setCapturedMedia({
          uri: asset.uri,
          type: 'photo',
          width: asset.width,
          height: asset.height,
        });
        console.log('=== DEBUG: Definindo showCameraEditor como true ===');
        setShowCameraEditor(true);
        console.log('=== DEBUG: Estados definidos ===');
      } else {
        console.log('=== DEBUG: Câmera cancelada ou sem assets ===');
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const recordVideo = async () => {
    try {
      console.log('=== DEBUG: recordVideo iniciada ===');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Voltando para a sintaxe original
        allowsEditing: false, // Sem crop intermediário
        quality: 0.8,
        videoMaxDuration: 30,
      });

      console.log('=== DEBUG: Resultado do vídeo:', result);
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('=== DEBUG: Vídeo gravado:', asset.uri);

        // Abrir diretamente o editor (como na imagem)
        console.log('=== DEBUG: Definindo capturedMedia (vídeo) ===');
        setCapturedMedia({
          uri: asset.uri,
          type: 'video',
          width: asset.width,
          height: asset.height,
        });
        console.log('=== DEBUG: Definindo showCameraEditor como true (vídeo) ===');
        setShowCameraEditor(true);
        console.log('=== DEBUG: Estados definidos (vídeo) ===');
      } else {
        console.log('=== DEBUG: Vídeo cancelado ou sem assets ===');
      }
    } catch (error) {
      console.error('Erro ao gravar vídeo:', error);
      Alert.alert('Erro', 'Não foi possível gravar o vídeo.');
    }
  };

  const selectMediaComplete = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Voltando para a sintaxe original
        allowsEditing: false, // Sem crop intermediário
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Mídia selecionada:', asset.uri);

        // Abrir diretamente o editor (como na imagem)
        const isVideo = asset.type === 'video';
        setCapturedMedia({
          uri: asset.uri,
          type: isVideo ? 'video' : 'photo',
          width: asset.width,
          height: asset.height,
        });
        setShowCameraEditor(true);
      }
    } catch (error) {
      console.error('Erro ao selecionar mídia:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a mídia.');
    }
  };

  const handleMoreOptionsPress = () => {
    Alert.alert(
      'Opções',
      'Escolha uma opção:',
      [
        {
          text: '📷 Câmera',
          onPress: () => setShowCameraScreen(true),
        },
        {
          text: '🖼️ Galeria',
          onPress: () => {
            Alert.alert(
              'Galeria',
              'Escolha uma opção:',
              [
                {
                  text: '🖼️ Selecionar Mídia',
                  onPress: () => selectMediaComplete(),
                },
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
              ]
            );
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const closeCameraEditor = () => {
    setShowCameraEditor(false);
    setCapturedMedia(null);
    setMediaCaption('');
    setAppliedFilter('');
    setAppliedSticker('');
    setAppliedText('');
    setDrawingMode('');
    setCropMode('');
  };

  const closeCameraScreen = () => {
    setShowCameraScreen(false);
  };

  const handleCameraCapture = (photoUri: string) => {
     setCapturedMedia({
       uri: photoUri,
       type: 'photo',
     });
     setShowCameraScreen(false);
     setShowCameraEditor(true);
   };

   const sendMediaWithCaption = () => {
    if (!capturedMedia) return;

    const mediaMessage: Message = {
      id: Date.now().toString(),
      text: mediaCaption || (capturedMedia.type === 'video' ? '🎥 Vídeo enviado' : '📷 Foto enviada'),
      sender: currentUser?.id,
      timestamp: new Date().toISOString(),
      isOwn: true,
      isPhoto: true,
      mediaType: capturedMedia.type,
      uri: capturedMedia.uri
    };

    setMessages([...messages, mediaMessage]);
    closeCameraEditor();
  };

  const applyFilter = (filterType: string) => {
    Alert.alert(
      'Filtros',
      'Escolha um filtro:',
      [
        {
          text: 'Normal',
          onPress: () => {
            setAppliedFilter('Normal');
            Alert.alert('Filtro Aplicado', 'Filtro Normal aplicado!');
          },
        },
        {
          text: 'Vintage',
          onPress: () => {
            setAppliedFilter('Vintage');
            Alert.alert('Filtro Aplicado', 'Filtro Vintage aplicado!');
          },
        },
        {
          text: 'Preto e Branco',
          onPress: () => {
            setAppliedFilter('P&B');
            Alert.alert('Filtro Aplicado', 'Filtro P&B aplicado!');
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const addText = () => {
    Alert.prompt(
      'Adicionar Texto',
      'Digite o texto que deseja adicionar:',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Adicionar',
          onPress: (text) => {
            if (text) {
              setAppliedText(text);
              Alert.alert('Texto Adicionado', `Texto "${text}" adicionado à mídia!`);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const addSticker = () => {
    Alert.alert(
      'Adicionar Sticker',
      'Escolha um sticker:',
      [
        {
          text: '😊',
          onPress: () => {
            setAppliedSticker('😊');
            Alert.alert('Sticker Adicionado', 'Sticker 😊 adicionado!');
          },
        },
        {
          text: '👍',
          onPress: () => {
            setAppliedSticker('👍');
            Alert.alert('Sticker Adicionado', 'Sticker 👍 adicionado!');
          },
        },
        {
          text: '❤️',
          onPress: () => {
            setAppliedSticker('❤️');
            Alert.alert('Sticker Adicionado', 'Sticker ❤️ adicionado!');
          },
        },
        {
          text: '🎉',
          onPress: () => {
            setAppliedSticker('🎉');
            Alert.alert('Sticker Adicionado', 'Sticker 🎉 adicionado!');
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const drawOnMedia = () => {
    Alert.alert(
      'Desenhar',
      'Escolha uma cor para desenhar:',
      [
        {
          text: '🖍️ Vermelho',
          onPress: () => {
            setDrawingMode('Vermelho');
            Alert.alert('Desenho Ativado', 'Modo desenho vermelho ativado!');
          },
        },
        {
          text: '🖍️ Azul',
          onPress: () => {
            setDrawingMode('Azul');
            Alert.alert('Desenho Ativado', 'Modo desenho azul ativado!');
          },
        },
        {
          text: '🖍️ Verde',
          onPress: () => {
            setDrawingMode('Verde');
            Alert.alert('Desenho Ativado', 'Modo desenho verde ativado!');
          },
        },
        {
          text: '🖍️ Amarelo',
          onPress: () => {
            setDrawingMode('Amarelo');
            Alert.alert('Desenho Ativado', 'Modo desenho amarelo ativado!');
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const cropMedia = () => {
    Alert.alert(
      'Cortar Mídia',
      'Crop será feito no editor! Use as ferramentas de edição.',
      [
        {
          text: 'OK',
          onPress: () => {},
        },
      ]
    );
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
    const date = new Date(dateString);
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

  const getOtherParticipant = (session: ChatSession) => {
    if (!currentUser) return { id: '', name: '' };

    const currentUserIndex = session.participants.findIndex(id => id === currentUser.id);
    if (currentUserIndex === -1) {
      return {
        id: session.participants[0] || '',
        name: session.participantNames[0] || 'Usuário desconhecido',
      };
    }

    const otherIndex = currentUserIndex === 0 ? 1 : 0;
    return {
      id: session.participants[otherIndex] || '',
      name: session.participantNames[otherIndex] || 'Usuário desconhecido',
    };
  };

  const renderAdminItem = ({ item }: { item: Admin }) => (
    <TouchableOpacity
      style={styles.adminItem}
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
      </View>
      <View style={styles.adminInfo}>
        <Text style={styles.adminName}>{item.name}</Text>
        <Text style={styles.adminRole}>{item.role}</Text>
        {item.company && (
          <Text style={styles.adminCompany}>{item.company}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderChatSession = ({ item }: { item: ChatSession }) => {
    const otherParticipant = getOtherParticipant(item);
    const initials = getInitials(otherParticipant.name);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleSelectAdmin({ id: otherParticipant.id, name: otherParticipant.name, email: '', role: '' })}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: '#F97316' }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{otherParticipant.name}</Text>
            <Text style={styles.chatTime}>
              {item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Nenhuma mensagem'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Carregando chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Se um chat foi selecionado, mostrar a tela de chat individual
  if (selectedChat) {
    // Encontrar o admin selecionado para obter a foto
    const selectedAdmin = admins.find(admin => admin.id === selectedChat.userId);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={handleBackToChatList} style={styles.backButton}>
            <ArrowLeft size={24} color="#F97316" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            {selectedAdmin?.photoURL ? (
              <Image source={{ uri: selectedAdmin.photoURL }} style={styles.chatAvatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#F97316' }]}>
                <Text style={styles.avatarText}>{getInitials(selectedChat.userName)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.chatHeaderName}>{selectedChat.userName}</Text>
              <Text style={styles.chatHeaderStatus}>Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleCameraPress}>
            <Camera size={20} color="#F97316" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleMoreOptionsPress}>
            <MoreVertical size={20} color="#F97316" />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <View style={styles.chatMessagesContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyChatContainer}>
              <Text style={styles.emptyChatText}>
                Inicie uma conversa com {selectedChat.userName}
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[
                  styles.messageContainer,
                  item.isOwn ? styles.ownMessage : styles.otherMessage
                ]}>
                  {item.isPhoto ? (
                    <View style={styles.mediaMessageContainer}>
                      {item.uri ? (
                        <View style={styles.mediaContentContainer}>
                          <Image
                            source={{ uri: item.uri }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                          />
                          {item.mediaType === 'video' && (
                            <View style={styles.videoOverlay}>
                              <Text style={styles.videoIcon}>▶️</Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={styles.mediaIconContainer}>
                          {item.mediaType === 'photo' ? (
                            <Text style={styles.mediaIcon}>📷</Text>
                          ) : item.mediaType === 'video' ? (
                            <Text style={styles.mediaIcon}>🎥</Text>
                          ) : (
                            <Text style={styles.mediaIcon}>🖼️</Text>
                          )}
                        </View>
                      )}
                      <View style={styles.mediaTextContainer}>
                        <Text style={[
                          styles.messageText,
                          item.isOwn ? styles.ownMessageText : styles.otherMessageText
                        ]}>
                          {item.text}
                        </Text>
                        <Text style={styles.messageTime}>
                          {formatTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={[
                        styles.messageText,
                        item.isOwn ? styles.ownMessageText : styles.otherMessageText
                      ]}>
                        {item.text}
                      </Text>
                      <Text style={styles.messageTime}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </>
                  )}
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleCameraPress}
          >
            <Camera size={20} color="#F97316" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handleMoreOptionsPress}
          >
            <Paperclip size={20} color="#F97316" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>

        {/* CameraScreen Component */}
         {showCameraScreen && (
           <CameraScreen
             visible={showCameraScreen}
             onClose={closeCameraScreen}
             onPhotoTaken={handleCameraCapture}
           />
         )}

        {/* Editor da Câmera (como WhatsApp) */}
        {console.log('=== DEBUG: Renderizando editor, showCameraEditor =', showCameraEditor, 'capturedMedia =', capturedMedia)}
        {showCameraEditor && capturedMedia && (
          <View style={styles.cameraEditorOverlay}>
            {/* Top Toolbar */}
            <View style={styles.cameraEditorToolbar}>
              <TouchableOpacity style={styles.toolbarButton} onPress={closeCameraEditor}>
                <Text style={styles.toolbarIcon}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <Text style={styles.toolbarIcon}>HD ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarButton, cropMode && styles.toolbarButtonActive]}
                onPress={cropMedia}
              >
                <Text style={styles.toolbarIcon}>⏹️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarButton, appliedSticker && styles.toolbarButtonActive]}
                onPress={addSticker}
              >
                <Text style={styles.toolbarIcon}>😊</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarButton, appliedText && styles.toolbarButtonActive]}
                onPress={addText}
              >
                <Text style={styles.toolbarIcon}>T</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarButton, drawingMode && styles.toolbarButtonActive]}
                onPress={drawOnMedia}
              >
                <Text style={styles.toolbarIcon}>✏️</Text>
              </TouchableOpacity>
            </View>

            {/* Media Preview */}
            <View style={styles.cameraEditorPreview}>
              {capturedMedia.type === 'video' ? (
                <View style={styles.videoPreviewContainer}>
                  <Text style={styles.videoPreviewIcon}>🎥</Text>
                  <Text style={styles.videoPreviewText}>Vídeo Capturado</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: capturedMedia.uri }}
                  style={styles.cameraEditorImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Bottom Controls */}
            <View style={styles.cameraEditorBottom}>
              <TouchableOpacity
                style={[styles.filterButton, appliedFilter && styles.filterButtonActive]}
                onPress={() => applyFilter()}
              >
                <Text style={styles.filterText}>
                  {appliedFilter ? `Filtros (${appliedFilter})` : 'Filtros'}
                </Text>
              </TouchableOpacity>

              <View style={styles.captionContainer}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Adicione uma legenda..."
                  placeholderTextColor="#9CA3AF"
                  value={mediaCaption}
                  onChangeText={setMediaCaption}
                  multiline
                />
              </View>

              <View style={styles.sendInfoContainer}>
                <Text style={styles.sendInfoText}>Eu (você)</Text>
                <TouchableOpacity style={styles.sendButton} onPress={sendMediaWithCaption}>
                  <Text style={styles.sendButtonIcon}>➤</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar administradores..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchMenuButton}>
          <TabBarToggleButton variant="minimal" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'individual' && styles.activeTab]}
          onPress={() => setActiveTab('individual')}
        >
          <User size={16} color={activeTab === 'individual' ? '#F97316' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'individual' && styles.activeTabText]}>
            Individual
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grupo' && styles.activeTab]}
          onPress={() => setActiveTab('grupo')}
        >
          <MessageCircle size={16} color={activeTab === 'grupo' ? '#F97316' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'grupo' && styles.activeTabText]}>
            Grupo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'novo' && styles.activeTab]}
          onPress={() => setActiveTab('novo')}
        >
          <MessageCircle size={16} color={activeTab === 'novo' ? '#F97316' : '#F97316'} />
          <Text style={[styles.tabText, activeTab === 'novo' && styles.activeTabText]}>
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
                <MessageCircle size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Nenhuma conversa encontrada</Text>
                <Text style={styles.emptySubtitle}>
                  Use o botão "Novo Chat" para iniciar uma conversa individual
                </Text>
              </View>
            }
          />
        )}

        {activeTab === 'grupo' && (
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Chat em Grupo</Text>
            <Text style={styles.emptySubtitle}>
              Funcionalidade de chat em grupo em desenvolvimento
            </Text>
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
                <User size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Nenhum administrador encontrado</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Tente uma busca diferente' : 'Não há administradores disponíveis'}
                </Text>
              </View>
            }
          />
        )}
      </View>

    </SafeAreaView>
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
  searchMenuButton: {
    marginLeft: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
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
    marginTop: 4,
    textAlign: 'right',
  },
  mediaMessageContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaContentContainer: {
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: 200,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoIcon: {
    fontSize: 48,
  },
  mediaIconContainer: {
    padding: 20,
    alignItems: 'center',
  },
  mediaIcon: {
    fontSize: 48,
  },
  mediaTextContainer: {
    padding: 12,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  mediaButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
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
  sendButton: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  videoPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  videoPreviewIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoPreviewText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  toolbarButtonActive: {
    backgroundColor: '#F97316',
  },
});
