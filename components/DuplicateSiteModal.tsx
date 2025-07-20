import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface DuplicateSiteModalProps {
  visible: boolean;
  siteName: string;
  onClose: () => void;
}

export const DuplicateSiteModal: React.FC<DuplicateSiteModalProps> = ({
  visible,
  siteName,
  onClose,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={48} color="#FF9800" />
          </View>
          <Text style={styles.modalTitle}>Obra já existe!</Text>
          <Text style={styles.modalMessage}>
            Já existe uma obra com o nome "{siteName}". Por favor, escolha um nome diferente para sua nova obra.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Entendi</Text>
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
        boxShadow: '0px 2px 4px rgba(0,0,0,0.25)',
      },
      default: {
        elevation: 5,
      },
    }),
    width: '80%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FF9800',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#374151',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    elevation: 2,
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
}); 