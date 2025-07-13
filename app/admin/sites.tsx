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
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import TaskService from '@/services/TaskService';

interface Site {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  tasksCount: number;
  completedTasks: number;
}

export default function SitesScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);

  const loadSites = async () => {
    try {
      setLoading(true);
      const sitesData = await AuthService.getUserSites();
      setSites(sitesData.map(site => ({ ...site, tasksCount: 0, completedTasks: 0 })));
      // Atualiza tarefas para cada site
      sitesData.forEach(site => {
        TaskService.subscribeToTasksBySite(site.id, (tasks) => {
          const completedTasks = tasks.filter((task) => task.status === 'completed');
          setSites(prevSites => {
            const others = prevSites.filter(s => s.id !== site.id);
            return [
              ...others,
              {
                ...site,
                tasksCount: tasks.length,
                completedTasks: completedTasks.length,
              }
            ];
          });
        });
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as obras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadSites();
    return () => { isMounted = false; };
  }, []);

  const handleCreateSite = () => {
    router.push('/admin/sites/create');
  };

  const handleEditSite = (siteId: string) => {
    router.push(`/admin/sites/edit?id=${siteId}`);
  };

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    setDeleteLoading(true);
    try {
      await AuthService.deleteSite(siteToDelete);
      setShowDeleteModal(false);
      setSiteToDelete(null);
      await loadSites();
      Alert.alert('Sucesso', 'Obra excluída com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a obra');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderSiteItem = ({ item }: { item: Site }) => (
    <View style={styles.card}>
      <View style={styles.siteHeader}>
        <Text style={styles.siteName}>{item.name}</Text>
        <View style={styles.siteActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditSite(item.id)}
          >
            <Edit size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSiteToDelete(item.id);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.siteAddress}>{item.address}</Text>
      <View style={styles.siteStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.tasksCount}</Text>
          <Text style={styles.statLabel}>Total de tarefas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.completedTasks}</Text>
          <Text style={styles.statLabel}>Tarefas concluídas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {item.tasksCount > 0
              ? Math.round((item.completedTasks / item.tasksCount) * 100)
              : 0}
            %
          </Text>
          <Text style={styles.statLabel}>Taxa de conclusão</Text>
        </View>
      </View>
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
        <Text style={styles.title}>Gerenciar Obras</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateSite}
        >
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando obras...</Text>
        </View>
      ) : sites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhuma obra encontrada. Clique no botão + para criar uma nova obra.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sites}
          renderItem={renderSiteItem}
          keyExtractor={item => item.id}
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
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#EF4444', marginBottom: 12 }}>Remover Obra</Text>
            <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 24 }}>
              Tem certeza que deseja remover esta obra? Esta ação não pode ser desfeita.
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
                onPress={handleDeleteSite}
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
  addButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  siteActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  siteAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  siteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 