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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, User, Lock, Eye, EyeOff, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { shadows } from '../../utils/shadowUtils';

const logo = require('./obra-limpa-logo.png');

const { width, height } = Dimensions.get('window');

// Detecta se está rodando no web
const isWeb = typeof document !== 'undefined';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [emailFocusAnim] = useState(new Animated.Value(0));
  const [passwordFocusAnim] = useState(new Animated.Value(0));
  const [buttonScaleAnim] = useState(new Animated.Value(1));
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  const passwordInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);

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
          <Text style={styles.subtitleFallback}>Sistema de Gestão Inteligente</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleInputFocus = (inputType: 'email' | 'password') => {
    const anim = inputType === 'email' ? emailFocusAnim : passwordFocusAnim;
    Animated.timing(anim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = (inputType: 'email' | 'password') => {
    const anim = inputType === 'email' ? emailFocusAnim : passwordFocusAnim;
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 4000);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showMessage('error', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const success = await AuthService.login(email.trim(), password);

      if (success) {
        showMessage('success', 'Login realizado com sucesso!');
        const user = await AuthService.getCurrentUser();
        if (user && user.role === 'worker') {
          const currentSite = await AuthService.getCurrentSite();
          if (!currentSite || !currentSite.id) {
            router.replace('/(auth)/site-selection');
          } else {
            router.replace('/tasks' as any);
          }
        } else {
          await AuthService.setCurrentSite(null);
          router.replace('/(auth)/site-selection');
        }
      } else {
        showMessage('error', 'Credenciais inválidas. Tente novamente.');
      }
    } catch (error) {
      showMessage('error', 'Erro ao fazer login. Tente novamente.');
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

      {/* Mensagem de feedback */}
      {message.type && (
        <Animated.View 
          style={[
            styles.messageContainer,
            message.type === 'success' ? styles.successMessage : styles.errorMessage
          ]}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} color="#10B981" />
          ) : (
            <AlertCircle size={20} color="#EF4444" />
          )}
          <Text style={[
            styles.messageText,
            message.type === 'success' ? styles.successText : styles.errorText
          ]}>
            {message.text}
          </Text>
        </Animated.View>
      )}

      {/* Campo de Email */}
      <Animated.View 
        style={[
          styles.inputContainer,
          {
            borderColor: emailFocusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#E5E7EB', '#3B82F6']
            }),
            borderWidth: emailFocusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 2]
            })
          }
        ]}
      >
        <Mail size={20} color={emailFocusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['#6B7280', '#3B82F6']
        })} style={styles.inputIcon} />
        <TextInput
          ref={emailInputRef}
          style={styles.input}
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          onFocus={() => handleInputFocus('email')}
          onBlur={() => handleInputBlur('email')}
        />
      </Animated.View>

      {/* Campo de Senha */}
      <Animated.View 
        style={[
          styles.inputContainer,
          {
            borderColor: passwordFocusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#E5E7EB', '#3B82F6']
            }),
            borderWidth: passwordFocusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 2]
            })
          }
        ]}
      >
        <Lock size={20} color={passwordFocusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['#6B7280', '#3B82F6']
        })} style={styles.inputIcon} />
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
          onFocus={() => handleInputFocus('password')}
          onBlur={() => handleInputBlur('password')}
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
      </Animated.View>

      {/* Esqueceu a senha */}
      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={handleForgotPassword}
      >
        <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
      </TouchableOpacity>

      {/* Botão de Login */}
      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.buttonDisabled]}
          onPress={() => {
            handleButtonPress();
            handleLogin();
          }}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Entrar</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

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
        {isWeb ? (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            overflowY: 'auto', 
            flex: 1,
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}>
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Header para Web */}
            <div style={{
              height: Math.min(300, height * 0.35),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: 32,
              paddingRight: 32,
              paddingTop: 20,
              backgroundColor: '#18344A',
              zIndex: 10,
            }}>
              <div style={{
                width: Math.min(120, width * 0.25),
                height: Math.min(120, width * 0.25),
                borderRadius: Math.min(60, width * 0.125),
                backgroundColor: 'transparent',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 32,
                border: 'none',
                boxShadow: 'none',
              }}>
                <img 
                  src="obra-limpa-logo.png" 
                  alt="Obra Limpa Logo"
                  style={{ 
                    width: 90, 
                    height: 90,
                    objectFit: 'contain',
                    borderRadius: '50%'
                  }}
                  onLoad={() => console.log('Logo web carregado com sucesso')}
                  onError={(error) => console.log('Erro ao carregar logo web:', error)}
                />
              </div>
              <h1 style={{
                fontSize: Math.min(48, width * 0.1),
                fontFamily: 'Inter-Bold, sans-serif',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 16,
                fontWeight: '900',
                letterSpacing: '2px',
                margin: 0,
              }}>Obra Limpa</h1>
              <p style={{
                fontSize: Math.min(20, width * 0.045),
                fontFamily: 'Inter-Regular, sans-serif',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                letterSpacing: '0.8px',
                margin: 0,
              }}>Sistema de Gestão Inteligente</p>
            </div>
            
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
          </div>
        ) : (
          <>
            {/* Header FIXO no topo */}
            <Animated.View 
              style={[
                styles.headerContainer, 
                { backgroundColor: '#18344A' },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <Image 
                  source={logo} 
                  resizeMode="contain" 
                  style={{ 
                    width: 90, 
                    height: 90,
                    borderRadius: 45
                  }}
                  onLoad={() => console.log('Logo mobile carregado com sucesso')}
                  onError={(error) => console.log('Erro ao carregar logo mobile:', error)}
                />
                {/* Fallback caso o logo não carregue */}
                <View style={styles.logoFallback}>
                  <Building2 size={48} color="#38A3C0" strokeWidth={3} />
                </View>
              </View>
              <Text style={styles.title}>Obra Limpa</Text>
              <Text style={styles.subtitle}>Sistema de Gestão Inteligente</Text>
            </Animated.View>

            <ScrollView 
              contentContainerStyle={{ flexGrow: 1 }} 
              style={{ flex: 1 }} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formContainer}>
                {LoginForm}
              </View>
            </ScrollView>
          </>
        )}
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
    backgroundColor: '#18344A',
    zIndex: 10, // Garantir que apareça acima
  },
  logoContainer: {
    width: Math.min(120, width * 0.25),
    height: Math.min(120, width * 0.25),
    borderRadius: Math.min(60, width * 0.125),
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 0,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
      default: {
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
    }),
  },
  logoFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4FA',
    borderRadius: Math.min(60, width * 0.125),
    borderWidth: 3,
    borderColor: '#38A3C0',
  },
  title: {
    fontSize: Math.min(48, width * 0.1),
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
    fontSize: Math.min(20, width * 0.045),
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
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
    marginTop: -32, // Sobreposição com o header
    zIndex: 2,
  },
  form: {
    flex: 1,
    paddingHorizontal: Math.max(32, width * 0.08),
    paddingTop: 40,
    paddingBottom: 40,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  successMessage: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  errorMessage: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  messageText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  successText: {
    color: '#065F46',
  },
  errorText: {
    color: '#991B1B',
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
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
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
    minHeight: 56,
    ...Platform.select({
      web: {
        backgroundColor: '#3B82F6',
        boxShadow: '0px 8px 25px rgba(59, 130, 246, 0.4)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0px 12px 30px rgba(59, 130, 246, 0.5)',
        },
      },
      default: {
        elevation: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
    }),
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    boxShadow: 'none',
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
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#E5E7EB',
        },
      },
    }),
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
