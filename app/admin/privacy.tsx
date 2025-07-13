import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Download, Trash2, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PrivacyScreen() {
  const [showPolicy, setShowPolicy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownloadData = () => {
    Alert.alert('Download', 'Funcionalidade de download dos dados em breve!');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso!');
    // Aqui você pode chamar o serviço de exclusão de conta
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Política de Privacidade</Text>
        <TouchableOpacity style={styles.item} onPress={() => setShowPolicy(true)}>
          <Shield size={20} color="#2196F3" />
          <Text style={styles.itemText}>Ver política de privacidade</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Permissões concedidas</Text>
        <View style={styles.permissionList}>
          <Text style={styles.permissionItem}>• Câmera: Permitido</Text>
          <Text style={styles.permissionItem}>• Galeria: Permitido</Text>
          <Text style={styles.permissionItem}>• Localização: Permitido</Text>
        </View>

        <Text style={styles.sectionTitle}>Meus dados</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleDownloadData}>
          <Download size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Baixar meus dados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]} onPress={handleDeleteAccount}>
          <Trash2 size={20} color="#DC2626" />
          <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Excluir minha conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Política de Privacidade */}
      <Modal visible={showPolicy} transparent animationType="slide" onRequestClose={() => setShowPolicy(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPolicy(false)}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Política de Privacidade</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.policyText}>
              Aqui vai o texto da sua política de privacidade...
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de confirmação de exclusão (mantém Modal nativo pois já funciona) */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <CheckCircle size={40} color="#DC2626" style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.confirmTitle}>Excluir conta?</Text>
            <Text style={styles.confirmText}>Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  itemText: { marginLeft: 12, fontSize: 15, color: '#2196F3' },
  permissionList: { marginLeft: 8, marginBottom: 8 },
  permissionItem: { fontSize: 14, color: '#374151', marginBottom: 2 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', borderRadius: 8, padding: 12, marginTop: 12 },
  actionButtonText: { marginLeft: 10, fontSize: 15, color: '#2196F3', fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  modalContent: { padding: 16 },
  policyText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  confirmModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', color: '#DC2626', textAlign: 'center', marginBottom: 8 },
  confirmText: { fontSize: 15, color: '#374151', textAlign: 'center', marginBottom: 24 },
  confirmActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  cancelButtonText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  deleteButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#DC2626', alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
}); 