import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView, Modal, Image, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Building2, LogOut, Settings, Bell, Shield, CircleHelp as HelpCircle } from 'lucide-react-native';
import { AuthService, User as UserData } from '@/services/AuthService';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto } from '@/services/PhotoService';
import { LinearGradient } from 'expo-linear-gradient';

interface UserProfile {
  name: string;
  email: string;
  role: 'admin' | 'worker';
  siteName: string;
  joinDate: string;
  notifications: {
    taskCreation: boolean;
    taskUpdate: boolean;
    loginConfirmation: boolean;
  };
  photoURL?: string;
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      // Buscar usuário autenticado
      const localUser = await AuthService.getCurrentUser();
      if (!localUser) return;
      // Buscar sempre do Firestore pelo id
      const freshUser = await AuthService.getUserById(localUser.id);
      setUserData(freshUser);
    };
    fetchUser();
  }, []);

  // Função para extrair o primeiro nome
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  // Função para gerar saudação baseada na hora do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Função para emoji dinâmico
  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
  };

  const handleNotificationChange = (key: 'taskCreation' | 'taskUpdate' | 'loginConfirmation', value: boolean) => {
    setUserData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: value,
        },
      };
    });
  };

  const handleSaveChanges = async () => {
    if (!userData) return;
    setIsSaving(true);
    try {
      // Salvar notificações
      await AuthService.updateNotificationSettings(userData.id, userData.notifications || {});
      // Salvar foto de perfil, se houver
      if (userData.photoURL) {
        await AuthService.updateUserProfilePhoto(userData.id, userData.photoURL);
      }
      // Salvar nome, se alterado
      if (userData.name) {
        await AuthService.updateUserName(userData.id, userData.name);
      }
      // Buscar usuário atualizado do Firestore
      const updatedUser = await AuthService.getUserById(userData.id);
      setUserData(updatedUser);
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    router.replace('/login');
  };

  const handleSwitchSite = () => {
    router.replace('/(auth)/site-selection');
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para escolher uma foto.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: 'images', 
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.7 
    });
    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      await handleUploadImage(pickerResult.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar uma foto.');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      await handleUploadImage(pickerResult.assets[0].uri);
    }
  };

  const handleUploadImage = async (uri: string) => {
    if (!userData) return;
    setUploading(true);
    try {
      const photoURL = await uploadProfilePhoto(userData.id, uri);
      await AuthService.updateUserProfilePhoto(userData.id, photoURL);
      // Buscar usuário atualizado do Firestore
      const updatedUser = await AuthService.getUserById(userData.id);
      setUserData(updatedUser);
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setUploading(false);
    }
  };

  const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>
          {icon}
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E5E7EB', true: '#F97316' }}
          thumbColor={switchValue ? '#FFFFFF' : '#FFFFFF'}
        />
      )}
    </TouchableOpacity>
  );

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Saudação dinâmica no topo com gradiente e emoji (compatível com web/mobile) */}
        <View style={{ alignItems: 'center', marginTop: 36, marginBottom: 18 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(37,99,235,0.08)',
            borderRadius: 32,
            paddingHorizontal: 24,
            paddingVertical: 10,
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 28, marginRight: 10 }}>{getGreetingEmoji()}</Text>
            <LinearGradient
              colors={['#2563EB', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 8 }}
            >
              <Text style={{
                fontSize: 26,
                fontWeight: 'bold',
                letterSpacing: 1,
                textTransform: 'capitalize',
                paddingHorizontal: 8,
                backgroundColor: 'transparent',
                color: '#fff',
              }}>{getGreeting()}</Text>
            </LinearGradient>
          </View>
        </View>
        <View style={styles.header}>
          <User size={40} color="#111827" />
          <View>
            {/* Campo de texto editável para o nome */}
            <TextInput
              style={styles.userName}
              value={userData.name}
              onChangeText={name => setUserData(prev => prev ? { ...prev, name } : prev)}
              placeholder="Seu nome"
              placeholderTextColor="#9CA3AF"
              maxLength={40}
            />
          </View>
        </View>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {uploading ? (
            <ActivityIndicator size="large" color="#22C55E" />
          ) : userData?.photoURL ? (
            <Image source={{ uri: userData.photoURL }} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 8 }} />
          ) : (
            <TouchableOpacity onPress={handlePickImage} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <User size={48} color="#6B7280" />
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <TouchableOpacity onPress={handlePickImage} style={{ marginRight: 16 }}>
              <Text style={{ color: '#2563EB', fontSize: 14 }}>Escolher da Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakePhoto}>
              <Text style={{ color: '#2563EB', fontSize: 14 }}>Tirar Foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color="#111827" />
            <Text style={styles.sectionTitle}>Notificações por Email</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Confirmação de Login</Text>
            <Switch
              value={userData.notifications?.loginConfirmation ?? true}
              onValueChange={(value) => handleNotificationChange('loginConfirmation', value)}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Criação de Tarefas</Text>
            <Switch
              value={userData.notifications?.taskCreation ?? true}
              onValueChange={(value) => handleNotificationChange('taskCreation', value)}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Atualização de Tarefas</Text>
            <Switch
              value={userData.notifications?.taskUpdate ?? true}
              onValueChange={(value) => handleNotificationChange('taskUpdate', value)}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>

        <View style={styles.menuContainer}>
          {userData.role === 'admin' && (
            <>
              <MenuSection title="Administração">
                <MenuItem
                  icon={<Building2 size={20} color="#6B7280" />}
                  title="Gerenciar Obras"
                  subtitle="Criar, editar e visualizar obras"
                  onPress={() => router.push('/admin/sites')}
                />
                <MenuItem
                  icon={<User size={20} color="#6B7280" />}
                  title="Gerenciar Colaboradores"
                  subtitle="Criar convites e gerenciar permissões"
                  onPress={() => router.push('/admin/workers')}
                />
                <MenuItem
                  icon={<Shield size={20} color="#6B7280" />}
                  title="Estatísticas"
                  subtitle="Visualizar métricas e relatórios"
                  onPress={() => router.push('/admin/stats')}
                />
              </MenuSection>
            </>
          )}

          <MenuSection title="Obra">
            <MenuItem
              icon={<Building2 size={20} color="#6B7280" />}
              title="Trocar de Obra"
              subtitle="Selecionar outra obra ativa"
              onPress={handleSwitchSite}
            />
          </MenuSection>

          <MenuSection title="Configurações">
            <MenuItem
              icon={<Shield size={20} color="#6B7280" />}
              title="Privacidade"
              subtitle="Configurações de privacidade"
              onPress={() => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento.')}
            />
          </MenuSection>

          <MenuSection title="Suporte">
            <MenuItem
              icon={<HelpCircle size={20} color="#6B7280" />}
              title="Ajuda"
              subtitle="Central de ajuda e suporte"
              onPress={() => Alert.alert('Ajuda', 'Entre em contato com o suporte através do email: suporte@gestaoobras.com')}
            />
            <MenuItem
              icon={<Settings size={20} color="#6B7280" />}
              title="Sobre"
              subtitle="Versão 1.0.0"
              onPress={() => Alert.alert('Sobre', 'Gestão de Obras v1.0.0\nSistema de limpeza e organização para construtoras.')}
            />
          </MenuSection>
        </View>
      </ScrollView>

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
              Configurações salvas com sucesso.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#22C55E', borderRadius: 8, padding: 12, alignItems: 'center', width: '60%' }}
              onPress={() => setShowSuccessModal(false)}
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
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});