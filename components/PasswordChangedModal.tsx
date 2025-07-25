import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { CheckCircle, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { shadows } from '../utils/shadowUtils';

interface PasswordChangedModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PasswordChangedModal: React.FC<PasswordChangedModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [iconAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Animação de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Animação do ícone com delay
      setTimeout(() => {
        Animated.spring(iconAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 200);
    } else {
      // Reset das animações
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      iconAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
      boxShadow: '0px 4px 25px rgba(0,0,0,0.1)',
      elevation: 5,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#10B981',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    message: {
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    button: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 160,
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
      elevation: 6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginRight: 8,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 100,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      opacity: 0.1,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.gradient, { backgroundColor: '#10B981' }]} />
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: iconAnim }],
              },
            ]}
          >
            <CheckCircle size={40} color="#FFFFFF" strokeWidth={2.5} />
          </Animated.View>
          <Text style={styles.title}>Senha Alterada!</Text>
          <Text style={styles.message}>
            Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuar</Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};