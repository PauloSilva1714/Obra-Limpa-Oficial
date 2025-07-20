import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import AddressSearch from '@/components/AddressSearch';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { DuplicateSiteModal } from '@/components/DuplicateSiteModal';

export default function CreateSiteScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateSiteName, setDuplicateSiteName] = useState('');

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.replace('/'); // Redireciona para a home ou outra tela principal
    }
  }

  const handleCreateSite = async () => {
    if (!name.trim() || !address.trim() || latitude === null || longitude === null) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos e selecione um endereço válido');
      return;
    }

    try {
      setLoading(true);
      await AuthService.getInstance().createSite({
        name: name.trim(),
        address: address.trim(),
        latitude,
        longitude,
        status: 'active',
      });
      setConfirmationModalVisible(true);
      // router.back(); // Remover o redirecionamento automático, deixar para o usuário fechar o modal
    } catch (error: any) {
      // Verificar se é um erro de obra duplicada
      if (error.message && error.message.includes('Já existe uma obra com o nome')) {
        setDuplicateSiteName(name.trim());
        setDuplicateModalVisible(true);
      } else {
        Alert.alert('Erro', 'Não foi possível criar a obra');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Nova Obra</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Obra</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Digite o nome da obra"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço</Text>
          <AddressSearch
            value={address}
            onChangeText={setAddress}
            onAddressSelect={(addr, lat, lng) => {
              setAddress(addr);
              setLatitude(lat || null);
              setLongitude(lng || null);
            }}
            placeholder="Digite o endereço da obra"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateSite}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando...' : 'Criar Obra'}
          </Text>
        </TouchableOpacity>
      </View>

      <ConfirmationModal
        visible={confirmationModalVisible}
        title="Obra criada com sucesso!"
        message="A nova obra foi cadastrada com sucesso."
        onConfirm={() => {
          setConfirmationModalVisible(false);
          router.replace('/admin/sites');
        }}
        onCancel={() => {
          setConfirmationModalVisible(false);
          router.replace('/admin/sites');
        }}
        confirmText="OK"
        cancelText="Fechar"
      />

      <DuplicateSiteModal
        visible={duplicateModalVisible}
        siteName={duplicateSiteName}
        onClose={() => {
          setDuplicateModalVisible(false);
          setDuplicateSiteName('');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 