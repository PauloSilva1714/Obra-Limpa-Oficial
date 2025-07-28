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
import { Building2, User, Lock, Eye, EyeOff, Mail, ArrowRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react-native';
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
  
  // Animações modernas
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [logoScaleAnim] = useState(new Animated.Value(0.8));
  const [logoRotateAnim] = useState(new Animated.Value(0));
  const [formSlideAnim] = useState(new Animated.Value(100));
  const [buttonScaleAnim] = useState(new Animated.Value(1));
  const [buttonGlowAnim] = useState(new Animated.Value(0));
  const [emailFocusAnim] = useState(new Animated.Value(0));
  const [passwordFocusAnim] = useState(new Animated.Value(0));
  const [particlesAnim] = useState(new Animated.Value(0));
  
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
    // Só definir o título se estivermos no ambiente web
    if (typeof document !== 'undefined') {
      document.title = 'Obra Limpa';
    }
    
    // Sequência de animações modernas
    const animationSequence = async () => {
      // Animação do logo
      Animated.parallel([
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();

      // Animação de entrada do formulário
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(formSlideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ]).start();
      }, 300);

      // Animação de partículas
      setTimeout(() => {
        Animated.loop(
          Animated.timing(particlesAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          })
        ).start();
      }, 500);
    };

    animationSequence();
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
        useNativeDriver: false,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Background com gradiente animado */}
      <View style={styles.backgroundGradient}>
        <Animated.View 
          style={[
            styles.particle1,
            {
              opacity: particlesAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.8, 0.3],
              }),
              transform: [
                {
                  translateY: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.particle2,
            {
              opacity: particlesAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.6, 0.2],
              }),
              transform: [
                {
                  translateY: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com logo animado */}
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: logoScaleAnim,
                },
                {
                  rotate: logoRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={logo} 
              resizeMode="contain" 
              style={styles.logo}
              onLoad={() => {
                Animated.timing(logoScaleAnim, {
                  toValue: 1,
                  duration: 800,
                  useNativeDriver: false,
                }).start();
              }}
            />
          </View>
          <Text style={styles.title}>Obra Limpa</Text>
          <Text style={styles.subtitle}>Sistema de Gestão Inteligente</Text>
          <View style={styles.sparklesContainer}>
            <Sparkles size={16} color="#3B82F6" />
            <Sparkles size={12} color="#1D4ED8" />
            <Sparkles size={14} color="#3B82F6" />
          </View>
        </Animated.View>

        {/* Formulário animado */}
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: formSlideAnim,
                },
              ],
            },
          ]}
        >
          {/* Campo de Email */}
          <View style={styles.inputGroup}>
            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  borderColor: emailFocusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#E5E7EB', '#3B82F6'],
                  }),
                  transform: [
                    {
                      scale: emailFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Digite seu email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                onFocus={() => handleInputFocus('email')}
                onBlur={() => handleInputBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </Animated.View>
          </View>

          {/* Campo de Senha */}
          <View style={styles.inputGroup}>
            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  borderColor: passwordFocusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#E5E7EB', '#3B82F6'],
                  }),
                  transform: [
                    {
                      scale: passwordFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                onFocus={() => handleInputFocus('password')}
                onBlur={() => handleInputBlur('password')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Botão de Login */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{ scale: buttonScaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              onPressIn={handleButtonPress}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Animated.View
                style={[
                  styles.buttonGlow,
                  {
                    opacity: buttonGlowAnim,
                  },
                ]}
              />
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Entrar</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Links de navegação */}
          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.linkText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
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

        {/* Mensagem de feedback */}
        {message.type && (
          <Animated.View
            style={[
              styles.messageContainer,
              {
                backgroundColor: message.type === 'success' ? '#10B981' : '#EF4444',
              },
            ]}
          >
            {message.type === 'success' ? (
              <CheckCircle size={20} color="#FFFFFF" />
            ) : (
              <AlertCircle size={20} color="#FFFFFF" />
            )}
            <Text style={styles.messageText}>{message.text}</Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Platform.select({
      web: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      default: '#667eea',
    }),
    zIndex: -1,
  },
  particle1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    opacity: 0.3,
  },
  particle2: {
    position: 'absolute',
    top: '60%',
    right: '15%',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    opacity: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  title: {
    fontSize: Math.min(width * 0.08, 32),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  subtitle: {
    fontSize: Math.min(width * 0.045, 18),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 3px rgba(0, 0, 0, 0.4)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
      },
    }),
  },
  sparklesContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 24,
    padding: 32,
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      default: {
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
    }),
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  buttonContainer: {
    marginTop: 32,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backgroundColor: '#3B82F6',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
        transition: 'all 0.2s ease',
      },
      default: {
        elevation: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    ...Platform.select({
      web: {
        backgroundColor: '#9CA3AF',
        boxShadow: 'none',
      },
      default: {
        elevation: 0,
        shadowOpacity: 0,
      },
    }),
  },
  buttonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    opacity: 0,
    zIndex: -1,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  linksContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  linkButton: {
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  registerSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  registerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#333',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      web: {
        backgroundColor: '#3B82F6',
        boxShadow: '0 8px 15px rgba(59, 130, 246, 0.3)',
      },
      default: {
        elevation: 6,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  registerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleFallback: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitleFallback: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
