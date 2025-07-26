import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Trash2 } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import TaskService from '@/services/TaskService';
import AddressSearch from '@/components/AddressSearch';

interface Site {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string | string[];
  area: string;
  dueDate?: string;
  createdAt: string;
  photos?: string[];
}

export default function EditSiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadSite();
  }, [id]);

  useEffect(() => {
    if (!site) return;
    const unsubscribe = TaskService.subscribeToTasksBySite(site.id, (tasks) => {
      setTasks(tasks);
    });
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [site]);

  const loadSite = async () => {
    try {
      const siteData = await AuthService.getSiteById(id);
      if (siteData) {
        setSite(siteData);
        setName(siteData.name);
        setAddress(siteData.address);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar dados da obra.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSite = async () => {
    if (!name || !address) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    setSaving(true);
    try {
      await AuthService.updateSite(id, {
        name,
        address,
        status: site?.status || 'active',
      });
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar obra. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSite = async () => {
    setDeleteLoading(true);
    try {
      await AuthService.deleteSite(id);
      setShowDeleteModal(false);
      Alert.alert('Sucesso', 'Obra removida com sucesso!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao remover obra. Verifique suas permissões ou tente novamente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Obra</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Trash2 size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Nome da Obra</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Edifício Comercial Centro"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Endereço</Text>
          <AddressSearch
            value={address}
            onChangeText={setAddress}
            onAddressSelect={(addr, lat, lng) => setAddress(addr)}
            placeholder="Ex: Rua Exemplo, 123 - Centro"
          />
        </View>

        {site && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#374151', fontSize: 16 }}>
              Tarefas relacionadas a esta obra: <Text style={{ fontWeight: 'bold' }}>{tasks.length}</Text>
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleUpdateSite}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>
      </View>

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

      {/* Modal de sucesso ao salvar alterações */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#22C55E', marginBottom: 12 }}>Sucesso!</Text>
            <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 24 }}>
              Alterações salvas com sucesso.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#22C55E', borderRadius: 8, padding: 12, alignItems: 'center', width: '60%' }}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});