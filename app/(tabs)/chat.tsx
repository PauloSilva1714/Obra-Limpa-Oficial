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
import { Search, MessageCircle, User, Camera, MoreVertical, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import { AdminService } from '@/services/AdminService';
import TabBarToggleButton from '@/components/TabBarToggleButton';
import * as ImagePicker from 'expo-image-picker';

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
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showGalleryOptions, setShowGalleryOptions] = useState(false);

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

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
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
    console.log('=== DEBUG: handleCameraPress iniciada ===');
    console.log('selectedChat:', selectedChat);

    const hasPermissions = await requestPermissions();
    console.log('hasPermissions:', hasPermissions);

    if (!hasPermissions) {
      console.log('=== DEBUG: Permissões negadas ===');
      return;
    }

    // Abrir modal moderno diretamente
    console.log('=== DEBUG: Definindo showPhotoOptions como true ===');
    setShowPhotoOptions(true);
    console.log('=== DEBUG: showPhotoOptions definido ===');
  };

  const takePhotoComplete = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoMessage = {
          id: Date.now().toString(),
          text: '📷 Foto enviada',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: 'photo',
          uri: result.assets[0].uri
        };
        setMessages([...messages, photoMessage]);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    }
    setShowPhotoOptions(false);
  };

  const takePhotoCropped = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoMessage = {
          id: Date.now().toString(),
          text: '📷 Foto enviada',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: 'photo',
          uri: result.assets[0].uri
        };
        setMessages([...messages, photoMessage]);
      }
    } catch (error) {
      console.error('Erro ao tirar foto cortada:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    }
    setShowPhotoOptions(false);
  };

  const recordVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 30, // 30 segundos máximo
      });

      if (!result.canceled && result.assets[0]) {
        const videoMessage = {
          id: Date.now().toString(),
          text: '🎥 Vídeo enviado',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: 'video',
          uri: result.assets[0].uri
        };
        setMessages([...messages, videoMessage]);
      }
    } catch (error) {
      console.error('Erro ao gravar vídeo:', error);
      Alert.alert('Erro', 'Não foi possível gravar o vídeo. Tente novamente.');
    }
    setShowPhotoOptions(false);
  };

  const selectMediaComplete = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const isVideo = result.assets[0].type === 'video';
        const galleryMessage = {
          id: Date.now().toString(),
          text: isVideo ? '🎥 Vídeo da galeria' : '🖼️ Imagem da galeria',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: isVideo ? 'video' : 'gallery',
          uri: result.assets[0].uri
        };
        setMessages([...messages, galleryMessage]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a mídia. Tente novamente.');
    }
    setShowGalleryOptions(false);
  };

  const selectMediaCropped = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const isVideo = result.assets[0].type === 'video';
        const galleryMessage = {
          id: Date.now().toString(),
          text: isVideo ? '🎥 Vídeo da galeria' : '🖼️ Imagem da galeria',
          sender: currentUser?.id,
          timestamp: new Date().toISOString(),
          isOwn: true,
          isPhoto: true,
          mediaType: isVideo ? 'video' : 'gallery',
          uri: result.assets[0].uri
        };
        setMessages([...messages, galleryMessage]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a mídia. Tente novamente.');
    }
    setShowGalleryOptions(false);
  };

  const handleMoreOptionsPress = () => {
    Alert.alert(
      'Opções do Chat',
      'Escolha uma opção:',
      [
        {
          text: 'Informações do Contato',
          onPress: () => {
            Alert.alert(
              'Informações do Contato',
              `Nome: ${selectedChat?.userName}\nStatus: Online\nFunção: Administrador`,
              [{ text: 'OK' }]
            );
          }
        },
        {
          text: 'Silenciar Notificações',
          onPress: () => {
            Alert.alert('Notificações silenciadas para este chat');
          }
        },
        {
          text: 'Limpar Conversa',
          onPress: () => {
            Alert.alert(
              'Limpar Conversa',
              'Tem certeza que deseja limpar toda a conversa?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel'
                },
                {
                  text: 'Limpar',
                  style: 'destructive',
                  onPress: () => {
                    setMessages([]);
                    Alert.alert('Conversa limpa com sucesso!');
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Fechar',
          style: 'cancel'
        }
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

        {/* Modal Moderno - Opções de Foto */}
        {console.log('=== DEBUG: Renderizando modal, showPhotoOptions =', showPhotoOptions)}
        {showPhotoOptions && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tirar Foto</Text>
                <TouchableOpacity onPress={() => setShowPhotoOptions(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalOptions}>
                <TouchableOpacity style={styles.modalOption} onPress={takePhotoComplete}>
                  <View style={styles.optionIcon}>📷</View>
                  <Text style={styles.optionText}>Foto Completa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOption} onPress={takePhotoCropped}>
                  <View style={styles.optionIcon}>✂️</View>
                  <Text style={styles.optionText}>Cortar Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOption} onPress={recordVideo}>
                  <View style={styles.optionIcon}>🎥</View>
                  <Text style={styles.optionText}>Gravar Vídeo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Modal Moderno - Opções de Galeria */}
        {showGalleryOptions && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Galeria</Text>
                <TouchableOpacity onPress={() => setShowGalleryOptions(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalOptions}>
                <TouchableOpacity style={styles.modalOption} onPress={selectMediaComplete}>
                  <View style={styles.optionIcon}>🖼️</View>
                  <Text style={styles.optionText}>Mídia Completa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOption} onPress={selectMediaCropped}>
                  <View style={styles.optionIcon}>✂️</View>
                  <Text style={styles.optionText}>Cortar Mídia</Text>
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
    backgroundColor: '#374151',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  searchMenuButton: {
    padding: 4,
  },
  headerButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#F97316',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#F97316',
  },
  content: {
    flex: 1,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  adminRole: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  adminCompany: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chatTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  lastMessage: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  chatHeaderName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  chatHeaderStatus: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 12,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatMessagesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#F97316',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#111827',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaIconContainer: {
    marginRight: 8,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaIcon: {
    fontSize: 20,
  },
  mediaTextContainer: {
    flex: 1,
  },
  mediaContentContainer: {
    position: 'relative',
    marginRight: 8,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoIcon: {
    fontSize: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  modalOptions: {
    gap: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },

});
