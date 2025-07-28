import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import logo from './obra-limpa-logo.png';

const { width, height } = Dimensions.get('window');

// Detecta se está rodando no web
const isWeb = typeof document !== 'undefined';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    document.title = 'Recuperar Senha - Obra Limpa';
    
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Aguarda as fontes carregarem
  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image source={logo} resizeMode="contain" style={{ width: 90, height: 90 }} />
          </View>
          <Text style={styles.titleFallback}>Obra Limpa</Text>
          <Text style={styles.subtitleFallback}>Recuperar Senha</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu e-mail.');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erro', 'Por favor, digite um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.sendPasswordResetEmail(email.trim());
      setEmailSent(true);
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      
      let errorMessage = 'Erro ao enviar email de recuperação. Tente novamente.';
      
      if (error.message === 'Email não encontrado no sistema') {
        errorMessage = 'Este e-mail não está cadastrado no sistema.';
      } else if (error.message === 'Email inválido') {
        errorMessage = 'E-mail inválido.';
      } else if (error.message === 'Muitas tentativas. Tente novamente em alguns minutos.') {
        errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
      } else if (error.message === 'Erro de conexão. Verifique sua internet e tente novamente.') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Este e-mail não está cadastrado no sistema.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    console.log('Navegando para login...');
    // Navegar para a tela de login
    router.push('/(auth)/login');
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setEmail('');
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image source={logo} resizeMode="contain" style={{ width: 90, height: 90 }} />
          </View>
          <Text style={styles.title}>Obra Limpa</Text>
          <Text style={styles.subtitle}>Recuperar Senha</Text>
        </View>

        <View style={styles.formContainer}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
          <Animated.View 
            style={[
              styles.form,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.successContainer}>
              <CheckCircle size={80} color="#10B981" style={styles.successIcon} />
              <Text style={styles.successTitle}>Email Enviado!</Text>
              <Text style={styles.successMessage}>
                Enviamos um link de recuperação para:
              </Text>
              <Text style={styles.emailText}>{email}</Text>
              <Text style={styles.instructions}>
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                O link expira em 1 hora.
              </Text>
            </View>

              {/* Botão principal para voltar ao login */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={handleBackToLogin}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
              <Text style={styles.backToLoginText}>Voltar ao Login</Text>
            </TouchableOpacity>

              {/* Botão secundário para reenviar */}
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendEmail}
              activeOpacity={0.8}
            >
              <Text style={styles.resendText}>Reenviar Email</Text>
            </TouchableOpacity>
          </Animated.View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header fixo no topo */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image source={logo} resizeMode="contain" style={{ width: 90, height: 90 }} />
          </View>
          <Text style={styles.title}>Obra Limpa</Text>
          <Text style={styles.subtitle}>Recuperar Senha</Text>
        </View>

        {/* Form com scroll se necessário */}
        <View style={styles.formContainer}>
          <Animated.View 
            style={[
              styles.form,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.welcomeText}>Esqueceu sua senha?</Text>
            <Text style={styles.loginText}>
              Digite seu e-mail e enviaremos um link para redefinir sua senha
            </Text>

            {/* Campo de Email */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
            </View>

            {/* Botão de Enviar */}
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.buttonDisabled]}
              onPress={handleSendResetEmail}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Botão Voltar */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color="#6B7280" />
              <Text style={styles.backButtonText}>Voltar ao Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18344A',
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    height: Math.min(300, height * 0.35),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    zIndex: 1,
  },
  logoContainer: {
    width: Math.min(120, width * 0.25),
    height: Math.min(120, width * 0.25),
    borderRadius: Math.min(60, width * 0.125),
    backgroundColor: '#E6F4FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#38A3C0',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 25px rgba(56, 163, 192, 0.3)',
      },
      default: {
        elevation: 8,
        boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  title: {
    fontSize: Math.min(48, width * 0.1),
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: Math.min(20, width * 0.045),
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  titleFallback: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleFallback: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Platform.select({
      web: {
        boxShadow: '0px -8px 25px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 8,
        boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
    zIndex: 2,
  },
  form: {
    flex: 1,
    paddingHorizontal: Math.max(32, width * 0.08),
    paddingTop: 40,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: Math.min(24, width * 0.06),
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginText: {
    fontSize: Math.min(16, width * 0.04),
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 20,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    paddingVertical: 16,
  },
  sendButton: {
    backgroundColor: '#3bf644ff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  backToLoginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  resendButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#3B82F6',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});