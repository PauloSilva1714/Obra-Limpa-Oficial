import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Users, MessageCircle, UserPlus } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthService } from '../../services/AuthService';
import { AdminService } from '../../services/AdminService';
import AdminChat from '../../components/AdminChat';
import AdminDirectChat from '../../components/AdminDirectChat';
import AdminChatSessions from '../../components/AdminChatSessions';
import AdminSearch from '../../components/AdminSearch';

type ChatMode = 'group' | 'individual' | 'sessions';

export default function AdminChatScreen() {
  const { colors } = useTheme();
  const [currentSite, setCurrentSite] = useState<any>(null);
  const [otherAdmins, setOtherAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMode, setChatMode] = useState<ChatMode>('sessions');
  const [selectedChat, setSelectedChat] = useState<{
    otherUserId: string;
    otherUserName: string;
  } | null>(null);
  const [showAdminSearch, setShowAdminSearch] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário é administrador
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        Alert.alert('Acesso Negado', 'Apenas administradores podem acessar esta página.');
        router.back();
        return;
      }

      // Buscar obra atual
      const site = await AuthService.getCurrentSite();
      if (!site) {
        Alert.alert('Erro', 'Nenhuma obra selecionada. Selecione uma obra primeiro.');
        router.back();
        return;
      }

      if (!site.id) {
        Alert.alert('Erro', 'ID da obra inválido. Selecione uma obra novamente.');
        router.back();
        return;
      }

      setCurrentSite(site);

      // Buscar outros administradores
      const admins = await AdminService.getOtherAdmins(site.id);
      setOtherAdmins(admins);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (otherUserId: string, otherUserName: string) => {
    setSelectedChat({ otherUserId, otherUserName });
    setChatMode('individual');
  };

  const handleBackToSessions = () => {
    setSelectedChat(null);
    setChatMode('sessions');
  };

  const handleStartNewChat = () => {
    if (otherAdmins.length === 0) {
      Alert.alert('Nenhum administrador', 'Não há outros administradores disponíveis para conversar.');
      return;
    }
    setShowAdminSearch(true);
  };

  const handleSelectAdmin = (adminId: string, adminName: string) => {
    setShowAdminSearch(false);
    handleSelectChat(adminId, adminName);
  };

  const handleCloseAdminSearch = () => {
    setShowAdminSearch(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentSite || !currentSite.id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Erro</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Nenhuma obra selecionada ou ID da obra inválido
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {chatMode === 'individual' && selectedChat ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToSessions}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {selectedChat.otherUserName}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Chat individual
              </Text>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Chat de Administradores
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {currentSite.name} - {chatMode === 'group' ? 'Chat em Grupo' : chatMode === 'sessions' ? 'Conversas Individuais' : 'Chat Individual'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, chatMode === 'group' && styles.activeActionButton]}
                onPress={() => setChatMode('group')}
              >
                <Users size={20} color={chatMode === 'group' ? colors.primary : colors.textMuted} />
                <Text style={[styles.actionButtonText, { color: chatMode === 'group' ? colors.primary : colors.textMuted }]}>
                  Grupo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, chatMode === 'sessions' && styles.activeActionButton]}
                onPress={() => setChatMode('sessions')}
              >
                <MessageCircle size={20} color={chatMode === 'sessions' ? colors.primary : colors.textMuted} />
                <Text style={[styles.actionButtonText, { color: chatMode === 'sessions' ? colors.primary : colors.textMuted }]}>
                  Individual
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleStartNewChat}
              >
                <UserPlus size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Novo Chat
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Chat Content */}
      {chatMode === 'individual' && selectedChat ? (
        <AdminDirectChat
          siteId={currentSite.id}
          otherUserId={selectedChat.otherUserId}
          otherUserName={selectedChat.otherUserName}
          onBack={handleBackToSessions}
          style={styles.chatContainer}
        />
      ) : chatMode === 'sessions' ? (
        <AdminChatSessions
          siteId={currentSite.id}
          onSelectSession={handleSelectChat}
          style={styles.chatContainer}
        />
      ) : (
        <AdminChat siteId={currentSite.id} style={styles.chatContainer} />
      )}

      {/* Admin Search Modal */}
      {showAdminSearch && currentSite && (
        <AdminSearch
          siteId={currentSite.id}
          onSelectAdmin={handleSelectAdmin}
          onClose={handleCloseAdminSearch}
          visible={showAdminSearch}
        />
      )}
    </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  chatContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  activeActionButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
}); 