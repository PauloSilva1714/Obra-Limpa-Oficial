import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, CheckCircle } from 'lucide-react-native';
import { shadows } from '../utils/shadowUtils';

export default function ColaboradorScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <CheckCircle size={48} color="#10B981" style={styles.icon} />
        <Text style={styles.title}>Bem-vindo ao Obra Limpa!</Text>
        <Text style={styles.subtitle}>Seu acesso como <Text style={{ color: '#059669', fontWeight: 'bold' }}>Colaborador</Text> foi liberado.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>O que você pode fazer como colaborador:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Visualizar e atualizar tarefas da obra</Text>
          <Text style={styles.listItem}>• Registrar seu progresso e comentários</Text>
          <Text style={styles.listItem}>• Comunicar-se com a equipe</Text>
          <Text style={styles.listItem}>• Acompanhar o andamento do projeto</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/index')}>
        <Text style={styles.buttonText}>Ir para o Dashboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  list: {
    marginLeft: 8,
  },
  listItem: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 6,
  },
  button: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    maxWidth: 400,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});