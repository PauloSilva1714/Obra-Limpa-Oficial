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
  Image,
  TextInput,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, RotateCcw, Image as ImageIcon, Zap, ZapOff, Video, Mic, Send, Type, Smile, Filter } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

type CameraMode = 'photo' | 'video' | 'voice-video';

interface CameraScreenProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (photoUri: string, caption?: string) => void;
  onVideoTaken?: (videoUri: string) => void;
}

export default function CameraScreen({ visible, onClose, onPhotoTaken, onVideoTaken }: CameraScreenProps) {
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [mode, setMode] = useState<CameraMode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isHDMode, setIsHDMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
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
    if (isRecording) {
      stopRecording();
    }
    setCapturedPhoto(null);
    setCaption('');
    setIsEditing(false);
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || mode !== 'photo') return;

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
        
        // Mostrar tela de edição ao invés de fechar
        setCapturedPhoto(photo.uri);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || mode === 'photo') return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: mode === 'voice-video' ? 30 : 60, // 30s para recado, 60s para vídeo normal
      });

      if (video?.uri) {
        // Salvar na galeria
        if (mediaPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(video.uri);
        }
        
        if (onVideoTaken) {
          onVideoTaken(video.uri);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Erro ao gravar vídeo:', error);
      Alert.alert('Erro', 'Não foi possível gravar o vídeo');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      setIsRecording(false);
    }
  };

  const handleCapture = () => {
    if (mode === 'photo') {
      takePicture();
    } else if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendPhoto = () => {
    if (capturedPhoto) {
      // Passa a foto e a legenda para o componente pai
      onPhotoTaken(capturedPhoto, caption);
      // Limpa os estados e fecha a tela
      setCapturedPhoto(null);
      setCaption('');
      setIsEditing(false);
      setShowFilters(false);
      setSelectedFilter(null);
      setShowTextEditor(false);
      setShowEmojiPicker(false);
      setShowStickers(false);
      setIsHDMode(false);
      handleClose();
    }
  };

  const backToCamera = () => {
    setCapturedPhoto(null);
    setCaption('');
    setIsEditing(false);
    setShowFilters(false);
    setSelectedFilter(null);
    setShowTextEditor(false);
    setShowEmojiPicker(false);
    setShowStickers(false);
    setIsHDMode(false);
  };

  // Funções para os botões da tela de edição
  const toggleHDMode = () => {
    setIsHDMode(!isHDMode);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    setShowTextEditor(false);
    setShowEmojiPicker(false);
    setShowStickers(false);
  };

  const selectFilter = (filterName: string) => {
    setSelectedFilter(selectedFilter === filterName ? null : filterName);
  };

  const toggleTextEditor = () => {
    setShowTextEditor(!showTextEditor);
    setShowFilters(false);
    setShowEmojiPicker(false);
    setShowStickers(false);
  };

  const addText = () => {
    // Aqui você pode implementar a lógica real de adicionar texto à imagem
    // Por enquanto, apenas fecha o painel
    setShowTextEditor(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowFilters(false);
    setShowTextEditor(false);
    setShowStickers(false);
  };

  const addEmoji = (emoji: string) => {
    // Aqui você pode implementar a lógica real de adicionar emoji à imagem
    // Por enquanto, apenas fecha o painel
    setShowEmojiPicker(false);
  };

  const toggleStickers = () => {
    setShowStickers(!showStickers);
    setShowFilters(false);
    setShowTextEditor(false);
    setShowEmojiPicker(false);
  };

  const addSticker = (sticker: string) => {
    // Aqui você pode implementar a lógica real de adicionar sticker à imagem
    // Por enquanto, apenas fecha o painel
    setShowStickers(false);
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.type === 'image') {
          onPhotoTaken(asset.uri);
        } else if (asset.type === 'video' && onVideoTaken) {
          onVideoTaken(asset.uri);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Erro ao abrir galeria:', error);
      Alert.alert('Erro', 'Não foi possível abrir a galeria');
    }
  };

  const setModePhoto = () => setMode('photo');
  const setModeVideo = () => setMode('video');
  const setModeVoiceVideo = () => setMode('voice-video');

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Precisamos de acesso à câmera para tirar fotos e gravar vídeos
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
        {isEditing && capturedPhoto ? (
          // Tela de Edição
          <View style={styles.editContainer}>
            {/* Header da edição */}
            <View style={styles.editHeader}>
              <TouchableOpacity onPress={backToCamera} style={styles.headerButton}>
                <X size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.editHeaderControls}>
               <TouchableOpacity onPress={toggleHDMode} style={[styles.headerButton, isHDMode && styles.activeButton]}>
                 <Text style={[styles.hdText, isHDMode && styles.activeText]}>HD</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={toggleCameraFacing} style={styles.headerButton}>
                 <RotateCcw size={24} color="white" />
               </TouchableOpacity>
               <TouchableOpacity onPress={toggleFilters} style={[styles.headerButton, showFilters && styles.activeButton]}>
                 <Filter size={24} color={showFilters ? "#007AFF" : "white"} />
               </TouchableOpacity>
               <TouchableOpacity onPress={toggleEmojiPicker} style={[styles.headerButton, showEmojiPicker && styles.activeButton]}>
                 <Smile size={24} color={showEmojiPicker ? "#007AFF" : "white"} />
               </TouchableOpacity>
               <TouchableOpacity onPress={toggleTextEditor} style={[styles.headerButton, showTextEditor && styles.activeButton]}>
                 <Type size={24} color={showTextEditor ? "#007AFF" : "white"} />
               </TouchableOpacity>
               <TouchableOpacity onPress={toggleStickers} style={[styles.headerButton, showStickers && styles.activeButton]}>
                 <ImageIcon size={24} color={showStickers ? "#007AFF" : "white"} />
               </TouchableOpacity>
             </View>
            </View>

            {/* Imagem capturada */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} />
            </View>

            {/* Botão Filtros */}
             <TouchableOpacity onPress={toggleFilters} style={[styles.filtersButton, showFilters && styles.activeFiltersButton]}>
               <Text style={[styles.filtersButtonText, showFilters && styles.activeFiltersText]}>
                 {showFilters ? 'Fechar Filtros' : 'Filtros'}
               </Text>
             </TouchableOpacity>

            {/* Painéis de ferramentas */}
             {showFilters && (
               <View style={styles.toolPanel}>
                 <Text style={styles.toolPanelTitle}>Filtros</Text>
                 <View style={styles.filterGrid}>
                   {['Normal', 'Vintage', 'B&W', 'Sepia', 'Vivid', 'Cool'].map((filter) => (
                     <TouchableOpacity
                       key={filter}
                       onPress={() => selectFilter(filter)}
                       style={[
                         styles.filterOption,
                         selectedFilter === filter && styles.selectedFilterOption
                       ]}
                     >
                       <Text style={[
                         styles.filterOptionText,
                         selectedFilter === filter && styles.selectedFilterText
                       ]}>
                         {filter}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>
             )}

             {showEmojiPicker && (
               <View style={styles.toolPanel}>
                 <Text style={styles.toolPanelTitle}>Emojis</Text>
                 <View style={styles.emojiGrid}>
                   {['😀', '😂', '😍', '🥰', '😎', '🤔', '😮', '🎉', '❤️', '👍', '🔥', '✨'].map((emoji) => (
                     <TouchableOpacity
                       key={emoji}
                       onPress={() => addEmoji(emoji)}
                       style={styles.emojiOption}
                     >
                       <Text style={styles.emojiText}>{emoji}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>
             )}

             {showTextEditor && (
               <View style={styles.toolPanel}>
                 <Text style={styles.toolPanelTitle}>Adicionar Texto</Text>
                 <View style={styles.textEditorOptions}>
                   <TouchableOpacity onPress={addText} style={styles.textOption}>
                     <Type size={20} color="white" />
                     <Text style={styles.textOptionLabel}>Texto Simples</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={addText} style={styles.textOption}>
                     <Text style={styles.textOptionLabel}>Aa</Text>
                     <Text style={styles.textOptionLabel}>Texto Estilizado</Text>
                   </TouchableOpacity>
                 </View>
               </View>
             )}

             {showStickers && (
               <View style={styles.toolPanel}>
                 <Text style={styles.toolPanelTitle}>Stickers</Text>
                 <View style={styles.stickerGrid}>
                   {['🌟', '💫', '⭐', '🎈', '🎊', '🎁', '🏆', '🎯', '🎪', '🎭', '🎨', '🎵'].map((sticker) => (
                     <TouchableOpacity
                       key={sticker}
                       onPress={() => addSticker(sticker)}
                       style={styles.stickerOption}
                     >
                       <Text style={styles.stickerText}>{sticker}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>
             )}

             {/* Input de legenda */}
            <View style={styles.captionContainer}>
              <ImageIcon size={20} color="#9CA3AF" />
              <TextInput
                style={styles.captionInput}
                placeholder="Adicione uma legenda..."
                placeholderTextColor="#9CA3AF"
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            {/* Footer com envio */}
            <View style={styles.editFooter}>
              <Text style={styles.senderText}>Eu (você)</Text>
              <TouchableOpacity onPress={sendPhoto} style={styles.sendButton}>
                <Send size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Tela da Câmera
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash}
            mode={mode === 'photo' ? 'picture' : 'video'}
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

            {/* Indicador de gravação */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  {mode === 'voice-video' ? 'Gravando recado...' : 'Gravando vídeo...'}
                </Text>
              </View>
            )}

            {/* Footer com controles de captura */}
            <View style={styles.footer}>
              {/* Botão da Galeria */}
              <TouchableOpacity onPress={openGallery} style={styles.galleryButton}>
                <ImageIcon size={24} color="white" />
              </TouchableOpacity>

              {/* Botão de Captura */}
              <TouchableOpacity onPress={handleCapture} style={[
                styles.captureButton,
                isRecording && styles.captureButtonRecording
              ]}>
                <View style={[
                  styles.captureButtonInner,
                  mode !== 'photo' && styles.captureButtonVideo,
                  isRecording && styles.captureButtonInnerRecording
                ]}>
                  {mode === 'voice-video' && !isRecording && (
                    <Mic size={24} color="white" />
                  )}
                  {mode === 'video' && !isRecording && (
                    <Video size={24} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Botão de Trocar Câmera */}
              <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
                <RotateCcw size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Botões de modo */}
            <View style={styles.labelsContainer}>
              <TouchableOpacity onPress={setModeVideo} style={styles.modeButton}>
                <Text style={[styles.label, mode === 'video' && styles.activeLabel]}>
                  Vídeo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={setModePhoto} style={styles.modeButton}>
                <Text style={[styles.label, mode === 'photo' && styles.activeLabel]}>
                  Foto
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={setModeVoiceVideo} style={styles.modeButton}>
                <Text style={[styles.label, mode === 'voice-video' && styles.activeLabel]}>
                  Recado de vídeo
                </Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
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
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 50,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  captureButtonRecording: {
    borderColor: '#FF4444',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonVideo: {
    backgroundColor: '#FF4444',
  },
  captureButtonInnerRecording: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FF4444',
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
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    color: 'white',
    fontWeight: '700',
  },
  // Estilos para a tela de edição
  editContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  editHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  editHeaderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  hdText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 150,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  filtersButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filtersButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  captionInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    maxHeight: 80,
  },
  editFooter: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
     width: 50,
     height: 50,
     borderRadius: 25,
     backgroundColor: '#007AFF',
     justifyContent: 'center',
     alignItems: 'center',
   },
   // Estilos para botões ativos
   activeButton: {
     backgroundColor: 'rgba(0, 122, 255, 0.3)',
     borderWidth: 1,
     borderColor: '#007AFF',
   },
   activeText: {
     color: '#007AFF',
   },
   activeFiltersButton: {
     backgroundColor: '#007AFF',
   },
   activeFiltersText: {
     color: 'white',
   },
   // Estilos para painéis de ferramentas
   toolPanel: {
     position: 'absolute',
     bottom: 160,
     left: 20,
     right: 20,
     backgroundColor: 'rgba(0, 0, 0, 0.9)',
     borderRadius: 15,
     padding: 15,
     maxHeight: 200,
   },
   toolPanelTitle: {
     color: 'white',
     fontSize: 16,
     fontWeight: 'bold',
     marginBottom: 10,
     textAlign: 'center',
   },
   // Estilos para filtros
   filterGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     gap: 8,
   },
   filterOption: {
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 15,
     minWidth: 60,
     alignItems: 'center',
   },
   selectedFilterOption: {
     backgroundColor: '#007AFF',
   },
   filterOptionText: {
     color: 'white',
     fontSize: 12,
     fontWeight: '500',
   },
   selectedFilterText: {
     color: 'white',
     fontWeight: 'bold',
   },
   // Estilos para emojis
   emojiGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     gap: 8,
   },
   emojiOption: {
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 20,
   },
   emojiText: {
     fontSize: 20,
   },
   // Estilos para editor de texto
   textEditorOptions: {
     gap: 10,
   },
   textOption: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     padding: 12,
     borderRadius: 10,
     gap: 10,
   },
   textOptionLabel: {
     color: 'white',
     fontSize: 14,
     fontWeight: '500',
   },
   // Estilos para stickers
   stickerGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     gap: 8,
   },
   stickerOption: {
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 20,
   },
   stickerText: {
     fontSize: 20,
   },
 });