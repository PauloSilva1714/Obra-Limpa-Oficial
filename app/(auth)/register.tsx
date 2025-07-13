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
  Modal,
  Image
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, User, Lock, Mail, Phone, ArrowLeft, Key, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import AddressSearch from '@/components/AddressSearch';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Picker } from '@react-native-picker/picker';
import logo from './obra-limpa-logo.png';

const { width } = Dimensions.get('window');

const FUNCOES_OBRA = [
  'Pedreiro',
  'Carpinteiro',
  'Auxiliar de Obras',
  'Eletricista',
  'Armador',
  'Outro',
];

export default function RegisterScreen() {
  const { role, inviteId } = useLocalSearchParams<{ role: 'admin' | 'worker', inviteId?: string }>();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    siteName: '',
    siteAddress: '',
    inviteCode: inviteId || '',
    funcao: '',
    funcaoOutro: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Adicione refs para os campos
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const companyRef = useRef(null);
  const inviteCodeRef = useRef(null);
  const siteNameRef = useRef(null);
  const siteAddressRef = useRef(null);
  const funcaoRef = useRef(null);
  const funcaoOutroRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    document.title = 'Obra Limpa - Cadastro';
    
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

  const handleRegister = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (role === 'admin' && !formData.inviteCode.trim() && !formData.siteName.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome da obra ou use um código de convite.');
      return;
    }

    if (role === 'admin' && !formData.inviteCode.trim() && (!formData.siteName.trim() || !formData.siteAddress.trim())) {
      Alert.alert('Erro', 'Por favor, informe o nome e endereço da obra ou use um código de convite.');
      return;
    }

    if (role === 'admin' && formData.inviteCode.trim()) {
      try {
        const isValidInvite = await AuthService.validateAdminInvite(formData.inviteCode.trim(), formData.email.trim());
        if (!isValidInvite) {
          Alert.alert('Erro', 'Convite de administrador inválido ou expirado.');
          return;
        }
      } catch (error) {
        Alert.alert('Erro', 'Erro ao validar convite de administrador.');
        return;
      }
    }

    if (role === 'worker') {
      if (!formData.inviteCode.trim()) {
        Alert.alert('Erro', 'Código de convite é obrigatório para colaboradores.');
        return;
      }
      if (!formData.funcao.trim() || (formData.funcao === 'Outro' && !formData.funcaoOutro.trim())) {
        Alert.alert('Erro', 'Por favor, informe sua função.');
        return;
      }

      try {
        const isValidInvite = await AuthService.validateInvite(formData.inviteCode.trim(), formData.email.trim());
        if (!isValidInvite) {
          Alert.alert('Erro', 'Convite inválido ou expirado.');
          return;
        }
      } catch (error) {
        Alert.alert('Erro', 'Erro ao validar convite.');
        return;
      }
    }

    setLoading(true);
    try {
      await AuthService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        siteName: formData.siteName.trim(),
        inviteId: formData.inviteCode.trim(),
        funcao: formData.funcao === 'Outro' ? formData.funcaoOutro.trim() : formData.funcao.trim(),
      });

      // Mostrar modal de sucesso
      setShowSuccessModal(true);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email já está em uso') {
          Alert.alert('Erro', 'Este e-mail já está cadastrado.');
        } else if (error.message === 'Convite necessário para cadastro de colaborador') {
          Alert.alert('Erro', 'É necessário um convite válido para se cadastrar como colaborador.');
        } else if (error.message === 'Convite inválido ou expirado') {
          Alert.alert('Erro', 'O convite informado é inválido ou expirou.');
        } else if (error.message === 'Convite de administrador inválido ou expirado.') {
          Alert.alert('Erro', 'O convite de administrador informado é inválido ou expirou.');
        } else {
          Alert.alert('Erro', 'Erro ao realizar cadastro. Tente novamente.');
        }
      } else {
        Alert.alert('Erro', 'Erro ao realizar cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      company: '',
      siteName: '',
      siteAddress: '',
      inviteCode: '',
      funcao: '',
      funcaoOutro: '',
    });
    router.replace('/(auth)/login');
  };

  // Aguarda as fontes carregarem
  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Building2 size={64} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text style={styles.titleFallback}>Obra Limpa</Text>
          <Text style={styles.subtitleFallback}>Sistema de Gestão Inteligente</Text>
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={logo}
              style={{ width: 100, height: 100, marginBottom: 8 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Obra Limpa</Text>
          <Text style={styles.subtitle}>Sistema de Gestão Inteligente</Text>
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
            <Text style={styles.welcomeText}>Criar Conta</Text>
            <Text style={styles.loginText}>
              Cadastro de {role === 'admin' ? 'Administrador' : 'Colaborador'}
            </Text>

            {/* Campo Nome */}
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current && emailRef.current.focus()}
                blurOnSubmit={false}
              />
            </View>

            {/* Campo Email */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="E-mail"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current && phoneRef.current.focus()}
                blurOnSubmit={false}
              />
            </View>

            {/* Campo Telefone */}
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                ref={phoneRef}
                style={styles.input}
                placeholder="Telefone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                onSubmitEditing={() => (role === 'admin' ? companyRef.current && companyRef.current.focus() : (role === 'worker' ? inviteCodeRef.current && inviteCodeRef.current.focus() : null))}
                blurOnSubmit={false}
              />
            </View>

            {/* Campos específicos para administrador */}
            {role === 'admin' && (
              <>
                <View style={styles.inputContainer}>
                  <Building2 size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    ref={companyRef}
                    style={styles.input}
                    placeholder="Nome da empresa"
                    value={formData.company}
                    onChangeText={(text) => setFormData({ ...formData, company: text })}
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="next"
                    onSubmitEditing={() => inviteCodeRef.current && inviteCodeRef.current.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Key size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    ref={inviteCodeRef}
                    style={styles.input}
                    placeholder="Código do convite (opcional)"
                    value={formData.inviteCode}
                    onChangeText={(text) => setFormData({ ...formData, inviteCode: text })}
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="next"
                    onSubmitEditing={() => siteNameRef.current && siteNameRef.current.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Building2 size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    ref={siteNameRef}
                    style={styles.input}
                    placeholder="Nome da obra (se não usar convite)"
                    value={formData.siteName}
                    onChangeText={(text) => setFormData({ ...formData, siteName: text })}
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <AddressSearch
                  placeholder="Endereço da obra"
                  value={formData.siteAddress}
                  onChangeText={(text) => setFormData({ ...formData, siteAddress: text })}
                  onAddressSelect={(address, lat, lng) => {
                    setFormData({ ...formData, siteAddress: address });
                  }}
                />

                <Text style={styles.helpText}>
                  {formData.inviteCode.trim() 
                    ? 'Você está se juntando a uma obra existente via convite.'
                    : 'Você está criando uma nova obra. Informe o nome e endereço da obra para começar.'
                  }
                </Text>
              </>
            )}

            {/* Campo específico para colaborador */}
            {role === 'worker' && (
              <>
                <View style={styles.inputContainer}>
                  <Key size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    ref={inviteCodeRef}
                    style={styles.input}
                    placeholder="Código do convite"
                    value={formData.inviteCode}
                    onChangeText={(text) => setFormData({ ...formData, inviteCode: text })}
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="next"
                    onSubmitEditing={() => funcaoRef.current && funcaoRef.current.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <User size={20} color="#6B7280" style={styles.inputIcon} />
                  <Picker
                    selectedValue={formData.funcao}
                    style={[styles.input, { color: formData.funcao ? '#1F2937' : '#9CA3AF', paddingLeft: 0, paddingVertical: 0 }]}
                    onValueChange={(itemValue) => setFormData({ ...formData, funcao: itemValue })}
                  >
                    <Picker.Item label="Selecione sua função" value="" color="#9CA3AF" />
                    {FUNCOES_OBRA.map((f) => (
                      <Picker.Item key={f} label={f} value={f} />
                    ))}
                  </Picker>
                </View>
                {formData.funcao === 'Outro' && (
                  <View style={styles.inputContainer}>
                    <User size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      ref={funcaoOutroRef}
                      style={styles.input}
                      placeholder="Digite sua função"
                      value={formData.funcaoOutro}
                      onChangeText={(text) => setFormData({ ...formData, funcaoOutro: text })}
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current && confirmPasswordRef.current.focus()}
                      blurOnSubmit={false}
                    />
                  </View>
                )}
              </>
            )}

            {/* Campo Senha */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Senha"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current && confirmPasswordRef.current.focus()}
                blurOnSubmit={false}
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

            {/* Campo Confirmar Senha */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                ref={confirmPasswordRef}
                style={styles.input}
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            {/* Botão de Cadastro */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </Text>
            </TouchableOpacity>

            {/* Link para voltar ao login */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToLoginText}>Já tem uma conta? Faça login</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Sucesso */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={80} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>
              Cadastro Realizado com Sucesso!
            </Text>
            <Text style={styles.successDescription}>
              Sua conta foi criada com sucesso. Você será redirecionado para a tela de login.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.successButtonText}>Continuar</Text>
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
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
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    minHeight: '100%',
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
  helpText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
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
  },
  backToLoginButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  titleFallback: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  subtitleFallback: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
}); 