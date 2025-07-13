import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Trash2, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthService } from '../../services/AuthService';
import { AdminService, AdminNotification } from '../../services/AdminService';

export default function AdminNotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const subscribeNotifications = async () => {
      try {
        setLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
          Alert.alert('Acesso Negado', 'Apenas administradores podem acessar esta página.');
          router.back();
          return;
        }
        unsubscribe = await AdminService.subscribeToNotifications((notificationsData) => {
          setNotifications(notificationsData);
          setLoading(false);
        });
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar as notificações.');
        setLoading(false);
      }
    };
    subscribeNotifications();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await AdminService.markNotificationAsRead(notificationId);
      // Atualizar a lista local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
    }
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      'Marcar todas como lidas',
      'Tem certeza que deseja marcar todas as notificações como lidas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const unreadNotifications = notifications.filter(n => !n.read);
              await Promise.all(
                unreadNotifications.map(notif => 
                  AdminService.markNotificationAsRead(notif.id)
                )
              );
              
              // Atualizar a lista local
              setNotifications(prev => 
                prev.map(notif => ({ ...notif, read: true }))
              );
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível marcar todas como lidas.');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <Bell size={20} color="#2563EB" />;
      case 'task_assigned':
        return <Check size={20} color="#059669" />;
      case 'task_completed':
        return <Check size={20} color="#16a34a" />;
      case 'invite':
        return <Bell size={20} color="#d97706" />;
      case 'alert':
        return <Bell size={20} color="#dc2626" />;
      default:
        return <Bell size={20} color={colors.primary} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return '#2563EB';
      case 'task_assigned':
        return '#059669';
      case 'task_completed':
        return '#16a34a';
      case 'invite':
        return '#d97706';
      case 'alert':
        return '#dc2626';
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora';
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

  const renderNotification = ({ item }: { item: AdminNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: item.read ? colors.surface : '#FEF3C7',
          borderLeftColor: getNotificationColor(item.type)
        }
      ]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(item.type)}
      </View>
      
      <View style={styles.notificationContent}>
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
        
        <View style={styles.notificationFooter}>
          <Text style={[styles.notificationSender, { color: colors.primary }]}>
            Por: {item.senderName}
          </Text>
          
          {!item.read && (
            <View style={[styles.unreadIndicator, { backgroundColor: getNotificationColor(item.type) }]}>
              <Text style={styles.unreadText}>Nova</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notificações</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notificações
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primary }]}
            onPress={handleMarkAllAsRead}
          >
            <Check size={16} color="white" />
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma notificação
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Você não tem notificações no momento
            </Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  unreadBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  markAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationSender: {
    fontSize: 12,
    fontWeight: '500',
  },
  unreadIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
}); 