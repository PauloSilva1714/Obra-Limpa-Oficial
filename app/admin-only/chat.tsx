import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AdminChat from '@/components/AdminChat';
import AdminChatSessions from '@/components/AdminChatSessions';
import AdminDirectChat from '@/components/AdminDirectChat';
import AdminSearch from '@/components/AdminSearch';
import { AuthService } from '@/services/AuthService';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grupo' | 'individual' | 'novo'>('individual');
  const [directChat, setDirectChat] = useState<{ userId: string; userName: string } | null>(null);
  const [showAdminSearch, setShowAdminSearch] = useState(false);

  useEffect(() => {
    AuthService.getCurrentUser().then(currentUser => {
      if (!currentUser || currentUser.role !== 'admin') {
        router.replace('/(tabs)');
      }
    });
    AuthService.getCurrentSite().then(site => {
      setSiteId(site?.id || null);
      setLoading(false);
    });
  }, []);

  // Ao clicar em Novo Chat, abre o modal
  const handleTabPress = (tab: 'grupo' | 'individual' | 'novo') => {
    setActiveTab(tab);
    if (tab === 'novo') {
      setShowAdminSearch(true);
    }
  };

  // Ao selecionar admin, abre chat individual
  const handleSelectAdmin = (userId: string, userName: string) => {
    setShowAdminSearch(false);
    setDirectChat({ userId, userName });
    setActiveTab('individual');
  };

  // Ao fechar modal
  const handleCloseAdminSearch = () => {
    setShowAdminSearch(false);
    setActiveTab('individual');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!siteId) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  // Se estiver em um chat individual, renderiza o chat direto
  if (directChat) {
    return (
      <AdminDirectChat
        siteId={siteId}
        otherUserId={directChat.userId}
        otherUserName={directChat.userName}
        onBack={() => setDirectChat(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grupo' && styles.activeTab]}
          onPress={() => handleTabPress('grupo')}
        >
          <Text style={[styles.tabText, activeTab === 'grupo' && styles.activeTabText]}>👫 Grupo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'individual' && styles.activeTab]}
          onPress={() => handleTabPress('individual')}
        >
          <Text style={[styles.tabText, activeTab === 'individual' && styles.activeTabText]}>👤 Individual</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'novo' && styles.activeTab]}
          onPress={() => handleTabPress('novo')}
        >
          <Text style={[styles.tabText, activeTab === 'novo' && styles.activeTabText]}>✉️ Novo Chat</Text>
        </TouchableOpacity>
      </View>
      {/* Conteúdo das abas */}
      <View style={{ flex: 1 }}>
        {activeTab === 'grupo' && <AdminChat siteId={siteId} />}
        {activeTab === 'individual' && (
          <AdminChatSessions
            siteId={siteId}
            onSelectSession={(userId, userName) => setDirectChat({ userId, userName })}
          />
        )}
      </View>
      {/* Modal de Selecionar Administrador */}
      {showAdminSearch && (
        <AdminSearch
          siteId={siteId}
          visible={showAdminSearch}
          onSelectAdmin={handleSelectAdmin}
          onClose={handleCloseAdminSearch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#F97316',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#F97316',
  },
}); 