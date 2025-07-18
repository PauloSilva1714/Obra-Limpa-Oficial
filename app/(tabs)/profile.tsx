import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView, Modal, Image, ActivityIndicator, TextInput, Platform, Animated, useWindowDimensions, Animated as RNAnimated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Building2, LogOut, Settings, Bell, Shield, CircleHelp as HelpCircle, ImagePlus, Camera, Pencil, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AuthService, User as UserData } from '@/services/AuthService';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto } from '@/services/PhotoService';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput as RNTextInput } from 'react-native';

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
  const photoAnim = useRef(new Animated.Value(1)).current;
  const prevPhotoURL = useRef<string | undefined>(undefined);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const nameInputRef = useRef<RNTextInput>(null);
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 500;
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastAnim = useRef(new RNAnimated.Value(-80)).current;
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  useEffect(() => {
    if (userData?.photoURL && userData.photoURL !== prevPhotoURL.current) {
      photoAnim.setValue(0.7);
      Animated.parallel([
        Animated.timing(photoAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      prevPhotoURL.current = userData.photoURL;
    }
  }, [userData?.photoURL]);

  // Adicionar valores padrão se não existirem
  useEffect(() => {
    if (userData && (userData.privacyEmail === undefined || userData.privacyPhoto === undefined)) {
      setUserData(prev => prev ? {
        ...prev,
        privacyEmail: prev.privacyEmail ?? true,
        privacyPhoto: prev.privacyPhoto ?? true,
      } : prev);
    }
  }, [userData]);

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

  const handlePrivacyChange = (key: 'privacyEmail' | 'privacyPhoto', value: boolean) => {
    setUserData(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const showToast = () => {
    setShowSuccessToast(true);
    RNAnimated.timing(toastAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        RNAnimated.timing(toastAnim, {
          toValue: -80,
          duration: 350,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => setShowSuccessToast(false));
      }, 2500);
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
      // Salvar preferências de privacidade
      await AuthService.updateUserPrivacy(userData.id, {
        privacyEmail: userData.privacyEmail ?? true,
        privacyPhoto: userData.privacyPhoto ?? true,
      });
      // Buscar usuário atualizado do Firestore
      const updatedUser = await AuthService.getUserById(userData.id);
      setUserData(updatedUser);
      // Toast de sucesso
      showToast();
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

  // Função para exclusão de conta
  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!userData) return;
    setShowDeleteModal(false);
    try {
      await AuthService.deleteAccount(userData.id);
      Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso.');
      router.replace('/login');
    } catch (error: any) {
      if (error.message && error.message.includes('login novamente')) {
        Alert.alert('Atenção', error.message);
      } else {
        Alert.alert('Erro', 'Não foi possível excluir sua conta.');
      }
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
        {/* Toast de sucesso no topo */}
        {showSuccessToast && (
          <RNAnimated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              transform: [{ translateY: toastAnim }],
              alignItems: 'center',
            }}
          >
            <View style={{ backgroundColor: '#22C55E', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, marginTop: 16 }}>
              <RNAnimated.Text style={{ fontSize: 22, marginRight: 10, color: '#fff', transform: [{ scale: showSuccessToast ? 1.2 : 1 }] }}>
                ✔️
              </RNAnimated.Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Configurações salvas com sucesso!</Text>
            </View>
          </RNAnimated.View>
        )}
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
        {/* Header com gradiente de fundo */}
        <LinearGradient
          colors={['#EEF2FF', '#F0FDFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, marginBottom: 18, shadowColor: '#2563EB', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1, paddingHorizontal: 0 }}
        >
          <View
            style={[
              styles.header,
              isSmallScreen
                ? { flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 }
                : { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 24, paddingBottom: 16 },
            ]}
          >
            {/* Foto de perfil antes do campo de nome */}
            <View
              style={[
                { alignItems: 'center', marginRight: isSmallScreen ? 0 : 16, marginBottom: isSmallScreen ? 6 : 0 }
              ]}
            >
              <LinearGradient
                colors={['#2563EB', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 6,
                  marginBottom: 4,
                }}
              >
          {uploading ? (
            <ActivityIndicator size="large" color="#22C55E" />
          ) : userData?.photoURL ? (
                  <Animated.Image
                    source={{ uri: userData.photoURL }}
                    style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', opacity: photoAnim, transform: [{ scale: photoAnim }] }}
                  />
          ) : (
                  <TouchableOpacity onPress={handlePickImage} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={32} color="#6B7280" />
            </TouchableOpacity>
          )}
              </LinearGradient>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 2, gap: 8 }}>
                {/* Botão Galeria */}
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 2 }}
                  {...(Platform.OS === 'web' ? { title: 'Escolher da Galeria' } : {})}
                >
                  <ImagePlus size={20} color="#2563EB" />
                </TouchableOpacity>
                {/* Botão Foto */}
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}
                  {...(Platform.OS === 'web' ? { title: 'Tirar Foto' } : {})}
                >
                  <Camera size={20} color="#2563EB" />
            </TouchableOpacity>
              </View>
              {/* Labels pequenas abaixo dos ícones para mobile */}
              {Platform.OS !== 'web' && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 2 }}>
                  <Text style={{ color: '#2563EB', fontSize: 10, textAlign: 'center', width: 36 }}>Galeria</Text>
                  <Text style={{ color: '#2563EB', fontSize: 10, textAlign: 'center', width: 36 }}>Foto</Text>
                </View>
              )}
            </View>
            <View
              style={[
                { flex: 1, position: 'relative', justifyContent: 'center', maxWidth: 260, alignSelf: isSmallScreen ? 'center' : 'flex-start' }
              ]}
            >
              {/* Campo de texto editável para o nome com ícone de lápis dentro */}
              <TextInput
                ref={nameInputRef}
                style={[
                  styles.userName,
                  {
                    paddingRight: 36,
                    fontSize: 22,
                    height: 38,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    fontWeight: 'bold',
                  },
                ]}
                value={userData.name}
                onChangeText={name => setUserData(prev => prev ? { ...prev, name } : prev)}
                placeholder="Seu nome"
                placeholderTextColor="#9CA3AF"
                maxLength={40}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />
              <TouchableOpacity
                onPress={() => nameInputRef.current && nameInputRef.current.focus()}
                activeOpacity={0.7}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  marginTop: -14,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isNameFocused ? '#DBEAFE' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isNameFocused ? 1 : 0,
                  borderColor: '#2563EB',
                  elevation: isNameFocused ? 2 : 0,
                }}
              >
                <Pencil size={14} color={isNameFocused ? '#2563EB' : '#6B7280'} />
            </TouchableOpacity>
              {/* Cargo abaixo do nome */}
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 2, fontWeight: '500' }}>
                {userData.role === 'admin' ? 'Administrador' : 'Colaborador'}
              </Text>
            </View>
          </View>
        </LinearGradient>

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
            {/* Accordion de Privacidade */}
            <TouchableOpacity
              onPress={() => setPrivacyOpen((v) => !v)}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: privacyOpen ? 0 : 12,
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Shield size={20} color="#6B7280" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>Privacidade</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Configurações de privacidade</Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, color: '#6B7280', marginLeft: 8 }}>
                {privacyOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
              </Text>
            </TouchableOpacity>
            {/* Painel expansível de permissões de dados pessoais */}
            {privacyOpen && (
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 0, marginBottom: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderWidth: 1, borderColor: '#F3F4F6', borderTopWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>Permissões de Dados Pessoais</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontSize: 15, color: '#111827', fontWeight: '500' }}>Exibir meu e-mail para outros membros</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Permite que outros vejam seu e-mail no perfil</Text>
                  </View>
                  <Switch
                    value={userData.privacyEmail ?? true}
                    onValueChange={value => handlePrivacyChange('privacyEmail', value)}
                    trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                    thumbColor={userData.privacyEmail ? '#fff' : '#fff'}
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 15, color: '#111827', fontWeight: '500' }}>Exibir minha foto de perfil publicamente</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Permite que outros vejam sua foto de perfil</Text>
                  </View>
                  <Switch
                    value={userData.privacyPhoto ?? true}
                    onValueChange={value => handlePrivacyChange('privacyPhoto', value)}
                    trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                    thumbColor={userData.privacyPhoto ? '#fff' : '#fff'}
                  />
                </View>
                {/* Botão de exclusão de conta */}
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  style={{ marginTop: 24, backgroundColor: '#F87171', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Excluir minha conta</Text>
                </TouchableOpacity>
              </View>
            )}
          </MenuSection>

          <MenuSection title="Suporte">
            <MenuItem
              icon={<HelpCircle size={20} color="#6B7280" />}
              title="Ajuda"
              subtitle="Central de ajuda e suporte"
              onPress={() => router.push('/admin/support')}
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
      {/* Modal de confirmação de exclusão de conta */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#dc2626', marginBottom: 12 }}>Excluir Conta</Text>
            <Text style={{ fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 24 }}>
              Tem certeza que deseja excluir sua conta? Esta ação não poderá ser desfeita.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginRight: 8 }}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={{ color: '#374151', fontSize: 15, fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#F87171', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}
                onPress={confirmDeleteAccount}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>Excluir</Text>
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