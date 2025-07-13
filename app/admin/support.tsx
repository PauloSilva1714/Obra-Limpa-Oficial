import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, HelpCircle, Info, Mail, ExternalLink, FileText, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';

const FAQ = [
  { q: 'Como redefinir minha senha?', a: 'Vá em Configurações > Alterar senha e siga as instruções.' },
  { q: 'Como adicionar uma nova obra?', a: 'Acesse a aba de obras e clique no botão de + para criar uma nova obra.' },
  { q: 'Como entrar em contato com o suporte?', a: 'Use o botão de contato abaixo para falar com nosso time.' },
];

export default function SupportScreen() {
  const [showTerms, setShowTerms] = useState(false);

  const handleContact = () => {
    Linking.openURL('mailto:suporte@obralimpa.com?subject=Ajuda%20Obra%20Limpa');
  };

  const handleReport = () => {
    Linking.openURL('mailto:suporte@obralimpa.com?subject=Relatar%20um%20problema');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Suporte</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        {FAQ.map((item, idx) => (
          <View key={idx} style={styles.faqItem}>
            <HelpCircle size={18} color="#2196F3" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Text style={styles.faqA}>{item.a}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Contato com o suporte</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleContact}>
          <Mail size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Enviar e-mail para o suporte</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Sobre o app</Text>
        <View style={styles.aboutBox}>
          <Info size={20} color="#2196F3" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.aboutTitle}>Obra Limpa</Text>
            <Text style={styles.aboutText}>Versão 1.0.0</Text>
            <Text style={styles.aboutText}>Aplicativo para gerenciamento de tarefas em canteiros de obra.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.termsButton} onPress={() => setShowTerms(true)}>
          <FileText size={18} color="#2196F3" />
          <Text style={styles.termsButtonText}>Ver termos de uso</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Relatar um problema</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
          <AlertCircle size={20} color="#DC2626" />
          <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Relatar um problema</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Termos de Uso */}
      <Modal visible={showTerms} animationType="slide" onRequestClose={() => setShowTerms(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTerms(false)}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Termos de Uso</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.termsText}>
              Aqui vai o texto dos seus termos de uso...
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8, color: '#374151' },
  faqItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  faqQ: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  faqA: { fontSize: 14, color: '#374151', marginTop: 2 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', borderRadius: 8, padding: 12, marginTop: 12 },
  actionButtonText: { marginLeft: 10, fontSize: 15, color: '#2196F3', fontWeight: '600' },
  aboutBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, marginTop: 8 },
  aboutTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  aboutText: { fontSize: 14, color: '#374151' },
  termsButton: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  termsButtonText: { marginLeft: 8, fontSize: 15, color: '#2196F3', fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  modalContent: { padding: 16 },
  termsText: { fontSize: 15, color: '#374151', lineHeight: 22 },
}); 