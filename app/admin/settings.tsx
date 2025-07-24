import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  Camera, 
  Image, 
  MapPin, 
  Moon, 
  Globe, 
  Shield, 
  Info, 
  LogOut,
  User,
  Lock,
  X,
  Check,
  ExternalLink
} from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { t, setLanguage } from '@/config/i18n';
import * as Linking from 'expo-linking';
import { AboutAppModal } from '@/components/AboutAppModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { PasswordChangedModal } from '@/components/PasswordChangedModal';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: 'toggle' | 'button' | 'navigation' | 'select';
  value?: boolean | string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  options?: { label: string; value: string }[];
}

export default function SettingsScreen() {
  const { isDarkMode, setDarkMode, colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [mediaPermission, setMediaPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPermission, setLoadingPermission] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Referências para os campos de texto
  const currentPasswordRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    checkPermissions();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
    }
  };

  const checkPermissions = async () => {
    try {
      // Verificar permissão de notificações
      const { status: notificationStatus } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(notificationStatus === 'granted');

      // Verificar permissão de câmera
      const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();
      setCameraPermission(cameraStatus === 'granted');

      // Verificar permissão de mídia
      const { status: mediaStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      setMediaPermission(mediaStatus === 'granted');

      // Verificar permissão de localização
      const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(locationStatus === 'granted');
    } catch (error) {
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      if (status === 'granted') {
        Alert.alert(t('success'), 'Notificações ativadas!');
      } else {
        Alert.alert('Permissão negada', 'Você pode ativar as notificações nas configurações do dispositivo.');
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert('Notificações desativadas', 'Você não receberá mais notificações do app.');
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    Alert.alert(
      value ? t('darkModeEnabled') : t('darkModeDisabled'),
      t('themeChangedMessage')
    );
  };

  const handleLanguageSelect = async (selectedLanguage: string) => {
    setCurrentLanguage(selectedLanguage);
    await setLanguage(selectedLanguage);
    setShowLanguageModal(false);
    Alert.alert(t('languageChanged'), t('languageChangedMessage'));
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Alert.alert(
        'Ação não suportada',
        'No navegador, altere as permissões manualmente nas configurações do seu navegador ou sistema.'
      );
    }
  };

  const handleCameraPermission = async () => {
    setLoadingPermission('camera');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    setLoadingPermission(null);
    if (status === 'granted') {
      Alert.alert('Permissão concedida', 'Você pode usar a câmera para tirar fotos das tarefas.');
    } else {
      Alert.alert(
        'Permissão negada',
        'Permissão negada. Para ativar, acesse as configurações do seu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: openAppSettings }
        ]
      );
    }
  };

  const handleMediaPermission = async () => {
    setLoadingPermission('media');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setMediaPermission(status === 'granted');
    setLoadingPermission(null);
    if (status === 'granted') {
      Alert.alert('Permissão concedida', 'Você pode acessar a galeria para selecionar fotos.');
    } else {
      Alert.alert(
        'Permissão negada',
        'Permissão negada. Para ativar, acesse as configurações do seu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: openAppSettings }
        ]
      );
    }
  };

  const handleLocationPermission = async () => {
    setLoadingPermission('location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    setLoadingPermission(null);
    if (status === 'granted') {
      Alert.alert('Permissão concedida', 'Você pode usar a localização para marcar locais das tarefas.');
    } else {
      Alert.alert(
        'Permissão negada',
        'Permissão negada. Para ativar, acesse as configurações do seu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: openAppSettings }
        ]
      );
    }
  };

  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordChangedModal, setShowPasswordChangedModal] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), 'Preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), 'As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('error'), 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Mostrar modal de confirmação personalizado em vez de Alert.alert
    setShowPasswordConfirmModal(true);
  };

  const confirmPasswordChange = async () => {
    try {
      setIsChangingPassword(true);
      
      const result = await AuthService.changePassword(currentPassword, newPassword);
      
      setIsChangingPassword(false);
      setShowPasswordConfirmModal(false);
      
      if (result) {
        setShowPasswordChangedModal(true);
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert(t('error'), t('passwordChangeFailed'));
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setIsChangingPassword(false);
      setShowPasswordConfirmModal(false);
      
      let errorMessage = t('passwordChangeFailed');
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = t('wrongCurrentPassword');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('weakPassword');
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('requiresRecentLogin');
      }
      
      Alert.alert(t('error'), errorMessage);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await AuthService.logout();
      setShowLogoutModal(false);
      router.replace('/(auth)/login');
    } catch (error) {
      setShowLogoutModal(false);
      Alert.alert(t('error'), 'Não foi possível sair da conta.');
    }
  };

  const getLanguageLabel = (code: string) => {
    const languages = {
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (US)',
      'es-ES': 'Español (España)',
      'ht-HT': 'Kreyòl Ayisyen (Haiti)',
    };
    return languages[code as keyof typeof languages] || code;
  };

  const settingsSections: SettingsSection[] = [
    {
      title: t('general'),
      items: [
        {
          id: 'notifications',
          title: t('notifications'),
          subtitle: t('notificationsSubtitle'),
          icon: <Bell size={20} color={colors.textMuted} />,
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: handleNotificationToggle,
        },
        {
          id: 'darkMode',
          title: t('darkMode'),
          subtitle: t('darkModeSubtitle'),
          icon: <Moon size={20} color={colors.textMuted} />,
          type: 'toggle',
          value: isDarkMode,
          onToggle: handleDarkModeToggle,
        },
        {
          id: 'language',
          title: t('language'),
          subtitle: getLanguageLabel(currentLanguage),
          icon: <Globe size={20} color={colors.textMuted} />,
          type: 'button',
          onPress: () => setShowLanguageModal(true),
        },
      ],
    },
    {
      title: t('permissions'),
      items: [
        {
          id: 'camera',
          title: t('camera'),
          subtitle: cameraPermission ? t('allowed') : t('denied'),
          icon: <Camera size={20} color={cameraPermission ? colors.success : colors.error} />,
          type: 'button',
          onPress: handleCameraPermission,
        },
        {
          id: 'media',
          title: t('gallery'),
          subtitle: mediaPermission ? t('allowed') : t('denied'),
          icon: <Image size={20} color={mediaPermission ? colors.success : colors.error} />,
          type: 'button',
          onPress: handleMediaPermission,
        },
        {
          id: 'location',
          title: t('location'),
          subtitle: locationPermission ? t('allowed') : t('denied'),
          icon: <MapPin size={20} color={locationPermission ? colors.success : colors.error} />,
          type: 'button',
          onPress: handleLocationPermission,
        },
      ],
    },
    {
      title: t('account'),
      items: [
        {
          id: 'profile',
          title: t('editProfile'),
          subtitle: t('editProfileSubtitle'),
          icon: <User size={20} color={colors.textMuted} />,
          type: 'navigation',
          onPress: () => router.push('/(tabs)/profile'),
        },
        {
          id: 'password',
          title: t('changePassword'),
          subtitle: t('changePasswordSubtitle'),
          icon: <Lock size={20} color={colors.textMuted} />,
          type: 'button',
          onPress: () => setShowPasswordModal(true),
        },
      ],
    },
    {
      title: t('about'),
      items: [
        {
          id: 'privacy',
          title: t('privacyPolicy'),
          subtitle: t('privacyPolicySubtitle'),
          icon: <Shield size={20} color={colors.textMuted} />,
          type: 'button',
          onPress: () => setShowPrivacyModal(true),
        },
        {
          id: 'about',
          title: t('aboutApp'),
          subtitle: t('aboutAppSubtitle'),
          icon: <Info size={20} color={colors.textMuted} />,
          type: 'button',
          onPress: () => setShowAboutModal(true),
        },
      ],
    },
    {
      title: t('session'),
      items: [
        {
          id: 'logout',
          title: t('logout'),
          subtitle: t('logoutSubtitle'),
          icon: <LogOut size={20} color={colors.error} />,
          type: 'button',
          onPress: handleLogout,
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => {
    const isPermission = ['camera', 'media', 'location'].includes(item.id);
    const isLoading = loadingPermission === item.id;
    let switchValue = false;
    let onSwitch = undefined;
    if (isPermission) {
      if (item.id === 'camera') {
        switchValue = cameraPermission;
        onSwitch = (value: boolean) => {
          if (!cameraPermission) {
            handleCameraPermission();
          } else {
            Alert.alert(
              'Atenção',
              'Para revogar a permissão, acesse as configurações do seu dispositivo.'
            );
          }
        };
      } else if (item.id === 'media') {
        switchValue = mediaPermission;
        onSwitch = (value: boolean) => {
          if (!mediaPermission) {
            handleMediaPermission();
          } else {
            Alert.alert(
              'Atenção',
              'Para revogar a permissão, acesse as configurações do seu dispositivo.'
            );
          }
        };
      } else if (item.id === 'location') {
        switchValue = locationPermission;
        onSwitch = (value: boolean) => {
          if (!locationPermission) {
            handleLocationPermission();
          } else {
            Alert.alert(
              'Atenção',
              'Para revogar a permissão, acesse as configurações do seu dispositivo.'
            );
          }
        };
      }
    }
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingsItem,
          { borderBottomColor: colors.borderLight },
          isPermission && styles.permissionButton,
        ]}
        onPress={item.onPress}
        activeOpacity={isPermission ? 0.7 : 1}
        disabled={item.type === 'toggle' || isLoading}
      >
        <View style={styles.itemLeft}>
          <View style={[
            styles.itemIcon,
            { backgroundColor: colors.borderLight },
            isPermission && { borderColor: item.subtitle === t('allowed') ? colors.success : colors.error, borderWidth: 1 }
          ]}>{item.icon}</View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
            {item.subtitle && (
              <Text style={[
                styles.itemSubtitle,
                { color: item.subtitle === t('allowed') ? colors.success : item.subtitle === t('denied') ? colors.error : colors.textMuted }
              ]}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        {isPermission && (
          <Switch
            value={switchValue}
            onValueChange={onSwitch}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={switchValue ? '#FFFFFF' : '#FFFFFF'}
            disabled={isLoading}
          />
        )}
        {isLoading && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
        )}
        {item.type === 'toggle' && !isPermission && (
          <Switch
            value={item.value as boolean}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        {item.type === 'navigation' && (
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {section.items.map(renderSettingsItem)}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {[
                { label: 'Português (Brasil)', value: 'pt-BR' },
                { label: 'English (US)', value: 'en-US' },
                { label: 'Español (España)', value: 'es-ES' },
                { label: 'Kreyòl Ayisyen (Haiti)', value: 'ht-HT' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[styles.languageOption, { borderBottomColor: colors.borderLight }]}
                  onPress={() => handleLanguageSelect(lang.value)}
                >
                  <Text style={[styles.languageLabel, { color: colors.text }]}>{lang.label}</Text>
                  {currentLanguage === lang.value && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('changePasswordTitle')}</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('currentPassword')}</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    color: colors.text, 
                    backgroundColor: colors.surface 
                  }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Digite sua senha atual"
                  secureTextEntry
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  onSubmitEditing={() => newPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                  ref={currentPasswordRef}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('newPassword')}</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    color: colors.text, 
                    backgroundColor: colors.surface 
                  }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Digite a nova senha"
                  secureTextEntry
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                  ref={newPasswordRef}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('confirmNewPassword')}</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    color: colors.text, 
                    backgroundColor: colors.surface 
                  }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirme a nova senha"
                  secureTextEntry
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={handlePasswordChange}
                  ref={confirmPasswordRef}
                />
              </View>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('privacyPolicy')}</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                <Text style={[styles.privacyTitle, { color: colors.text }]}>Política de Privacidade - Obra Limpa</Text>{'\n\n'}
                
                <Text style={[styles.privacySection, { color: colors.text }]}>1. Informações Coletadas</Text>{'\n'}
                Coletamos apenas as informações necessárias para o funcionamento do aplicativo:{'\n'}
                • Dados de perfil (nome, email, função){'\n'}
                • Fotos e vídeos das tarefas (quando você os adiciona){'\n'}
                • Dados de localização (quando permitido){'\n\n'}
                
                <Text style={[styles.privacySection, { color: colors.text }]}>2. Como Usamos Suas Informações</Text>{'\n'}
                • Para gerenciar tarefas e projetos{'\n'}
                • Para enviar notificações sobre atualizações{'\n'}
                • Para melhorar nossos serviços{'\n\n'}
                
                <Text style={[styles.privacySection, { color: colors.text }]}>3. Compartilhamento de Dados</Text>{'\n'}
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando exigido por lei.{'\n\n'}
                
                <Text style={[styles.privacySection, { color: colors.text }]}>4. Segurança</Text>{'\n'}
                Implementamos medidas de segurança adequadas para proteger suas informações contra acesso não autorizado.{'\n\n'}
                
                <Text style={[styles.privacySection, { color: colors.text }]}>5. Seus Direitos</Text>{'\n'}
                Você tem o direito de:{'\n'}
                • Acessar seus dados pessoais{'\n'}
                • Corrigir informações incorretas{'\n'}
                • Solicitar a exclusão de seus dados{'\n'}
                • Revogar consentimentos{'\n\n'}
                
                <Text style={[styles.privacySection, { color: colors.text }]}>6. Contato</Text>{'\n'}
                Para dúvidas sobre esta política, entre em contato conosco através do suporte do aplicativo.{'\n\n'}
                
                <Text style={[styles.privacySection, { color: colors.text }]}>7. Atualizações</Text>{'\n'}
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AboutAppModal visible={showAboutModal} onClose={() => setShowAboutModal(false)} />

      {/* Confirmation Modal for Password Change */}
      <ConfirmationModal
        visible={showPasswordConfirmModal}
        title="Confirmar alteração de senha"
        message="Tem certeza que deseja alterar sua senha? Esta ação não pode ser desfeita."
        onConfirm={confirmPasswordChange}
        onCancel={() => setShowPasswordConfirmModal(false)}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />

      {/* Confirmation Modal for Logout */}
      <ConfirmationModal
        visible={showLogoutModal}
        title={t('logout')}
        message="Tem certeza que deseja sair da sua conta?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        confirmText={t('logout')}
        cancelText={t('cancel')}
      />

      {/* Password Changed Success Modal */}
      <PasswordChangedModal
        visible={showPasswordChangedModal}
        onClose={() => setShowPasswordChangedModal(false)}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  chevron: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalBody: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  languageLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  privacyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  privacyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  privacySection: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionButton: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  settingsButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(33,150,243,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});