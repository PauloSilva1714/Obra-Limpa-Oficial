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
import { Building2, User, Lock, Eye, EyeOff, Mail, ArrowRight, CheckCircle, AlertCircle, Sparkles, Zap } from 'lucide-react-native';
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

  // Animações modernas e elegantes
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [logoScaleAnim] = useState(new Animated.Value(0.3));
  const [logoRotateAnim] = useState(new Animated.Value(0));
  const [formSlideAnim] = useState(new Animated.Value(150));
  const [buttonScaleAnim] = useState(new Animated.Value(1));
  const [buttonGlowAnim] = useState(new Animated.Value(0));
  const [emailFocusAnim] = useState(new Animated.Value(0));
  const [passwordFocusAnim] = useState(new Animated.Value(0));
  const [particlesAnim] = useState(new Animated.Value(0));
  const [titleAnim] = useState(new Animated.Value(0));
  const [subtitleAnim] = useState(new Animated.Value(0));
    const [sparklesAnim] = useState(new Animated.Value(0));
  const [backgroundAnim] = useState(new Animated.Value(0));
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalAnim] = useState(new Animated.Value(0));

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

    // Sequência de animações modernas e elegantes
    const animationSequence = async () => {
      // Animação de fundo primeiro
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      // Animação do logo com efeito de entrada dramática
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(logoScaleAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(logoScaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
        ]).start();
      }, 300);

             // Animação de pulse suave do logo
       setTimeout(() => {
         Animated.loop(
           Animated.sequence([
             Animated.timing(logoScaleAnim, {
               toValue: 1.05,
               duration: 2000,
               useNativeDriver: false,
             }),
             Animated.timing(logoScaleAnim, {
               toValue: 1,
               duration: 2000,
               useNativeDriver: false,
             }),
           ])
         ).start();
       }, 1000);

      // Animação de entrada do formulário com efeito de slide
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(formSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]).start();
      }, 600);

      // Animação do título com efeito de digitação
      setTimeout(() => {
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }).start();
      }, 1000);

      // Animação do subtítulo com delay
      setTimeout(() => {
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, 1400);

      // Animação de sparkles
      setTimeout(() => {
        Animated.loop(
          Animated.timing(sparklesAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          })
        ).start();
      }, 1800);

      // Animação de partículas mais dinâmica
      setTimeout(() => {
        Animated.loop(
          Animated.timing(particlesAnim, {
            toValue: 1,
            duration: 4000,
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
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = (inputType: 'email' | 'password') => {
    const anim = inputType === 'email' ? emailFocusAnim : passwordFocusAnim;
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
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

  const showErrorModal = () => {
    setErrorModalVisible(true);
    Animated.timing(errorModalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const hideErrorModal = () => {
    Animated.timing(errorModalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setErrorModalVisible(false);
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    setLoading(true);
    try {
      const success = await AuthService.login(email.trim(), password);

      if (success) {
        // Iniciar monitoramento de presença
        try {
          await AuthService.startPresenceMonitoring();
        } catch (presenceError) {
          console.error('Erro ao iniciar monitoramento de presença:', presenceError);
        }

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
        showErrorModal();
      }
    } catch (error) {
      showErrorModal();
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
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            opacity: backgroundAnim,
            transform: [
              {
                scale: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.1, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Partículas animadas */}
        <Animated.View
          style={[
            styles.particle1,
            {
              opacity: particlesAnim.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0.2, 0.8, 0.3, 0.9, 0.2],
              }),
              transform: [
                {
                  translateY: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30],
                  }),
                },
                {
                  translateX: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
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
                outputRange: [0.1, 0.7, 0.1],
              }),
              transform: [
                {
                  translateY: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 25],
                  }),
                },
                {
                  translateX: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle3,
            {
              opacity: particlesAnim.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0.3, 0.9, 0.4, 0.3],
              }),
              transform: [
                {
                  translateY: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -40],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>

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
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                  {
                    scale: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            Obra Limpa
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: subtitleAnim,
                transform: [
                  {
                    translateY: subtitleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Sistema de Gestão Inteligente
          </Animated.Text>
          <Animated.View
            style={[
              styles.sparklesContainer,
              {
                opacity: sparklesAnim,
                transform: [
                  {
                    scale: sparklesAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.1, 0.8],
                    }),
                  },
                ],
              },
            ]}
          >
            <Sparkles size={16} color="#3B82F6" />
            <Zap size={12} color="#1D4ED8" />
            <Sparkles size={14} color="#3B82F6" />
          </Animated.View>
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
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
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

                     {/* Modal de Erro Inline */}
           {errorModalVisible && (
             <Animated.View
               style={[
                 styles.errorModalInline,
                 {
                   opacity: errorModalAnim,
                   transform: [
                     {
                       scale: errorModalAnim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [0.8, 1],
                       }),
                     },
                     {
                       translateY: errorModalAnim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [20, 0],
                       }),
                     },
                   ],
                 },
               ]}
             >
               <View style={styles.errorModalInlineHeader}>
                 <View style={styles.errorIconContainerInline}>
                   <AlertCircle size={20} color="#FFFFFF" />
                 </View>
                 <Text style={styles.errorModalInlineTitle}>Credenciais Inválidas</Text>
               </View>
               <Text style={styles.errorModalInlineText}>
                 O email ou senha informados estão incorretos. Por favor, verifique suas credenciais e tente novamente.
               </Text>
               <TouchableOpacity
                 style={styles.errorModalInlineButton}
                 onPress={hideErrorModal}
                 activeOpacity={0.8}
               >
                 <Text style={styles.errorModalInlineButtonText}>Entendi</Text>
               </TouchableOpacity>
             </Animated.View>
           )}

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
    top: '15%',
    left: '8%',
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    opacity: 0.3,
  },
  particle2: {
    position: 'absolute',
    top: '70%',
    right: '12%',
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    opacity: 0.2,
  },
  particle3: {
    position: 'absolute',
    top: '40%',
    left: '85%',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    opacity: 0.3,
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

       errorModalButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    errorModalInline: {
      backgroundColor: '#FEF2F2',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#FECACA',
      alignItems: 'center',
      ...Platform.select({
        web: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        default: {
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
      }),
    },
    errorModalInlineHeader: {
      alignItems: 'center',
      marginBottom: 12,
    },
    errorIconContainerInline: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    errorModalInlineTitle: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: '#991B1B',
      textAlign: 'center',
      marginBottom: 2,
    },
    errorModalInlineText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: '#7F1D1D',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
    errorModalInlineButton: {
      backgroundColor: '#EF4444',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 24,
      minWidth: 100,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: {
          boxShadow: '0 2px 4px -1px rgba(239, 68, 68, 0.3)',
        },
        default: {
          elevation: 2,
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
        },
      }),
    },
    errorModalInlineButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
 });
