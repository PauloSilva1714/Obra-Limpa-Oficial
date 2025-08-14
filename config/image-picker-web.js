// Configuração do expo-image-picker para web
import { Platform } from 'react-native';

// Função para inicializar o suporte a ImagePicker no ambiente web
export function setupImagePickerWeb() {
  if (Platform.OS === 'web') {
    // Adiciona uma função global para verificar e solicitar permissões de câmera
    window.__requestCameraPermission__ = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Parar o stream imediatamente após obter permissão
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          return 'granted';
        }
        return 'denied';
      } catch (error) {
        console.error('Erro ao solicitar permissão de câmera:', error);
        return 'denied';
      }
    };

    // Adiciona uma função global para verificar e solicitar permissões de galeria
    window.__requestMediaLibraryPermission__ = async () => {
      try {
        // No navegador, não há uma API específica para permissão de galeria
        // Usamos a API de seleção de arquivos como alternativa
        return 'granted'; // Sempre retorna granted pois o navegador mostra seu próprio seletor de arquivos
      } catch (error) {
        console.error('Erro ao solicitar permissão de galeria:', error);
        return 'denied';
      }
    };

    console.log('ImagePicker Web configurado com sucesso');
  }
}

// Exporta funções simuladas do ImagePicker para web
export const ImagePickerWeb = {
  requestCameraPermissionsAsync: async () => {
    if (Platform.OS === 'web' && window.__requestCameraPermission__) {
      const status = await window.__requestCameraPermission__();
      return { status };
    }
    return { status: 'denied' };
  },

  requestMediaLibraryPermissionsAsync: async () => {
    if (Platform.OS === 'web' && window.__requestMediaLibraryPermission__) {
      const status = await window.__requestMediaLibraryPermission__();
      return { status };
    }
    return { status: 'granted' }; // Para web, consideramos sempre concedido
  },

  getCameraPermissionsAsync: async () => {
    if (Platform.OS === 'web' && navigator.mediaDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        if (!hasCamera) return { status: 'unavailable' };
        
        // Verificar se já temos permissão
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            return { status: 'granted' };
          }
        } catch (e) {
          return { status: 'denied' };
        }
      } catch (error) {
        console.error('Erro ao verificar permissão de câmera:', error);
        return { status: 'denied' };
      }
    }
    return { status: 'denied' };
  },

  getMediaLibraryPermissionsAsync: async () => {
    // Para web, sempre retornamos granted pois o navegador gerencia isso
    return { status: 'granted' };
  }
};