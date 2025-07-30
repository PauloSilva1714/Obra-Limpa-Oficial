import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, RotateCcw, Image as ImageIcon, Zap, ZapOff } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface CameraScreenProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (photoUri: string) => void;
}

export default function CameraScreen({ visible, onClose, onPhotoTaken }: CameraScreenProps) {
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible && !mediaPermission?.granted) {
      requestMediaPermission();
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        // Salvar na galeria
        if (mediaPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        }
        
        onPhotoTaken(photo.uri);
        handleClose();
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const openGallery = () => {
    // Fechar a câmera e abrir a galeria
    handleClose();
    // Aqui você pode implementar a abertura da galeria
    // Por enquanto, vamos apenas fechar a câmera
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Precisamos de acesso à câmera para tirar fotos
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Permitir Acesso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.error, marginTop: 10 }]}
            onPress={handleClose}
          >
            <Text style={styles.permissionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Câmera */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          {/* Header com botões de controle */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
                {flash === 'on' ? (
                  <Zap size={24} color="#FFD700" />
                ) : (
                  <ZapOff size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer com controles de captura */}
          <View style={styles.footer}>
            {/* Botão da Galeria */}
            <TouchableOpacity onPress={openGallery} style={styles.galleryButton}>
              <ImageIcon size={24} color="white" />
            </TouchableOpacity>

            {/* Botão de Captura */}
            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Botão de Trocar Câmera */}
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
              <RotateCcw size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Labels dos botões */}
          <View style={styles.labelsContainer}>
            <Text style={styles.label}>Vídeo</Text>
            <Text style={[styles.label, styles.activeLabel]}>Foto</Text>
            <Text style={styles.label}>Recado de vídeo</Text>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  labelsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeLabel: {
    color: 'white',
    fontWeight: '700',
  },
});