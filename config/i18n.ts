import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

// Traduções para todos os idiomas
type SupportedLocales = 'pt-BR' | 'en-US' | 'es-ES' | 'ht-HT';

const translations = {
  'pt-BR': {
    // Configurações
    settings: 'Configurações',
    general: 'Geral',
    permissions: 'Permissões',
    account: 'Conta',
    about: 'Sobre',
    session: 'Sessão',
    
    // Configurações Gerais
    notifications: 'Notificações',
    notificationsSubtitle: 'Receber alertas de tarefas',
    darkMode: 'Modo escuro',
    darkModeSubtitle: 'Alterar tema do aplicativo',
    language: 'Idioma',
    languageSubtitle: 'Português (Brasil)',
    
    // Permissões
    camera: 'Câmera',
    gallery: 'Galeria',
    location: 'Localização',
    allowed: 'Permitido',
    denied: 'Negado',
    
    // Conta
    editProfile: 'Editar perfil',
    editProfileSubtitle: 'Alterar informações pessoais',
    changePassword: 'Alterar senha',
    changePasswordSubtitle: 'Modificar senha de acesso',
    
    // Sobre
    privacyPolicy: 'Política de privacidade',
    privacyPolicySubtitle: 'Como protegemos seus dados',
    aboutApp: 'Sobre o aplicativo',
    aboutAppSubtitle: 'Versão 1.0.0',
    
    // Sessão
    logout: 'Sair da conta',
    logoutSubtitle: 'Fazer logout do aplicativo',
    
    // Modais
    selectLanguage: 'Selecionar Idioma',
    changePasswordTitle: 'Alterar Senha',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    confirmNewPassword: 'Confirmar nova senha',
    save: 'Salvar',
    cancel: 'Cancelar',
    
    // Alertas
    success: 'Sucesso',
    error: 'Erro',
    passwordChanged: 'Senha alterada com sucesso!',
    languageChanged: 'Idioma alterado',
    languageChangedMessage: 'A alteração será aplicada na próxima vez que você abrir o app.',
    darkModeEnabled: 'Modo escuro ativado',
    darkModeDisabled: 'Modo escuro desativado',
    themeChangedMessage: 'A alteração será aplicada na próxima vez que você abrir o app.',
    
    // Tarefas
    tasks: 'Tarefas',
    pending: 'Pendente',
    inProgress: 'Em Andamento',
    completed: 'Concluída',
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    
    // Admin
    admin: 'Admin',
    manageWorkers: 'Gerenciar Colaboradores',
    inviteWorker: 'Convidar Colaborador',
    statistics: 'Estatísticas Gerais',
    systemSettings: 'Configurações do Sistema',
    
    // Navegação
    progress: 'Progresso',
    invites: 'Convites',
    profile: 'Perfil',
  },
  
  'en-US': {
    // Settings
    settings: 'Settings',
    general: 'General',
    permissions: 'Permissions',
    account: 'Account',
    about: 'About',
    session: 'Session',
    
    // General Settings
    notifications: 'Notifications',
    notificationsSubtitle: 'Receive task alerts',
    darkMode: 'Dark mode',
    darkModeSubtitle: 'Change app theme',
    language: 'Language',
    languageSubtitle: 'English (US)',
    
    // Permissions
    camera: 'Camera',
    gallery: 'Gallery',
    location: 'Location',
    allowed: 'Allowed',
    denied: 'Denied',
    
    // Account
    editProfile: 'Edit profile',
    editProfileSubtitle: 'Change personal information',
    changePassword: 'Change password',
    changePasswordSubtitle: 'Modify access password',
    
    // About
    privacyPolicy: 'Privacy policy',
    privacyPolicySubtitle: 'How we protect your data',
    aboutApp: 'About the app',
    aboutAppSubtitle: 'Version 1.0.0',
    
    // Session
    logout: 'Logout',
    logoutSubtitle: 'Sign out of the app',
    
    // Modals
    selectLanguage: 'Select Language',
    changePasswordTitle: 'Change Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmNewPassword: 'Confirm new password',
    save: 'Save',
    cancel: 'Cancel',
    
    // Alerts
    success: 'Success',
    error: 'Error',
    passwordChanged: 'Password changed successfully!',
    languageChanged: 'Language changed',
    languageChangedMessage: 'The change will be applied the next time you open the app.',
    darkModeEnabled: 'Dark mode enabled',
    darkModeDisabled: 'Dark mode disabled',
    themeChangedMessage: 'The change will be applied the next time you open the app.',
    
    // Tasks
    tasks: 'Tasks',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    
    // Admin
    admin: 'Admin',
    manageWorkers: 'Manage Workers',
    inviteWorker: 'Invite Worker',
    statistics: 'General Statistics',
    systemSettings: 'System Settings',
    
    // Navigation
    progress: 'Progress',
    invites: 'Invites',
    profile: 'Profile',
  },
  
  'es-ES': {
    // Configuración
    settings: 'Configuración',
    general: 'General',
    permissions: 'Permisos',
    account: 'Cuenta',
    about: 'Acerca de',
    session: 'Sesión',
    
    // Configuración General
    notifications: 'Notificaciones',
    notificationsSubtitle: 'Recibir alertas de tareas',
    darkMode: 'Modo oscuro',
    darkModeSubtitle: 'Cambiar tema de la aplicación',
    language: 'Idioma',
    languageSubtitle: 'Español (España)',
    
    // Permisos
    camera: 'Cámara',
    gallery: 'Galería',
    location: 'Ubicación',
    allowed: 'Permitido',
    denied: 'Denegado',
    
    // Cuenta
    editProfile: 'Editar perfil',
    editProfileSubtitle: 'Cambiar información personal',
    changePassword: 'Cambiar contraseña',
    changePasswordSubtitle: 'Modificar contraseña de acceso',
    
    // Acerca de
    privacyPolicy: 'Política de privacidad',
    privacyPolicySubtitle: 'Cómo protegemos tus datos',
    aboutApp: 'Acerca de la aplicación',
    aboutAppSubtitle: 'Versión 1.0.0',
    
    // Sesión
    logout: 'Cerrar sesión',
    logoutSubtitle: 'Salir de la aplicación',
    
    // Modales
    selectLanguage: 'Seleccionar Idioma',
    changePasswordTitle: 'Cambiar Contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmNewPassword: 'Confirmar nueva contraseña',
    save: 'Guardar',
    cancel: 'Cancelar',
    
    // Alertas
    success: 'Éxito',
    error: 'Error',
    passwordChanged: '¡Contraseña cambiada exitosamente!',
    languageChanged: 'Idioma cambiado',
    languageChangedMessage: 'El cambio se aplicará la próxima vez que abras la aplicación.',
    darkModeEnabled: 'Modo oscuro habilitado',
    darkModeDisabled: 'Modo oscuro deshabilitado',
    themeChangedMessage: 'El cambio se aplicará la próxima vez que abras la aplicación.',
    
    // Tareas
    tasks: 'Tareas',
    pending: 'Pendiente',
    inProgress: 'En Progreso',
    completed: 'Completada',
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    
    // Admin
    admin: 'Admin',
    manageWorkers: 'Gestionar Trabajadores',
    inviteWorker: 'Invitar Trabajador',
    statistics: 'Estadísticas Generales',
    systemSettings: 'Configuración del Sistema',
    
    // Navegación
    progress: 'Progreso',
    invites: 'Invitaciones',
    profile: 'Perfil',
  },
  
  'ht-HT': {
    // Konfigirasyon
    settings: 'Konfigirasyon',
    general: 'Jeneral',
    permissions: 'Pèmisyon',
    account: 'Kont',
    about: 'Sou',
    session: 'Sesyon',
    
    // Konfigirasyon Jeneral
    notifications: 'Notifikasyon',
    notificationsSubtitle: 'Resevwa alèt tach',
    darkMode: 'Mòd fènwa',
    darkModeSubtitle: 'Chanje tèm aplikasyon an',
    language: 'Lang',
    languageSubtitle: 'Kreyòl Ayisyen (Haiti)',
    
    // Pèmisyon
    camera: 'Kamera',
    gallery: 'Galri',
    location: 'Kote',
    allowed: 'Pèmèt',
    denied: 'Refize',
    
    // Kont
    editProfile: 'Edite pwofil',
    editProfileSubtitle: 'Chanje enfòmasyon pèsonèl',
    changePassword: 'Chanje modpas',
    changePasswordSubtitle: 'Modifye modpas aksè',
    
    // Sou
    privacyPolicy: 'Politik enfòmasyon prive',
    privacyPolicySubtitle: 'Kijan nou pwoteje done ou yo',
    aboutApp: 'Sou aplikasyon an',
    aboutAppSubtitle: 'Vèsyon 1.0.0',
    
    // Sesyon
    logout: 'Dekonekte',
    logoutSubtitle: 'Soti nan aplikasyon an',
    
    // Modal
    selectLanguage: 'Chwazi Lang',
    changePasswordTitle: 'Chanje Modpas',
    currentPassword: 'Modpas aktyèl',
    newPassword: 'Nouvo modpas',
    confirmNewPassword: 'Konfime nouvo modpas',
    save: 'Sove',
    cancel: 'Anile',
    
    // Alèt
    success: 'Siksè',
    error: 'Erè',
    passwordChanged: 'Modpas chanje avèk siksè!',
    languageChanged: 'Lang chanje',
    languageChangedMessage: 'Chanjman an ap aplike pwochen fwa ou louvri aplikasyon an.',
    darkModeEnabled: 'Mòd fènwa aktive',
    darkModeDisabled: 'Mòd fènwa dezaktive',
    themeChangedMessage: 'Chanjman an ap aplike pwochen fwa ou louvri aplikasyon an.',
    
    // Tach
    tasks: 'Tach',
    pending: 'Annatant',
    inProgress: 'An Pwogrè',
    completed: 'Konplete',
    low: 'Ba',
    medium: 'Mwayen',
    high: 'Wo',
    
    // Admin
    admin: 'Admin',
    manageWorkers: 'Jere Travayè',
    inviteWorker: 'Envite Travayè',
    statistics: 'Estatistik Jeneral',
    systemSettings: 'Konfigirasyon Sistèm',
    
    // Navigasyon
    progress: 'Pwogrè',
    invites: 'Envitasyon',
    profile: 'Pwofil',
  },
};

