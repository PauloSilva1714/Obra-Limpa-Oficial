import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';

class PhotoManagementService {
  private readonly PHOTOS_KEY = '@recent_photos';

  async savePhoto(photoUri: string): Promise<void> {
    try {
      const existingPhotos = await this.getRecentPhotos();
      const updatedPhotos = [photoUri, ...existingPhotos.slice(0, 9)]; // Keep last 10 photos
      await AsyncStorage.setItem(this.PHOTOS_KEY, JSON.stringify(updatedPhotos));
    } catch (error) {
      throw error;
    }
  }

  async getRecentPhotos(): Promise<string[]> {
    try {
      const photosData = await AsyncStorage.getItem(this.PHOTOS_KEY);
      return photosData ? JSON.parse(photosData) : [];
    } catch (error) {
      return [];
    }
  }

  async deletePhoto(photoUri: string): Promise<void> {
    try {
      const existingPhotos = await this.getRecentPhotos();
      const updatedPhotos = existingPhotos.filter(uri => uri !== photoUri);
      await AsyncStorage.setItem(this.PHOTOS_KEY, JSON.stringify(updatedPhotos));
    } catch (error) {
      throw error;
    }
  }

  async clearAllPhotos(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PHOTOS_KEY);
    } catch (error) {
      throw error;
    }
  }
}

export const PhotoService = new PhotoManagementService();

export async function uploadImageAsync(
  uriOrFile: string | File,
  userId: string
): Promise<string> {
  try {
    
    const storage = getStorage();
    let blob: Blob;
    let fileName: string;

    if (typeof uriOrFile === 'string') {
      // Mobile: uri
      // Verificar se é uma foto tirada pela câmera (geralmente começa com file:// em dispositivos móveis)
      const isCameraPhoto = uriOrFile.startsWith('file://') || 
                           uriOrFile.includes('Camera') || 
                           uriOrFile.includes('camera');
      
      // Processar a imagem com opções específicas para fotos da câmera
      const response = await fetch(uriOrFile);
      if (!response.ok) {
        throw new Error(`Erro ao buscar imagem: ${response.status}`);
      }
      
      blob = await response.blob();
      
      // Usar um nome de arquivo diferente para fotos da câmera para facilitar o diagnóstico
      if (isCameraPhoto) {
        fileName = `tasks/${userId}/camera_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        console.log('Processando foto da câmera:', fileName);
      } else {
        fileName = `tasks/${userId}/gallery_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      }
    } else {
      // Web: File
      blob = uriOrFile;
      fileName = `tasks/${userId}/web_${Date.now()}_${uriOrFile.name}`;
    }

    // Adicionar log para diagnóstico
    console.log('Fazendo upload de imagem:', { 
      tipo: typeof uriOrFile === 'string' ? 'URI' : 'File',
      tamanho: blob.size,
      fileName
    });

    const fileRef = ref(storage, fileName);
    
    await uploadBytes(fileRef, blob);
    
    const downloadURL = await getDownloadURL(fileRef);
    console.log('Upload concluído com sucesso:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw new Error('Falha ao fazer upload da imagem. Verifique sua conexão com a internet.');
  }
}

export async function uploadVideoAsync(
  uriOrFile: string | File,
  userId: string
): Promise<string> {
  try {
    
    const storage = getStorage();
    let blob: Blob;
    let fileName: string;

    if (typeof uriOrFile === 'string') {
      // Mobile: uri
      const response = await fetch(uriOrFile);
      if (!response.ok) {
        throw new Error(`Erro ao buscar vídeo: ${response.status}`);
      }
      blob = await response.blob();
      fileName = `videos/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
    } else {
      // Web: File
      blob = uriOrFile;
      const fileExtension = uriOrFile.name.split('.').pop() || 'mp4';
      fileName = `videos/${userId}/${Date.now()}_${uriOrFile.name.replace(/\.[^/.]+$/, '')}.${fileExtension}`;
    }

    const fileRef = ref(storage, fileName);
    
    await uploadBytes(fileRef, blob);
    
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload do vídeo:', error);
    throw new Error('Falha ao fazer upload do vídeo. Verifique sua conexão com a internet.');
  }
}

export async function uploadProfilePhoto(userId: string, uriOrFile: string | File): Promise<string> {
  try {
    const storage = getStorage();
    let blob: Blob;
    let fileName: string;

    if (typeof uriOrFile === 'string') {
      const response = await fetch(uriOrFile);
      if (!response.ok) throw new Error(`Erro ao buscar imagem: ${response.status}`);
      blob = await response.blob();
      fileName = `profile/${userId}/profile_${Date.now()}.jpg`;
    } else {
      blob = uriOrFile;
      fileName = `profile/${userId}/profile_${Date.now()}_${uriOrFile.name}`;
    }

    const fileRef = ref(storage, fileName);
    await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload da foto de perfil:', error);
    throw new Error('Falha ao fazer upload da foto de perfil. Verifique sua conexão com a internet.');
  }
}