import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkFirebaseConnection, reconnectFirebase } from '../config/firebase';
import { useAdminRealTimeSync } from '../hooks/useFrameworkReady';
import { app, db } from '../config/firebase';

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

  // Hook para sincronização em tempo real (apenas para administradores)
  const realTimeSync = showRealTimeSync && siteId ? useAdminRealTimeSync(siteId) : null;

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Primeiro, verificar se o Firebase está inicializado
      if (!app) {
        setIsConnected(false);
        return;
      }

      if (!db) {
        setIsConnected(false);
        return;
      }

      // Agora fazer a verificação completa
      const connected = await checkFirebaseConnection();
      setIsConnected(connected);
      
      onConnectionChange?.(connected);
    } catch (error) {
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReconnect = async () => {
    setIsChecking(true);
    try {
      const success = await reconnectFirebase();
      if (success) {
        await checkConnection();
        Alert.alert('Sucesso', 'Tentativa de reconexão enviada. Verificando status...');
      } else {
        Alert.alert('Erro', 'Não foi possível restaurar a conexão. Verifique a internet e tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao tentar reconectar. Verifique sua conexão com a internet.');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Verifica conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Renderizar indicador de sincronização em tempo real para administradores
  if (showRealTimeSync && realTimeSync) {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Ionicons 
            name="ellipse" 
            size={8} 
            color={realTimeSync.isConnected ? '#4CAF50' : '#F44336'} 
          />
          <Text style={styles.statusText}>
            {realTimeSync.loading ? 'Sincronizando...' : 
             realTimeSync.isConnected ? 'Sincronizado' : 'Desconectado'}
          </Text>
          {realTimeSync.isConnected && (
            <View style={styles.realTimeIndicator}>
              <Ionicons name="sync" size={12} color="#4CAF50" />
              <Text style={styles.realTimeText}>Tempo Real</Text>
            </View>
          )}
        </View>
        
        {!realTimeSync.isConnected && (
          <TouchableOpacity 
            style={styles.reconnectButton} 
            onPress={realTimeSync.refreshData}
            disabled={realTimeSync.loading}
          >
            <Ionicons 
              name={realTimeSync.loading ? "refresh" : "refresh-outline"} 
              size={16} 
              color="#2196F3" 
            />
            <Text style={styles.reconnectText}>
              {realTimeSync.loading ? 'Sincronizando...' : 'Sincronizar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isConnected === null) {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Ionicons name="ellipse" size={8} color="#FFA500" />
          <Text style={styles.statusText}>Verificando conexão...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Ionicons 
          name="ellipse" 
          size={8} 
          color={isConnected ? '#4CAF50' : '#F44336'} 
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>
      
      {!isConnected && (
        <TouchableOpacity 
          style={styles.reconnectButton} 
          onPress={handleReconnect}
          disabled={isChecking}
        >
          <Ionicons 
            name={isChecking ? "refresh" : "refresh-outline"} 
            size={16} 
            color="#2196F3" 
          />
          <Text style={styles.reconnectText}>
            {isChecking ? 'Reconectando...' : 'Reconectar'}
          </Text>
        </TouchableOpacity>
      )}
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