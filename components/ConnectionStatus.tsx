import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkFirebaseConnection, reconnectFirebase } from '../config/firebase';
import { useAdminRealTimeSync } from '../hooks/useFrameworkReady';
import { app, db, auth } from '../config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/AuthService';
import { getDoc, doc } from 'firebase/firestore';

interface ConnectionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
  siteId?: string;
  showRealTimeSync?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  onConnectionChange, 
  siteId,
  showRealTimeSync = false 
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuth();

  const forceConnectionCheck = async () => {
    try {
      setIsChecking(true);
      const isOnline = await checkFirebaseConnection();
      setIsConnected(isOnline);
    } catch (error) {
      console.error('[ConnectionStatus] Erro na verificação forçada:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isComponentMounted = true;

    async function checkFirestoreConnection() {
      if (!isComponentMounted) return;
      
      try {
        setIsChecking(true);
        
        // Usar requestIdleCallback para otimizar performance
        const checkConnection = () => {
          return new Promise<boolean>((resolve) => {
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
              window.requestIdleCallback(async () => {
                try {
                  const isOnline = await checkFirebaseConnection();
                  resolve(isOnline);
                } catch (error) {
                  console.error('[ConnectionStatus] Erro na verificação:', error);
                  resolve(false);
                }
              });
            } else {
              // Fallback para ambientes sem requestIdleCallback
              setTimeout(async () => {
                try {
                  const isOnline = await checkFirebaseConnection();
                  resolve(isOnline);
                } catch (error) {
                  console.error('[ConnectionStatus] Erro na verificação:', error);
                  resolve(false);
                }
              }, 0);
            }
          });
        };

        const isOnline = await checkConnection();
        if (isComponentMounted) {
          setIsConnected(isOnline);
        }
      } catch (error) {
        console.error('[ConnectionStatus] Erro na verificação:', error);
        if (isComponentMounted) {
          setIsConnected(false);
        }
      } finally {
        if (isComponentMounted) {
          setIsChecking(false);
        }
      }
    }
    
    // Verificação inicial
    checkFirestoreConnection();
    
    // Verificação periódica a cada 60 segundos (reduzido de 30s para melhor performance)
    intervalId = setInterval(() => {
      if (isComponentMounted) {
        checkFirestoreConnection();
      }
    }, 60000);
    
    return () => {
      isComponentMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Debug: logar valores no console

  // Avatar padrão
  const defaultAvatar = require('@/assets/icon.png');
  const avatarSource = user?.photoURL ? { uri: user.photoURL } : defaultAvatar;

  return (
    <View style={{ padding: 0, backgroundColor: 'transparent', borderBottomWidth: 0, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity 
        onPress={forceConnectionCheck}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      >
        <Image source={avatarSource} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff' }} />
        <View style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: isChecking ? '#FF9800' : (isConnected === false ? '#F44336' : '#4CAF50'),
          borderWidth: 2,
          borderColor: '#fff',
        }}>
          {isChecking && (
            <ActivityIndicator size={6} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  realTimeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  reconnectText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
});