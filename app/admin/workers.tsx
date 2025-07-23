import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Edit, Trash2, ArrowLeft, UserPlus, Crown } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { User } from '@/services/AuthService';

interface Worker {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  phone?: string;
  company?: string;
  siteId?: string;
}

interface Invite {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function WorkersScreen() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);

  useEffect(() => {
    AuthService.getCurrentSite().then(site => {
      setSiteId(site?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    AuthService.getWorkersBySite(siteId).then(users => {
      setWorkers(users.filter(w => w.status === 'active' || w.status === 'inactive'));
      setLoading(false);
    });
    // Invites podem continuar como estão
    const unsubscribeInvites = AuthService.subscribeToInvites(siteId, (invitesData) => {
      setInvites(invitesData);
    });
    return () => {
      unsubscribeInvites && unsubscribeInvites();
    };
  }, [siteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersData, invitesData] = await Promise.all([
        AuthService.getInstance().getWorkers(),
        AuthService.getInstance().getInvites(),
      ]);
      setWorkers(workersData);
      setInvites(invitesData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = () => {
    router.push('/admin/workers/invite');
  };

  const handleInviteAdmin = () => {
    router.push('/admin/workers/invite-admin');
  };

  const handleViewAdmins = () => {
    router.push('/admin/workers/admins');
  };

  const handleEditWorker = (workerId: string) => {
    router.push({
      pathname: '/admin/workers',
      params: { id: workerId },
    });
  };

  const handleDeleteWorker = async () => {
    if (!workerToDelete) return;
    setDeleteLoading(true);
    try {
      await AuthService.getInstance().removeWorker(workerToDelete);
      setShowDeleteModal(false);
      setWorkerToDelete(null);
      await loadData();
      Alert.alert('Sucesso', 'Colaborador removido com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o colaborador');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    Alert.alert(
      'Cancelar convite',
      'Tem certeza que deseja cancelar este convite?',
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.getInstance().cancelInvite(inviteId);
              await loadData();
              Alert.alert('Sucesso', 'Convite cancelado com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar o convite');
            }
          },
        },
      ]
    );
  };

  const renderWorkerItem = ({ item }: { item: Worker }) => (
    <View style={styles.card}>
      <View style={styles.workerHeader}>
        <View>
          <Text style={styles.workerName}>{item.name}</Text>
          <Text style={styles.workerEmail}>{item.email}</Text>
        </View>
        <View style={styles.workerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditWorker(item.id)}
          >
            <Edit size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setWorkerToDelete(item.id);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.workerInfo}>
        {item.phone && (
          <Text style={styles.workerInfoText}>Telefone: {item.phone}</Text>
        )}
        {item.company && (
          <Text style={styles.workerInfoText}>Empresa: {item.company}</Text>
        )}
        <Text style={[
          styles.workerStatus,
          { color: item.status === 'active' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.status === 'active' ? 'Ativo' : 'Inativo'}
        </Text>
      </View>
    </View>
  );

  const renderInviteItem = ({ item }: { item: Invite }) => (
    <View style={styles.card}>
      <View style={styles.inviteHeader}>
        <View>
          <Text style={styles.inviteEmail}>{item.email}</Text>
          <Text style={styles.inviteDate}>
            Enviado em: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCancelInvite(item.id)}
        >
          <Trash2 size={20} color="#666" />
        </TouchableOpacity>
      </View>
      <Text style={[
        styles.inviteStatus,
        { color: item.status === 'pending' ? '#FF9800' : '#666' }
      ]}>
        {item.status === 'pending' ? 'Pendente' : 'Aceito'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Gerenciar Equipe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleInviteAdmin}
          >
            <UserPlus size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleInvite}
          >
            <Plus size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleViewAdmins}
        >
          <Crown size={16} color="#8B5CF6" />
          <Text style={styles.quickActionText}>Ver Admins</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleInviteAdmin}
        >
          <UserPlus size={16} color="#3B82F6" />
          <Text style={styles.quickActionText}>Convidar Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleInvite}
        >
          <UserPlus size={16} color="#10B981" />
          <Text style={styles.quickActionText}>Convidar Colaborador</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...workers,
            ...invites.filter(invite => invite.status === 'pending'),
          ]}
          renderItem={({ item }) => {
            if ('status' in item && item.status === 'pending') {
              return renderInviteItem({ item: item as Invite });
            }
            return renderWorkerItem({ item: item as Worker });
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#EF4444', marginBottom: 12 }}>Remover Colaborador</Text>
            <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 24 }}>
              Tem certeza que deseja remover este colaborador? Esta ação não pode ser desfeita.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, marginRight: 8, backgroundColor: '#E5E7EB', borderRadius: 8, padding: 12, alignItems: 'center' }}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                <Text style={{ color: '#374151', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, marginLeft: 8, backgroundColor: '#EF4444', borderRadius: 8, padding: 12, alignItems: 'center' }}
                onPress={handleDeleteWorker}
                disabled={deleteLoading}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>{deleteLoading ? 'Removendo...' : 'Remover'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workerEmail: {
    fontSize: 14,
    color: '#666',
  },
  workerActions: {
    flexDirection: 'row',
  },
  workerInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  workerInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  workerStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
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
    marginBottom: 4,
  },
  inviteDate: {
    fontSize: 12,
    color: '#666',
  },
  inviteStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 