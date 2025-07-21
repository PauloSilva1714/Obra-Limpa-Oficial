import React from 'react';
import { View, Text, TouchableOpacity, Linking, ScrollView, StyleSheet } from 'react-native';
import { ArrowLeft, Mail, ExternalLink, Info } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FAQAccordionComBusca from '../../components/FAQAccordionComBusca';

const FAQ = [
  { q: 'Como redefinir minha senha?', a: 'Vá em Perfil > Privacidade > Redefinir senha.' },
  { q: 'Como adicionar um colaborador?', a: 'Acesse Admin > Gerenciar Colaboradores > Convidar.' },
  { q: 'Como trocar de obra?', a: 'Vá em Perfil > Trocar de Obra.' },
  // Adicione mais perguntas e respostas conforme necessário
];

export default function SupportScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:suporteobralimpa1.0.0@gmail.com?subject=Ajuda%20Obra%20Limpa');
  };

  return (
    <LinearGradient
      colors={["#e0f2fe", "#d1fae5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Suporte</Text>
        <View style={{ width: 40 }} />
      </View>

        {/* FAQ Accordion com busca */}
        <FAQAccordionComBusca />

        <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contato com o suporte</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
          <Mail size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Enviar e-mail para o suporte</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', elevation: 2 },
  backButton: { padding: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 8, color: '#374151' },
  faqItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  faqQ: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  faqA: { fontSize: 14, color: '#374151', marginTop: 2 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', borderRadius: 8, padding: 12, marginTop: 12 },
  actionButtonText: { marginLeft: 10, fontSize: 15, color: '#2196F3', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 2, boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' },
}); 