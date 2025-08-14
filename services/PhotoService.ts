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
      const response = await fetch(uriOrFile);
      if (!response.ok) {
        throw new Error(`Erro ao buscar imagem: ${response.status}`);
      }
      blob = await response.blob();
      fileName = `tasks/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    } else {
      // Web: File
      blob = uriOrFile;
      fileName = `tasks/${userId}/${Date.now()}_${uriOrFile.name}`;
    }

    const fileRef = ref(storage, fileName);
    
    await uploadBytes(fileRef, blob);
    
    const downloadURL = await getDownloadURL(fileRef);
    
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