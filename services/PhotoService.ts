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
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  async getRecentPhotos(): Promise<string[]> {
    try {
      const photosData = await AsyncStorage.getItem(this.PHOTOS_KEY);
      return photosData ? JSON.parse(photosData) : [];
    } catch (error) {
      console.error('Error loading recent photos:', error);
      return [];
    }
  }

  async deletePhoto(photoUri: string): Promise<void> {
    try {
      const existingPhotos = await this.getRecentPhotos();
      const updatedPhotos = existingPhotos.filter(uri => uri !== photoUri);
      await AsyncStorage.setItem(this.PHOTOS_KEY, JSON.stringify(updatedPhotos));
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  async clearAllPhotos(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PHOTOS_KEY);
    } catch (error) {
      console.error('Error clearing photos:', error);
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
        console.error('[PhotoService] Erro na resposta fetch:', response.status);
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
    console.error('[PhotoService] Erro no upload de imagem:', error);
    return typeof uriOrFile === 'string' ? uriOrFile : '';
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
    console.error('❌ Erro no upload de foto de perfil:', error);
    return typeof uriOrFile === 'string' ? uriOrFile : '';
  }
}