// Estado global do idioma
let currentLocale = 'pt-BR';

// Função para obter tradução
export const t = (key: string): string => {
  const currentTranslations = translations[currentLocale as SupportedLocales] || translations['pt-BR'];
  return currentTranslations[key as keyof TranslationKeys] || key;
};

// Função para carregar idioma salvo
export const loadSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    const defaultLanguage = savedLanguage || 'pt-BR';
    currentLocale = defaultLanguage;
    return defaultLanguage;
  } catch (error) {
    console.log('Erro ao carregar idioma:', error);
    currentLocale = 'pt-BR';
    return 'pt-BR';
  }
};

// Função para definir idioma
export const setLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('language', language);
    currentLocale = language;
  } catch (error) {
    console.log('Erro ao salvar idioma:', error);
  }
};

// Objeto i18n compatível
const i18n = {
  t,
  locale: currentLocale,
  translations,
  fallbacks: true,
};

// Hook para usar traduções em componentes React
export const useTranslation = () => {
  const [locale, setLocaleState] = useState(currentLocale);

  useEffect(() => {
    loadSavedLanguage().then((savedLocale) => {
      setLocaleState(savedLocale);
    });
  }, []);

  const t = (key: string): string => {
    const currentTranslations = translations[locale as SupportedLocales] || translations['pt-BR'];
    return currentTranslations[key as keyof TranslationKeys] || key;
  };

  const setLanguage = async (language: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('language', language);
      currentLocale = language;
      setLocaleState(language);
    } catch (error) {
      console.log('Erro ao salvar idioma:', error);
    }
  };

  return {
    t,
    locale,
    setLanguage,
    translations,
  };
};

// Definir tipos após o objeto translations
type TranslationKeys = typeof translations['pt-BR'];
type TranslationsType = typeof translations;

export default i18n; 