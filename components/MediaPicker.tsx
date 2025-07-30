import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Camera, Video, Image as ImageIcon, X, Send, Edit3 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface MediaPickerProps {
  visible: boolean;
  onClose: () => void;
  onSendMedia: (mediaUri: string, mediaType: 'image' | 'video', caption?: string) => void;
}

interface MediaPreview {
  uri: string;
  type: 'image' | 'video';
}

export default function MediaPicker({ visible, onClose, onSendMedia }: MediaPickerProps) {
  const { colors } = useTheme();
  const [showOptions, setShowOptions] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);

  const resetState = () => {
    setShowOptions(true);
    setMediaPreview(null);
    setCaption('');
    setSending(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissões necessárias',
        'Precisamos de acesso à câmera e galeria para enviar fotos e vídeos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Voltando para a sintaxe original
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaPreview({
          uri: result.assets[0].uri,
          type: 'image'
        });
        setShowOptions(false);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const recordVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Voltando para a sintaxe original
        allowsEditing: true,
        videoMaxDuration: 60, // 60 segundos máximo
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaPreview({
          uri: result.assets[0].uri,
          type: 'video'
        });
        setShowOptions(false);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gravar o vídeo');
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Voltando para a sintaxe original
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMediaPreview({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image'
        });
        setShowOptions(false);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a mídia');
    }
  };

  const handleSendMedia = async () => {
    if (!mediaPreview) return;

    setSending(true);
    try {
      await onSendMedia(mediaPreview.uri, mediaPreview.type, caption.trim() || undefined);
      handleClose();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mídia');
    } finally {
      setSending(false);
    }
  };

  const goBackToOptions = () => {
    setMediaPreview(null);
    setCaption('');
    setShowOptions(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {showOptions ? 'Enviar Mídia' : mediaPreview?.type === 'video' ? 'Enviar Vídeo' : 'Enviar Foto'}
          </Text>
          {!showOptions && (
            <TouchableOpacity onPress={goBackToOptions} style={styles.editButton}>
              <Edit3 size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {showOptions ? (
          // Options Screen
          <View style={styles.optionsContainer}>
            <Text style={[styles.optionsTitle, { color: colors.text }]}>
              Escolha uma opção
            </Text>
            
            <View style={styles.optionsGrid}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={takePhoto}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Camera size={32} color={colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>Tirar Foto</Text>
                <Text style={[styles.optionSubtext, { color: colors.textMuted }]}>
                  Abrir câmera para foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={recordVideo}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.error + '20' }]}>
                  <Video size={32} color={colors.error} />
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>Gravar Vídeo</Text>
                <Text style={[styles.optionSubtext, { color: colors.textMuted }]}>
                  Gravar até 60 segundos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickFromGallery}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.success + '20' }]}>
                  <ImageIcon size={32} color={colors.success} />
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>Galeria</Text>
                <Text style={[styles.optionSubtext, { color: colors.textMuted }]}>
                  Escolher foto ou vídeo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Preview Screen
          <View style={styles.previewContainer}>
            {/* Media Preview */}
            <View style={styles.mediaContainer}>
              {mediaPreview?.type === 'image' ? (
                <Image
                  source={{ uri: mediaPreview.uri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.videoPreview, { backgroundColor: colors.surface }]}>
                  <Video size={64} color={colors.textMuted} />
                  <Text style={[styles.videoText, { color: colors.textMuted }]}>
                    Vídeo selecionado
                  </Text>
                </View>
              )}
            </View>

            {/* Caption Input */}
            <View style={[styles.captionContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.captionInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Adicione uma legenda..."
                placeholderTextColor={colors.textMuted}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
              />
              
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleSendMedia}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Send size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Para status bar
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40, // Para compensar o botão de fechar
  },
  editButton: {
    padding: 8,
  },
  optionsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  optionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsGrid: {
    gap: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  optionSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  previewContainer: {
    flex: 1,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imagePreview: {
    width: width - 32,
    height: height * 0.6,
    borderRadius: 12,
  },
  videoPreview: {
    width: width - 32,
    height: height * 0.6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 16,
    marginTop: 12,
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  captionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});