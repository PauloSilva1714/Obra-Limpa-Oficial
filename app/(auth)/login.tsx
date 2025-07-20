import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, User, Lock, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import logo from './obra-limpa-logo.png';

const { width } = Dimensions.get('window');

// Detecta se está rodando no web
const isWeb = typeof document !== 'undefined';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const passwordInputRef = useRef<TextInput>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    document.title = 'Obra Limpa';
    
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Aguarda as fontes carregarem
  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={{ width: 90, height: 90, resizeMode: 'contain' }} />
          </View>
          <Text style={styles.titleFallback}>Obra Limpa</Text>
          <Text style={styles.subtitleFallback}>Sistema de Gestão Inteligente</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const success = await AuthService.login(email.trim(), password);

      if (success) {
        const user = await AuthService.getCurrentUser();
        if (user && user.role === 'worker') {
          const currentSite = await AuthService.getCurrentSite();
          if (!currentSite || !currentSite.id) {
            router.replace('/(auth)/site-selection');
          } else {
            router.replace('/tasks');
          }
        } else {
          await AuthService.setCurrentSite(null);
          router.replace('/(auth)/site-selection');
        }
      } else {
        Alert.alert('Erro', 'Credenciais inválidas. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleRegister = (role: 'admin' | 'worker') => {
    router.push({
      pathname: '/(auth)/register',
      params: { role },
    });
  };

  // JSX do formulário
  const LoginForm = (
    <Animated.View 
      style={[
        styles.form,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
      <Text style={styles.loginText}>Faça login para continuar</Text>

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
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />
      </View>

      {/* Campo de Senha */}
      <View style={styles.inputContainer}>
        <Lock size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          ref={passwordInputRef}
          style={styles.input}
          placeholder="Digite sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleLogin}
          textContentType={isWeb ? undefined : 'password'}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          {showPassword ? (
            <EyeOff size={20} color="#6B7280" />
          ) : (
            <Eye size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
      </View>

      {/* Esqueceu a senha */}
      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={handleForgotPassword}
      >
        <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
      </TouchableOpacity>

      {/* Botão de Login */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.loginButtonText}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
        <ArrowRight size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Divisor */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Seção de Registro */}
      <View style={styles.registerSection}>
        <Text style={styles.registerTitle}>Novo por aqui?</Text>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => handleRegister('admin')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>
            Cadastrar como Administrador
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => handleRegister('worker')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>
            Cadastrar como Colaborador
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header fixo no topo */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={{ width: 90, height: 90, resizeMode: 'contain' }} />
          </View>
          <Text style={styles.title}>Obra Limpa</Text>
          <Text style={styles.subtitle}>Sistema de Gestão Inteligente</Text>
        </View>

        {/* Formulário com ou sem <form> */}
        <View style={styles.formContainer}>
          {isWeb ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                handleLogin();
              }}
              autoComplete="on"
              style={{ width: '100%' }}
            >
              {LoginForm}
            </form>
          ) : (
            LoginForm
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18344A', // azul escuro que combina com o logo
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    zIndex: 1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F4FA', // tom claro azul que combina com o logo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#38A3C0', // azul do logo
    shadowColor: '#38A3C0', // azul do logo
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '900',
    letterSpacing: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
  },
  form: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginHorizontal: 16,
  },
  registerSection: {
    alignItems: 'center',
  },
  registerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  registerButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textAlign: 'center',
  },
  titleFallback: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  subtitleFallback: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
});
