import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform, View, Modal, Text, Pressable, ScrollView } from 'react-native';
import { Menu, X, Home, Building2, BarChart3, MessageCircle, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

interface TabBarToggleButtonProps {
  size?: number;
  style?: any;
  variant?: 'modern' | 'minimal' | 'floating' | 'glass';
}

export default function TabBarToggleButton({
  size = 20,
  style,
  variant = 'modern'
}: TabBarToggleButtonProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [menuAberto, setMenuAberto] = useState(false);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setMenuAberto(true);
  };

  const fecharMenu = () => {
    setMenuAberto(false);
  };

  const navegarParaTela = (rota: string) => {
    fecharMenu();
    router.push(rota as any);
  };

  const getButtonStyle = () => {
    const baseStyle = {
      transform: [{ scale: scaleAnim }],
    };

    switch (variant) {
      case 'minimal':
        return [
          styles.buttonMinimal,
          {
            backgroundColor: 'transparent',
            borderColor: colors.border + '40',
          },
          baseStyle,
        ];

      case 'floating':
        return [
          styles.buttonFloating,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
          baseStyle,
        ];

      case 'glass':
        return [
          styles.buttonGlass,
          {
            backgroundColor: colors.surface + '80',
            borderColor: colors.border + '30',
            backdropFilter: 'blur(10px)',
          },
          baseStyle,
        ];

      default: // modern
        return [
          styles.buttonModern,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border + '60',
            shadowColor: colors.text,
          },
          baseStyle,
        ];
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'floating':
        return '#FFFFFF';
      case 'minimal':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Menu size={size} color={getIconColor()} strokeWidth={2.5} />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={menuAberto}
        animationType="slide"
        transparent
        onRequestClose={fecharMenu}
        presentationStyle="overFullScreen"
      >
        <View style={styles.overlay}>
          <Pressable style={styles.overlayPressable} onPress={fecharMenu} />
          <View style={styles.menuContent}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={fecharMenu}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuItemsContainer} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.menuItemContainer}
                onPress={() => navegarParaTela('/(tabs)')}
              >
                <Home size={24} color={colors.primary} style={styles.menuIcon} />
                <Text style={styles.menuItem}>Tarefas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemContainer}
                onPress={() => navegarParaTela('/(tabs)/admin')}
              >
                <Building2 size={24} color={colors.primary} style={styles.menuIcon} />
                <Text style={styles.menuItem}>Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemContainer}
                onPress={() => navegarParaTela('/(tabs)/progress')}
              >
                <BarChart3 size={24} color={colors.primary} style={styles.menuIcon} />
                <Text style={styles.menuItem}>Progresso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemContainer}
                onPress={() => navegarParaTela('/(tabs)/chat')}
              >
                <MessageCircle size={24} color={colors.primary} style={styles.menuIcon} />
                <Text style={styles.menuItem}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemContainer}
                onPress={() => navegarParaTela('/(tabs)/profile')}
              >
                <User size={24} color={colors.primary} style={styles.menuIcon} />
                <Text style={styles.menuItem}>Perfil</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonModern: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonMinimal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonFloating: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonGlass: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  overlayPressable: {
    flex: 1,
  },
  menuContent: {
    width: '100%',
    height: '70%',
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    elevation: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  menuItemsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  menuItemContainer: {
    width: '100%',
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuItem: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
});
