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
  Animated,
  PanResponder,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, RotateCcw, Image as ImageIcon, Zap, ZapOff, Video as VideoIcon, Mic, Send, Type, Smile, Filter } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Audio, Video } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

type CameraMode = 'photo' | 'video' | 'voice-video';

interface DraggableElementProps {
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  onPositionChange: (x: number, y: number) => void;
  style?: any;
  isCropHandle?: boolean; // Nova prop para identificar handles de corte
}

const DraggableElement: React.FC<DraggableElementProps> = ({ 
  children, 
  initialX, 
  initialY, 
  onPositionChange, 
  style,
  isCropHandle = false
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [currentPosition, setCurrentPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);

  // Atualizar posição quando initialX ou initialY mudarem
  useEffect(() => {
    setCurrentPosition({ x: initialX, y: initialY });
    pan.setValue({ x: 0, y: 0 });
  }, [initialX, initialY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Para handles de corte, sempre responder ao toque inicial
        if (isCropHandle) {
          return true;
        }
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Para handles de corte, ser extremamente sensível
        if (isCropHandle) {
          return Math.abs(gestureState.dx) > 0.1 || Math.abs(gestureState.dy) > 0.1;
        }
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (isCropHandle) {
          return Math.abs(gestureState.dx) > 0.1 || Math.abs(gestureState.dy) > 0.1;
        }
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: (evt, gestureState) => {
        setIsDragging(true);
        pan.setOffset({
          x: currentPosition.x,
          y: currentPosition.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();
        
        if (isCropHandle) {
          // Para handles de corte, passar apenas o delta e NÃO resetar posição
          onPositionChange(gestureState.dx, gestureState.dy);
          // NÃO resetar pan para handles de crop - deixar eles onde estão
        } else {
          // Para outros elementos, manter limitação
          const newX = Math.max(0, Math.min(width - 50, currentPosition.x + gestureState.dx));
          const newY = Math.max(0, Math.min(height - 100, currentPosition.y + gestureState.dy));
          setCurrentPosition({ x: newX, y: newY });
          onPositionChange(newX, newY);
          pan.setValue({ x: 0, y: 0 });
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          left: currentPosition.x,
          top: currentPosition.y,
          transform: pan.getTranslateTransform(),
          zIndex: isDragging ? 1000 : 100,
          opacity: isDragging ? 0.9 : 1,
          // Adicionar escala quando arrastando para feedback visual
          ...(isDragging && isCropHandle ? { 
            transform: [
              ...pan.getTranslateTransform(),
              { scale: 1.2 } // Aumentar ligeiramente quando arrastando
            ] 
          } : {}),
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

interface CameraScreenProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (media: string | { uri: string; type: string; edits: any }, caption?: string) => void;
  onVideoTaken: (videoUri: string) => void;
}

export default function CameraScreen({ visible, onClose, onPhotoTaken, onVideoTaken }: CameraScreenProps) {
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  const [mode, setMode] = useState<CameraMode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isHDMode, setIsHDMode] = useState(false);

  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ 
    x: width * 0.1, 
    y: height * 0.15, 
    width: width * 0.8, 
    height: height * 0.5 
  });
  const [appliedEdits, setAppliedEdits] = useState<{
    emojis: Array<{id: string, emoji: string, x: number, y: number}>;
    stickers: Array<{id: string, sticker: string, x: number, y: number}>;
    texts: Array<{id: string, text: string, x: number, y: number, color: string, size: number}>;
    rotation: number;
    crop: {x: number, y: number, width: number, height: number} | null;
  }>({
    emojis: [],
    stickers: [],
    texts: [],
    rotation: 0,
    crop: null
  });
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [croppedPreviewUri, setCroppedPreviewUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const requestAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de áudio:', error);
      return false;
    }
  };

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible && !mediaPermission?.granted) {
      requestMediaPermission();
    }
    if (visible && !audioPermission) {
      requestAudioPermission();
    }
  }, [visible]);

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    
    // Limpar todos os estados relacionados à foto e edição
    setCapturedPhoto(null);
    setCaption('');
    setIsEditing(false);
    setCroppedPreviewUri(null);
    setIsCropping(false);
    setShowTextEditor(false);
    setShowEmojiPicker(false);
    setShowStickers(false);
    setCurrentText('');
    
    // Resetar edições aplicadas
    setAppliedEdits({
      filter: null,
      emojis: [],
      stickers: [],
      texts: [],
      rotation: 0,
      crop: null
    });
    
    // Resetar área de corte para o próximo uso
    setCropArea({ 
      x: width * 0.1, 
      y: height * 0.2, 
      width: width * 0.8, 
      height: height * 0.4 
    });
    
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
        quality: isHDMode ? 1.0 : 0.8, // HD mode usa qualidade máxima
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

    // Verificar permissão de áudio antes de gravar
    if (!audioPermission) {
      const hasAudioPermission = await requestAudioPermission();
      if (!hasAudioPermission) {
        Alert.alert(
          'Permissão de Áudio Necessária',
          'Para gravar vídeos com áudio, é necessário permitir o acesso ao microfone.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        quality: isHDMode ? '1080p' : '720p', // HD mode usa resolução maior
        maxDuration: mode === 'voice-video' ? 30 : 60, // 30s para recado, 60s para vídeo normal
      });

      if (video?.uri) {
        console.log('=== DEBUG: Vídeo gravado ===');
        console.log('URI do vídeo:', video.uri);
        
        // Salvar na galeria
        if (mediaPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(video.uri);
        }
        
        // Em vez de enviar automaticamente, vamos capturar como foto para permitir edição
        setCapturedPhoto(video.uri);
        setIsEditing(true);
        
        // NÃO chamar onVideoTaken nem handleClose aqui
        // O usuário poderá editar e enviar manualmente
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

  const sendPhoto = async () => {
    if (capturedPhoto) {
      try {
        let processedImageUri = capturedPhoto;
        
        console.log('=== DEBUG CROP MELHORADO (SEND) ===');
        console.log('appliedEdits.crop:', appliedEdits.crop);
        console.log('Dimensões da tela - width:', width, 'height:', height);
        
        // Se há crop aplicado, processar a imagem
        if (appliedEdits.crop) {
          console.log('Processando crop...');
          
          // Obter dimensões da imagem original
          const imageInfo = await ImageManipulator.manipulateAsync(
            capturedPhoto,
            [],
            { format: ImageManipulator.SaveFormat.JPEG }
          );
          
          const originalWidth = imageInfo.width;
          const originalHeight = imageInfo.height;
          
          console.log('Dimensões da imagem original - width:', originalWidth, 'height:', originalHeight);
          
          // NOVO ALGORITMO: Calcular como a imagem é realmente exibida (mesmo do applyCrop)
          const imageAspectRatio = originalWidth / originalHeight;
          const containerAspectRatio = width / height;
          
          let visibleImageWidth, visibleImageHeight;
          let imageOffsetX = 0, imageOffsetY = 0;
          
          // Com resizeMode="cover", a imagem preenche todo o container
          // mantendo sua proporção, cortando o que exceder
          if (imageAspectRatio > containerAspectRatio) {
            // Imagem é mais larga que o container
            // A altura da imagem preenche o container, largura é cortada
            visibleImageHeight = height;
            visibleImageWidth = height * imageAspectRatio;
            imageOffsetX = -(visibleImageWidth - width) / 2; // Offset negativo = parte cortada
          } else {
            // Imagem é mais alta que o container  
            // A largura da imagem preenche o container, altura é cortada
            visibleImageWidth = width;
            visibleImageHeight = width / imageAspectRatio;
            imageOffsetY = -(visibleImageHeight - height) / 2; // Offset negativo = parte cortada
          }
          
          console.log('Imagem visível - width:', visibleImageWidth, 'height:', visibleImageHeight);
          console.log('Offset da imagem - X:', imageOffsetX, 'Y:', imageOffsetY);
          
          // Calcular as escalas de conversão da tela para a imagem original
          const scaleX = originalWidth / visibleImageWidth;
          const scaleY = originalHeight / visibleImageHeight;
          
          console.log('Escalas de conversão - scaleX:', scaleX, 'scaleY:', scaleY);
          
          // Converter coordenadas do crop da tela para a imagem original
          // Subtraímos o offset porque queremos a posição relativa à imagem visível
          const cropXOnImage = (appliedEdits.crop.x - imageOffsetX) * scaleX;
          const cropYOnImage = (appliedEdits.crop.y - imageOffsetY) * scaleY;
          const cropWidthOnImage = appliedEdits.crop.width * scaleX;
          const cropHeightOnImage = appliedEdits.crop.height * scaleY;
          
          console.log('Crop na imagem original:');
          console.log('cropX:', cropXOnImage, 'cropY:', cropYOnImage);
          console.log('cropWidth:', cropWidthOnImage, 'cropHeight:', cropHeightOnImage);
          
          // Garantir que as coordenadas estão dentro dos limites da imagem
          const finalCropX = Math.max(0, Math.min(Math.round(cropXOnImage), originalWidth - 1));
          const finalCropY = Math.max(0, Math.min(Math.round(cropYOnImage), originalHeight - 1));
          const finalCropWidth = Math.min(Math.round(cropWidthOnImage), originalWidth - finalCropX);
          const finalCropHeight = Math.min(Math.round(cropHeightOnImage), originalHeight - finalCropY);
          
          console.log('Coordenadas finais do crop:');
          console.log('cropX:', finalCropX, 'cropY:', finalCropY);
          console.log('cropWidth:', finalCropWidth, 'cropHeight:', finalCropHeight);
          
          // Aplicar o crop
          const croppedImage = await ImageManipulator.manipulateAsync(
            capturedPhoto,
            [
              {
                crop: {
                  originX: finalCropX,
                  originY: finalCropY,
                  width: finalCropWidth,
                  height: finalCropHeight,
                },
              },
            ],
            { 
              compress: 0.9, // Manter alta qualidade
              format: ImageManipulator.SaveFormat.JPEG 
            }
          );
          
          console.log('Imagem cortada - width:', croppedImage.width, 'height:', croppedImage.height);
          processedImageUri = croppedImage.uri;
        } else {
          console.log('Nenhum crop aplicado');
        }
        
        // Detectar se é vídeo pela URI
        const isVideoFile = capturedPhoto.toLowerCase().includes('.mp4') || 
                           capturedPhoto.toLowerCase().includes('.mov') || 
                           capturedPhoto.toLowerCase().includes('video');
        
        console.log('=== DEBUG: Enviando mídia ===');
        console.log('É vídeo?', isVideoFile);
        console.log('URI original:', capturedPhoto);
        console.log('URI processada:', processedImageUri);
        
        // Criar um objeto com a mídia processada
        const editedMedia = {
          uri: isVideoFile ? capturedPhoto : processedImageUri, // Para vídeos, usar URI original
          type: isVideoFile ? 'video' : 'photo',
          edits: isVideoFile ? null : { // Vídeos não suportam edições por enquanto
            ...appliedEdits,
            crop: null // Remover crop dos metadados já que foi aplicado
          }
        };
        
        if (isVideoFile && onVideoTaken) {
          onVideoTaken(editedMedia.uri);
        } else {
          onPhotoTaken(editedMedia, caption);
        }
        
        // Reset dos estados
        setCapturedPhoto(null);
        setCaption('');
        setIsEditing(false);
        setShowFilters(false);
        setSelectedFilter(null);
        setShowTextEditor(false);
        setShowEmojiPicker(false);
        setShowStickers(false);
        setIsHDMode(false);
        setAppliedEdits({
          filter: null,
          emojis: [],
          stickers: [],
          texts: [],
          rotation: 0,
          crop: null
        });
        setCurrentText('');
        setTextColor('#FFFFFF');
        handleClose();
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        Alert.alert('Erro', 'Não foi possível processar a imagem');
      }
    }
  };

  const backToCamera = () => {
    // Limpar todos os estados relacionados à foto e edição (mesmo que handleClose)
    setCapturedPhoto(null);
    setCaption('');
    setIsEditing(false);
    setCroppedPreviewUri(null);
    setIsCropping(false);
    setShowFilters(false);
    setSelectedFilter(null);
    setShowTextEditor(false);
    setShowEmojiPicker(false);
    setShowStickers(false);
    setCurrentText('');
    setIsHDMode(false);
    
    // Resetar edições aplicadas
    setAppliedEdits({
      filter: null,
      emojis: [],
      stickers: [],
      texts: [],
      rotation: 0,
      crop: null
    });
    
    // Resetar área de corte para o próximo uso
    setCropArea({ 
      x: width * 0.1, 
      y: height * 0.2, 
      width: width * 0.8, 
      height: height * 0.4 
    });
  };

  // Funções para os botões da tela de edição
  const toggleHDMode = () => {
    setIsHDMode(!isHDMode);
  };



  const rotateImage = () => {
    setAppliedEdits(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const cropImage = () => {
    if (isCropping) {
      // Aplicar o corte
      setAppliedEdits(prev => ({
        ...prev,
        crop: cropArea
      }));
      setIsCropping(false);
    } else {
      // Usar dimensões da tela para posicionamento inicial do crop
      // O cálculo correto será feito no momento do processamento com as dimensões reais da imagem
      setCropArea({ 
        x: width * 0.1, 
        y: height * 0.2, 
        width: width * 0.8, 
        height: height * 0.4 
      });
      setIsCropping(true);
      setShowFilters(false);
      setShowTextEditor(false);
      setShowEmojiPicker(false);
      setShowStickers(false);
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    // Limpar crop aplicado e prévia
    setAppliedEdits(prev => ({
      ...prev,
      crop: null
    }));
    setCroppedPreviewUri(null);
    // Resetar área de corte
    setCropArea({ 
      x: width * 0.1, 
      y: height * 0.2, 
      width: width * 0.8, 
      height: height * 0.4 
    });
  };

  const applyCrop = async () => {
    try {
      console.log('=== DEBUG CROP MELHORADO ===');
      console.log('Área de crop na tela:', JSON.stringify(cropArea));
      console.log('Dimensões da tela - width:', width, 'height:', height);
      
      // Aplicar o corte
      setAppliedEdits(prev => ({
        ...prev,
        crop: cropArea
      }));
      
      // Gerar prévia da imagem cortada
      if (capturedPhoto) {
        console.log('Processando crop...');
        
        // Obter dimensões da imagem original
        const imageInfo = await ImageManipulator.manipulateAsync(
          capturedPhoto,
          [],
          { format: ImageManipulator.SaveFormat.JPEG }
        );
        
        const originalWidth = imageInfo.width;
        const originalHeight = imageInfo.height;
        console.log('Dimensões da imagem original - width:', originalWidth, 'height:', originalHeight);
        
        // NOVO ALGORITMO: Calcular como a imagem é realmente exibida
        const imageAspectRatio = originalWidth / originalHeight;
        const containerAspectRatio = width / height;
        
        let visibleImageWidth, visibleImageHeight;
        let imageOffsetX = 0, imageOffsetY = 0;
        
        // Com resizeMode="cover", a imagem preenche todo o container
        // mantendo sua proporção, cortando o que exceder
        if (imageAspectRatio > containerAspectRatio) {
          // Imagem é mais larga que o container
          // A altura da imagem preenche o container, largura é cortada
          visibleImageHeight = height;
          visibleImageWidth = height * imageAspectRatio;
          imageOffsetX = -(visibleImageWidth - width) / 2; // Offset negativo = parte cortada
        } else {
          // Imagem é mais alta que o container  
          // A largura da imagem preenche o container, altura é cortada
          visibleImageWidth = width;
          visibleImageHeight = width / imageAspectRatio;
          imageOffsetY = -(visibleImageHeight - height) / 2; // Offset negativo = parte cortada
        }
        
        console.log('Imagem visível - width:', visibleImageWidth, 'height:', visibleImageHeight);
        console.log('Offset da imagem - X:', imageOffsetX, 'Y:', imageOffsetY);
        
        // Calcular as escalas de conversão da tela para a imagem original
        const scaleX = originalWidth / visibleImageWidth;
        const scaleY = originalHeight / visibleImageHeight;
        
        console.log('Escalas de conversão - scaleX:', scaleX, 'scaleY:', scaleY);
        
        // Converter coordenadas do crop da tela para a imagem original
        // Subtraímos o offset porque queremos a posição relativa à imagem visível
        const cropXOnImage = (cropArea.x - imageOffsetX) * scaleX;
        const cropYOnImage = (cropArea.y - imageOffsetY) * scaleY;
        const cropWidthOnImage = cropArea.width * scaleX;
        const cropHeightOnImage = cropArea.height * scaleY;
        
        console.log('Crop na imagem original:');
        console.log('cropX:', cropXOnImage, 'cropY:', cropYOnImage);
        console.log('cropWidth:', cropWidthOnImage, 'cropHeight:', cropHeightOnImage);
        
        // Garantir que as coordenadas estão dentro dos limites da imagem
        const finalCropX = Math.max(0, Math.min(Math.round(cropXOnImage), originalWidth - 1));
        const finalCropY = Math.max(0, Math.min(Math.round(cropYOnImage), originalHeight - 1));
        const finalCropWidth = Math.min(Math.round(cropWidthOnImage), originalWidth - finalCropX);
        const finalCropHeight = Math.min(Math.round(cropHeightOnImage), originalHeight - finalCropY);
        
        console.log('Coordenadas finais do crop:');
        console.log('finalCropX:', finalCropX, 'finalCropY:', finalCropY);
        console.log('finalCropWidth:', finalCropWidth, 'finalCropHeight:', finalCropHeight);
        
        // Gerar prévia cortada
        const croppedPreview = await ImageManipulator.manipulateAsync(
          capturedPhoto,
          [
            {
              crop: {
                originX: finalCropX,
                originY: finalCropY,
                width: finalCropWidth,
                height: finalCropHeight,
              },
            },
          ],
          { 
            format: ImageManipulator.SaveFormat.JPEG,
            compress: 0.8
          }
        );
        
        console.log('Imagem cortada - width:', croppedPreview.width, 'height:', croppedPreview.height);
        setCroppedPreviewUri(croppedPreview.uri);
      }
      
      setIsCropping(false);
    } catch (error) {
      console.error('Erro ao gerar prévia do crop:', error);
      // Em caso de erro, apenas aplicar o crop sem prévia
      setAppliedEdits(prev => ({
        ...prev,
        crop: cropArea
      }));
      setCroppedPreviewUri(null);
      setIsCropping(false);
    }
  };



  const toggleTextEditor = () => {
    setShowTextEditor(!showTextEditor);
    setShowFilters(false);
    setShowEmojiPicker(false);
    setShowStickers(false);
  };

  const addText = () => {
    if (currentText.trim()) {
      const newText = {
        id: Date.now().toString(),
        text: currentText,
        x: width / 2 - 50, // Posição central
        y: height / 2 - 100,
        color: textColor,
        size: 24
      };
      setAppliedEdits(prev => ({
        ...prev,
        texts: [...prev.texts, newText]
      }));
      setCurrentText('');
      setShowTextEditor(false);
    }
  };

  const updateTextPosition = (textId: string, x: number, y: number) => {
    setAppliedEdits(prev => ({
      ...prev,
      texts: prev.texts.map(text => 
        text.id === textId ? { ...text, x, y } : text
      )
    }));
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowFilters(false);
    setShowTextEditor(false);
    setShowStickers(false);
  };

  const addEmoji = (emoji: string) => {
    const newEmoji = {
      id: Date.now().toString(),
      emoji: emoji,
      x: width / 2 - 20, // Posição central
      y: height / 2 - 100
    };
    setAppliedEdits(prev => ({
      ...prev,
      emojis: [...prev.emojis, newEmoji]
    }));
  };

  const updateEmojiPosition = (emojiId: string, x: number, y: number) => {
    setAppliedEdits(prev => ({
      ...prev,
      emojis: prev.emojis.map(emoji => 
        emoji.id === emojiId ? { ...emoji, x, y } : emoji
      )
    }));
  };

  const toggleStickers = () => {
    setShowStickers(!showStickers);
    setShowFilters(false);
    setShowTextEditor(false);
    setShowEmojiPicker(false);
  };

  const addSticker = (sticker: string) => {
    const newSticker = {
      id: Date.now().toString(),
      sticker: sticker,
      x: width / 2 - 25, // Posição central
      y: height / 2 - 100
    };
    setAppliedEdits(prev => ({
      ...prev,
      stickers: [...prev.stickers, newSticker]
    }));
  };

  const updateStickerPosition = (stickerId: string, x: number, y: number) => {
    setAppliedEdits(prev => ({
      ...prev,
      stickers: prev.stickers.map(sticker => 
        sticker.id === stickerId ? { ...sticker, x, y } : sticker
      )
    }));
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
              
              {/* Indicador do modo de corte */}
              {isCropping && (
                <View style={styles.cropModeIndicator}>
                  <Text style={styles.cropModeText}>Modo Corte</Text>
                </View>
              )}
              
              <View style={styles.editHeaderControls}>
               <TouchableOpacity onPress={toggleHDMode} style={[styles.headerButton, isHDMode && styles.activeButton]}>
                 <Text style={[styles.hdText, isHDMode && styles.activeText]}>HD</Text>
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

            {/* Mídia capturada com overlays de edição */}
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                {/* Detectar se é vídeo e renderizar adequadamente */}
                {capturedPhoto && (capturedPhoto.toLowerCase().includes('.mp4') || 
                 capturedPhoto.toLowerCase().includes('.mov') || 
                 capturedPhoto.toLowerCase().includes('video')) ? (
                  // Renderizar vídeo
                  <Video
                    source={{ uri: capturedPhoto }}
                    style={[
                      styles.capturedImage,
                      {
                        transform: [
                          { rotate: `${appliedEdits.rotation}deg` }
                        ]
                      }
                    ]}
                    useNativeControls={true}
                    resizeMode="cover"
                    shouldPlay={false}
                    isLooping={false}
                  />
                ) : (
                  // Renderizar imagem
                  <Image 
                    source={{ uri: appliedEdits.crop && croppedPreviewUri ? croppedPreviewUri : capturedPhoto }} 
                    style={[
                      styles.capturedImage,
                      {
                        transform: [
                          { rotate: `${appliedEdits.rotation}deg` }
                        ]
                      }
                    ]} 
                  />
                )}
                


              </View>
              
              {/* Overlay para textos */}
              {appliedEdits.texts.map((textItem) => (
                <DraggableElement
                  key={textItem.id}
                  initialX={textItem.x}
                  initialY={textItem.y}
                  onPositionChange={(x, y) => updateTextPosition(textItem.id, x, y)}
                  style={styles.draggableElement}
                >
                  <Text
                    style={[
                      styles.overlayText,
                      {
                        color: textItem.color,
                        fontSize: textItem.size,
                      }
                    ]}
                  >
                    {textItem.text}
                  </Text>
                </DraggableElement>
              ))}
              
              {/* Overlay para emojis */}
              {appliedEdits.emojis.map((emojiItem) => (
                <DraggableElement
                  key={emojiItem.id}
                  initialX={emojiItem.x}
                  initialY={emojiItem.y}
                  onPositionChange={(x, y) => updateEmojiPosition(emojiItem.id, x, y)}
                  style={styles.draggableElement}
                >
                  <Text style={styles.overlayEmoji}>
                    {emojiItem.emoji}
                  </Text>
                </DraggableElement>
              ))}
              
              {/* Overlay para stickers */}
              {appliedEdits.stickers.map((stickerItem) => (
                <DraggableElement
                  key={stickerItem.id}
                  initialX={stickerItem.x}
                  initialY={stickerItem.y}
                  onPositionChange={(x, y) => updateStickerPosition(stickerItem.id, x, y)}
                  style={styles.draggableElement}
                >
                  <Text style={styles.overlaySticker}>
                    {stickerItem.sticker}
                  </Text>
                </DraggableElement>
              ))}
              
              {/* Interface de corte livre - estilo WhatsApp */}
              {isCropping && (
                <View style={styles.cropOverlay} pointerEvents="box-none">
                  {/* Máscara escura com recorte transparente */}
                  <View style={styles.cropMask} pointerEvents="none">
                    {/* Área superior */}
                    <View style={[styles.cropMaskArea, { height: cropArea.y }]} />
                    
                    {/* Linha do meio com laterais escuras */}
                    <View style={[styles.cropMaskRow, { height: cropArea.height, top: cropArea.y }]}>
                      <View style={[styles.cropMaskArea, { width: cropArea.x }]} />
                      <View style={{ width: cropArea.width, height: cropArea.height }} />
                      <View style={[styles.cropMaskArea, { flex: 1 }]} />
                    </View>
                    
                    {/* Área inferior */}
                    <View style={[styles.cropMaskArea, { flex: 1 }]} />
                  </View>
                  
                  {/* Grid de linhas estilo WhatsApp */}
                  <View 
                    style={[
                      styles.cropGrid,
                      {
                        left: cropArea.x,
                        top: cropArea.y,
                        width: cropArea.width,
                        height: cropArea.height,
                      }
                    ]}
                    pointerEvents="none"
                  >
                    {/* Linhas verticais */}
                    <View style={[styles.cropGridLine, { left: cropArea.width / 3, height: cropArea.height }]} />
                    <View style={[styles.cropGridLine, { left: (cropArea.width * 2) / 3, height: cropArea.height }]} />
                    
                    {/* Linhas horizontais */}
                    <View style={[styles.cropGridLine, { top: cropArea.height / 3, width: cropArea.width, height: 1 }]} />
                    <View style={[styles.cropGridLine, { top: (cropArea.height * 2) / 3, width: cropArea.width, height: 1 }]} />
                    
                    {/* Bordas da área de corte */}
                    <View style={styles.cropBorder} />
                  </View>
                  
                  {/* Handles dos cantos - posicionamento absoluto independente */}
                  {/* Handle canto superior esquerdo */}
                    <DraggableElement
                      initialX={cropArea.x - 25}
                      initialY={cropArea.y - 25}
                      isCropHandle={true}
                      onPositionChange={(deltaX, deltaY) => {
                         setCropArea(prev => {
                           const newX = Math.max(10, prev.x + deltaX);
                           const newY = Math.max(50, prev.y + deltaY);
                           const newWidth = Math.max(100, prev.width - deltaX);
                           const newHeight = Math.max(100, prev.height - deltaY);
                           return {
                             x: newX,
                             y: newY,
                             width: newWidth,
                             height: newHeight
                           };
                         });
                       }}
                     style={[styles.cropCornerHandle, {
                       left: cropArea.x - 25,
                       top: cropArea.y - 25,
                     }]}
                  >
                    <View style={styles.cropCornerIndicator} />
                  </DraggableElement>
                  
                  {/* Handle canto superior direito */}
                   <DraggableElement
                     initialX={cropArea.x + cropArea.width - 25}
                     initialY={cropArea.y - 25}
                     isCropHandle={true}
                     onPositionChange={(deltaX, deltaY) => {
                       setCropArea(prev => {
                         const newY = Math.max(50, prev.y + deltaY);
                         const newWidth = Math.max(100, prev.width + deltaX);
                         const newHeight = Math.max(100, prev.height - deltaY);
                         return {
                           ...prev,
                           y: newY,
                           width: newWidth,
                           height: newHeight
                         };
                       });
                     }}
                     style={[styles.cropCornerHandle, {
                       left: cropArea.x + cropArea.width - 25,
                       top: cropArea.y - 25,
                     }]}
                   >
                     <View style={styles.cropCornerIndicator} />
                   </DraggableElement>
                   
                   {/* Handle canto inferior esquerdo */}
                   <DraggableElement
                     initialX={cropArea.x - 25}
                     initialY={cropArea.y + cropArea.height - 25}
                     isCropHandle={true}
                     onPositionChange={(deltaX, deltaY) => {
                       setCropArea(prev => {
                         const newX = Math.max(10, prev.x + deltaX);
                         const newWidth = Math.max(100, prev.width - deltaX);
                         const newHeight = Math.max(100, prev.height + deltaY);
                         return {
                           x: newX,
                           width: newWidth,
                           height: newHeight,
                           y: prev.y
                         };
                       });
                     }}
                     style={[styles.cropCornerHandle, {
                       left: cropArea.x - 25,
                       top: cropArea.y + cropArea.height - 25,
                     }]}
                   >
                     <View style={styles.cropCornerIndicator} />
                   </DraggableElement>
                   
                   {/* Handle canto inferior direito */}
                   <DraggableElement
                     initialX={cropArea.x + cropArea.width - 25}
                     initialY={cropArea.y + cropArea.height - 25}
                     isCropHandle={true}
                     onPositionChange={(deltaX, deltaY) => {
                       setCropArea(prev => {
                         const newWidth = Math.max(100, prev.width + deltaX);
                         const newHeight = Math.max(100, prev.height + deltaY);
                         return {
                           ...prev,
                           width: newWidth,
                           height: newHeight
                         };
                       });
                     }}
                     style={[styles.cropCornerHandle, {
                       left: cropArea.x + cropArea.width - 25,
                       top: cropArea.y + cropArea.height - 25,
                     }]}
                   >
                     <View style={styles.cropCornerIndicator} />
                   </DraggableElement>
                  
                  {/* Área central para mover - sem ícone */}
                  <DraggableElement
                    initialX={0}
                    initialY={0}
                    isCropHandle={true}
                    onPositionChange={(x, y) => {
                      const maxX = width - cropArea.width - 20;
                      const maxY = height - cropArea.height - 200; // Espaço para controles
                      setCropArea(prev => ({
                        ...prev,
                        x: Math.max(10, Math.min(maxX, prev.x + x)),
                        y: Math.max(50, Math.min(maxY, prev.y + y))
                      }));
                    }}
                    style={[
                      styles.cropMoveArea,
                      {
                        left: cropArea.x + 20,
                        top: cropArea.y + 20,
                        width: cropArea.width - 40,
                        height: cropArea.height - 40,
                      }
                    ]}
                  />
                  
                  {/* Ícone de movimento na parte superior central */}
                  <DraggableElement
                    initialX={cropArea.x + (cropArea.width / 2) - 20}
                    initialY={cropArea.y - 35}
                    isCropHandle={true}
                    onPositionChange={(x, y) => {
                      const maxX = width - cropArea.width - 20;
                      const maxY = height - cropArea.height - 200; // Espaço para controles
                      setCropArea(prev => ({
                        ...prev,
                        x: Math.max(10, Math.min(maxX, prev.x + x)),
                        y: Math.max(50, Math.min(maxY, prev.y + y))
                      }));
                    }}
                    style={styles.cropMoveHandle}
                  >
                    <View style={styles.cropMoveIcon}>
                      <View style={styles.cropMoveIconDot} />
                      <View style={styles.cropMoveIconDot} />
                      <View style={styles.cropMoveIconDot} />
                      <View style={styles.cropMoveIconDot} />
                    </View>
                  </DraggableElement>
                </View>
              )}
            </View>

            {/* Painéis de ferramentas */}

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
                 <View style={styles.textEditorContainer}>
                   <TextInput
                     style={styles.textInput}
                     placeholder="Digite seu texto..."
                     placeholderTextColor="#9CA3AF"
                     value={currentText}
                     onChangeText={setCurrentText}
                     multiline
                   />
                   <View style={styles.colorPicker}>
                     {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((color) => (
                       <TouchableOpacity
                         key={color}
                         onPress={() => setTextColor(color)}
                         style={[
                           styles.colorOption,
                           { backgroundColor: color },
                           textColor === color && styles.selectedColorOption
                         ]}
                       />
                     ))}
                   </View>
                   <TouchableOpacity onPress={addText} style={styles.addTextButton}>
                     <Text style={styles.addTextButtonText}>Adicionar Texto</Text>
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
            <View style={styles.editFooter} pointerEvents="box-none">
              {isCropping ? (
                // Botões de controle do corte
                <View style={styles.cropControlsFooter} pointerEvents="box-none">
                  <TouchableOpacity 
                    onPress={cancelCrop} 
                    style={styles.cropCancelButton}
                    activeOpacity={0.7}
                    pointerEvents="auto"
                  >
                    <Text style={styles.cropButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={applyCrop} 
                    style={styles.cropApplyButton}
                    activeOpacity={0.7}
                    pointerEvents="auto"
                  >
                    <Text style={styles.cropButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Footer normal
                <>
                  <Text style={styles.senderText}>Eu (você)</Text>
                  <TouchableOpacity onPress={sendPhoto} style={styles.sendButton}>
                    <Send size={24} color="white" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ) : (
          // Tela da Câmera
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              flash={flash}
              mode={mode === 'photo' ? 'picture' : 'video'}
            />
            
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
                    <VideoIcon size={24} color="white" />
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
          </>
        )}
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
  cropModeIndicator: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  cropModeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: 'transparent',
  },
  imageWrapper: {
    width: 300,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  capturedImage: {
    width: 300,
    height: 400,
    resizeMode: 'cover',
    borderRadius: 10,
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
    zIndex: 100, // Z-index muito alto para garantir que sempre fique visível
    elevation: 20, // Para Android
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
   // Estilos para overlays de edição
   overlayText: {
     fontWeight: 'bold',
     textShadowColor: 'rgba(0, 0, 0, 0.75)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
     minWidth: 40,
     minHeight: 40,
     textAlign: 'center',
     backgroundColor: 'rgba(0, 0, 0, 0.3)',
     borderRadius: 8,
     paddingHorizontal: 8,
     paddingVertical: 4,
   },
   overlayEmoji: {
     fontSize: 32,
     minWidth: 50,
     minHeight: 50,
     textAlign: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 25,
     paddingHorizontal: 8,
     paddingVertical: 8,
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.5)',
   },
   overlaySticker: {
     fontSize: 32,
     minWidth: 50,
     minHeight: 50,
     textAlign: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 25,
     paddingHorizontal: 8,
     paddingVertical: 8,
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.5)',
   },
   draggableElement: {
     minWidth: 50,
     minHeight: 50,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.4)',
     borderRadius: 8,
     backgroundColor: 'rgba(0, 0, 0, 0.2)',
   },
   // Estilos para o novo editor de texto
   textEditorContainer: {
     gap: 15,
   },
   textInput: {
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     color: 'white',
     padding: 12,
     borderRadius: 10,
     fontSize: 16,
     minHeight: 40,
     maxHeight: 80,
   },
   colorPicker: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: 8,
   },
   colorOption: {
     width: 30,
     height: 30,
     borderRadius: 15,
     borderWidth: 2,
     borderColor: 'transparent',
   },
   selectedColorOption: {
     borderColor: 'white',
     borderWidth: 3,
   },
   addTextButton: {
     backgroundColor: '#007AFF',
     padding: 12,
     borderRadius: 10,
     alignItems: 'center',
   },
   addTextButtonText: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600',
   },

   // Estilos para corte livre - estilo WhatsApp
   cropOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     zIndex: 20,
   },
   cropMask: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     flexDirection: 'column',
   },
   cropMaskArea: {
     backgroundColor: 'rgba(0, 0, 0, 0.6)',
   },
   cropMaskRow: {
     position: 'absolute',
     left: 0,
     right: 0,
     flexDirection: 'row',
   },
   cropGrid: {
     position: 'absolute',
     zIndex: 21,
   },
   cropGridLine: {
     position: 'absolute',
     backgroundColor: 'rgba(255, 255, 255, 0.8)',
     width: 1,
   },
   cropBorder: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     borderWidth: 2,
     borderColor: '#FFFFFF',
     borderStyle: 'solid',
   },
   cropCornerHandle: {
     position: 'absolute',
     width: 50, // Diminuído para ficar mais discreto
     height: 50, // Diminuído para ficar mais discreto
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 30,
     padding: 10, // Área de toque menor
   },
   cropCornerIndicator: {
     width: 25, // Diminuído para ficar mais discreto
     height: 25, // Diminuído para ficar mais discreto
     backgroundColor: '#007AFF', // Azul para contraste
     borderRadius: 4, // Diminuído
     borderWidth: 2, // Diminuído
     borderColor: '#FFFFFF', // Borda branca para contraste
     elevation: 6, // Diminuído
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
   },
   cropMoveArea: {
     position: 'absolute',
     zIndex: 22,
     backgroundColor: 'transparent', // Totalmente transparente como no WhatsApp
     minHeight: 60, // Altura mínima para facilitar o toque
     minWidth: 60, // Largura mínima para facilitar o toque
     // Remover bordas para ficar mais limpo
   },
   cropMoveHandle: {
     position: 'absolute',
     width: 40,
     height: 30,
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 25,
     backgroundColor: 'rgba(0, 0, 0, 0.3)',
     borderRadius: 15,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.5)',
   },
   cropMoveIcon: {
     width: 16,
     height: 12,
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     alignItems: 'center',
     opacity: 0.9,
   },
   cropMoveIconDot: {
     width: 3,
     height: 3,
     backgroundColor: '#FFFFFF',
     borderRadius: 1.5,
     margin: 0.5,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.5,
     shadowRadius: 1,
     elevation: 2,
   },
   cropControlsFooter: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     width: '100%',
     paddingHorizontal: 30,
     paddingVertical: 20, // Aumentado para mais espaço
     backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fundo mais visível
     borderTopWidth: 1,
     borderTopColor: 'rgba(255, 255, 255, 0.2)',
     zIndex: 50, // Z-index alto para ficar acima de todos os elementos de corte
     elevation: 10, // Para Android
   },
   cropCancelButton: {
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     paddingHorizontal: 40, // Aumentado
     paddingVertical: 18, // Aumentado
     borderRadius: 35, // Aumentado
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.5)',
     minWidth: 140, // Aumentado
     minHeight: 56, // Altura mínima para toque
     elevation: 15, // Elevation alto para Android
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 0.3,
     shadowRadius: 5,
     zIndex: 51, // Z-index ainda maior
   },
   cropApplyButton: {
     backgroundColor: '#007AFF',
     paddingHorizontal: 40, // Aumentado
     paddingVertical: 18, // Aumentado
     borderRadius: 35, // Aumentado
     minWidth: 140, // Aumentado
     minHeight: 56, // Altura mínima para toque
     elevation: 15, // Elevation alto para Android
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 0.3,
     shadowRadius: 5,
     zIndex: 51, // Z-index ainda maior
   },
   cropButtonText: {
     color: 'white',
     fontSize: 20, // Aumentado
     fontWeight: '700',
     textAlign: 'center',
   },

 });