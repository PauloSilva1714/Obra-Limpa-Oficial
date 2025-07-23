import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { shadows } from '../utils/shadowUtils';

interface AboutAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Image source={require('@/app/(auth)/obra-limpa-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.modalTitle}>Obra Limpa</Text>
          <Text style={styles.modalVersion}>Versão 1.0.0</Text>
          <Text style={styles.modalDescription}>
            O Obra Limpa é um aplicativo criado para facilitar a gestão de obras, colaboradores e tarefas, tornando o acompanhamento do seu canteiro de obras mais simples, eficiente e organizado.
          </Text>
          <Text style={styles.thankYou}>
            Agradecemos por utilizar o Obra Limpa! Sua confiança nos motiva a melhorar cada vez mais.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 6px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 5,
      },
    }),
    width: '80%',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalVersion: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#374151',
  },
  thankYou: {
    fontSize: 15,
    color: '#6366F1',
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  closeButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#E5E7EB',
  },
  closeButtonText: {
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});