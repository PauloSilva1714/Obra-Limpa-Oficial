import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, UserPlus, Crown, Mail, Phone, Building2 } from 'lucide-react-native';
import { AuthService, User } from '@/services/AuthService';
import { useTheme } from '@/contexts/ThemeContext';
import { ConfirmationModal } from '@/components/ConfirmationModal';

interface Admin {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  phone?: string;
  company?: string;
  siteId?: string;
}

export default function AdminsScreen() {
  const { colors } = useTheme();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    loadAdmins();
    AuthService.getCurrentUser().then(user => setCurrentUserId(user?.id || null));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAdmins();
    }, [])
  );

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const currentSite = await AuthService.getCurrentSite();
      if (currentSite) {
        const siteAdmins = await AuthService.getAdminsBySite(currentSite.id);
        setAdmins(siteAdmins);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAdmin = () => {
    router.push('/admin/workers/invite-admin');
  };

  const handleRemoveAdmin = (adminId: string, adminName: string) => {
    setAdminToRemove({ id: adminId, name: adminName });
    setShowConfirmModal(true);
  };

  const confirmRemoveAdmin = async () => {
    if (!adminToRemove) return;
    setRemoving(true);
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (!currentSite) throw new Error('Obra não encontrada');
      // Buscar admin pelo id
      const adminRef = await AuthService.getInstance().getWorkerById(adminToRemove.id);
      if (!adminRef) throw new Error('Admin não encontrado');
      const updatedSites = (adminRef.sites || []).filter((id: string) => id !== currentSite.id);
      await AuthService.getInstance().updateWorker(adminToRemove.id, {
        sites: updatedSites,
        status: updatedSites.length === 0 ? 'inactive' : 'active',
      });
      setShowConfirmModal(false);
      setAdminToRemove(null);
      Alert.alert('Sucesso', 'Administrador removido com sucesso!');
      loadAdmins();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o administrador.');
    } finally {
      setRemoving(false);
    }
  };

  const cancelRemoveAdmin = () => {
    setShowConfirmModal(false);
    setAdminToRemove(null);
  };

  const renderAdminItem = ({ item }: { item: User }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.adminHeader}>
        <View style={styles.adminInfo}>
          <View style={styles.nameContainer}>
            <Crown size={20} color={colors.primary} />
            <Text style={[styles.adminName, { color: colors.text }]}>{item.name}</Text>
          </View>
          <View style={styles.emailContainer}>
            <Mail size={16} color={colors.textMuted} />
            <Text style={[styles.adminEmail, { color: colors.textMuted }]}>{item.email}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.status === 'active' ? '#10B981' : '#EF4444' 
        }]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>
      
      <View style={styles.adminDetails}>
        {Boolean(item.phone) && (
          <View style={styles.detailRow}>
            <Phone size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textMuted }]}>{item.phone}</Text>
          </View>
        )}
        {Boolean(item.company) && (
          <View style={styles.detailRow}>
            <Building2 size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textMuted }]}>{item.company}</Text>
          </View>
        )}
      </View>
      {/* Botão de remover admin, exceto para o próprio usuário */}
      {currentUserId && item.id !== currentUserId && (
        <TouchableOpacity
          style={{
            backgroundColor: '#F87171',
            padding: 8,
            borderRadius: 8,
            marginTop: 12,
            alignSelf: 'flex-end',
          }}
          onPress={() => handleRemoveAdmin(item.id, item.name)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Remover</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Administradores</Text>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={handleInviteAdmin}
        >
          <UserPlus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Administradores da Obra
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
            Administradores que têm acesso total a esta obra.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Carregando administradores...
            </Text>
          </View>
        ) : admins.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Crown size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum administrador encontrado
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
              Você é o único administrador desta obra.
            </Text>
            <TouchableOpacity
              style={[styles.inviteAdminButton, { backgroundColor: colors.primary }]}
              onPress={handleInviteAdmin}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.inviteAdminButtonText}>Convidar Administrador</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={admins}
            renderItem={renderAdminItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <ConfirmationModal
        visible={showConfirmModal}
        title="Remover Administrador"
        message={adminToRemove ? `Tem certeza que deseja remover o administrador ${adminToRemove.name} desta obra?` : ''}
        onConfirm={confirmRemoveAdmin}
        onCancel={cancelRemoveAdmin}
        confirmText={removing ? 'Removendo...' : 'Remover'}
        cancelText="Cancelar"
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  inviteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inviteAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  inviteAdminButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adminInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminEmail: {
    fontSize: 14,
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  adminDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 6,
  },
}); 