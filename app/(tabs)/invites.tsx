import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../services/AuthService';
import { InviteService } from '../../services/InviteService';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Trash2 } from 'lucide-react-native';

interface Invite {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  siteId: string;
  createdAt: any;
}

// Importar o tipo User
type User = any; // Temporário até definir o tipo correto

export default function InvitesScreen() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [inviteToDelete, setInviteToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadUserAndInvites = async () => {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser?.role === 'admin') {
        try {
          const data = await InviteService.getPendingInvites();
          setInvites(data as Invite[]);
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os convites pendentes.');
        }
      } else {
        try {
          const data = await InviteService.getInvitesForCurrentUser();
          setInvites(data as Invite[]);
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar seus convites.');
        }
      }
      setLoading(false);
    };

    loadUserAndInvites();
  }, []);

  const fetchInvites = async () => {
    setLoading(true);
    if (user?.role === 'admin') {
      try {
        const data = await InviteService.getPendingInvites();
        setInvites(data as Invite[]);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível recarregar os convites.');
      }
    } else {
      try {
        const data = await InviteService.getInvitesForCurrentUser();
        setInvites(data as Invite[]);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar seus convites.');
      }
    }
    setLoading(false);
  };

  const handleCancelOrDeleteInvite = (inviteId: string) => {
    setInviteToDelete(inviteId);
    setConfirmModalVisible(true);
  };

  const confirmDeletion = async () => {
    if (!inviteToDelete) return;

    const isUserAdmin = user?.role === 'admin';

    try {
      if (isUserAdmin) {
        await InviteService.deleteInvite(inviteToDelete);
      } else {
        await AuthService.getInstance().cancelInvite(inviteToDelete);
      }
      await fetchInvites();
      Alert.alert('Sucesso', `Convite ${isUserAdmin ? 'excluído' : 'cancelado'} com sucesso`);
    } catch (error) {
      Alert.alert('Erro', `Não foi possível ${isUserAdmin ? 'excluir' : 'cancelar'} o convite`);
    } finally {
      setConfirmModalVisible(false);
      setInviteToDelete(null);
    }
  };

  const renderInviteItem = ({ item }: { item: Invite }) => {
    const isPending = item.status === 'pending';
    let statusText = 'Cancelado';
    let statusColor = '#666';

    if (isPending) {
      statusText = 'Pendente';
      statusColor = '#FF9800';
    } else if (item.status === 'accepted') {
      statusText = 'Aceito';
      statusColor = '#10B981';
    }
    
    const canTakeAction = isPending;

    return (
      <View style={styles.card}>
        <View style={styles.inviteHeader}>
          <View>
            <Text style={styles.inviteEmail}>{item.email}</Text>
            <Text style={styles.inviteDate}>
              Enviado em: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Data indisponível'}
            </Text>
          </View>
          {canTakeAction && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleCancelOrDeleteInvite(item.id)}>
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.inviteStatus, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {user?.role === 'admin' ? 'Gerenciar Convites' : 'Meus Convites'}
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 32 }} />
      ) : invites.length === 0 ? (
        <Text style={styles.subtitle}>
          {user?.role === 'admin' ? 'Nenhum convite pendente encontrado.' : 'Você não tem nenhum convite.'}
        </Text>
      ) : (
        <FlatList
          data={invites}
          renderItem={renderInviteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onRefresh={fetchInvites}
          refreshing={loading}
        />
      )}

      <ConfirmationModal
        visible={isConfirmModalVisible}
        title={user?.role === 'admin' ? 'Excluir convite' : 'Cancelar convite'}
        message={
          user?.role === 'admin'
            ? 'Tem certeza que deseja excluir permanentemente este convite?'
            : 'Tem certeza que deseja cancelar seu convite?'
        }
        onConfirm={confirmDeletion}
        onCancel={() => {
          setConfirmModalVisible(false);
          setInviteToDelete(null);
        }}
        confirmText={user?.role === 'admin' ? 'Excluir' : 'Sim'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 32,
    textAlign: 'center',
  },
  list: {
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  inviteEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  inviteDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  inviteStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
  },
}); 