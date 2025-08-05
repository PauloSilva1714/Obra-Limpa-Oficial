import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './AuthService';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string | string[];
  siteId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
  photos: string[];
  videos: string[];
  area: string;
  comments?: Comment[];
  createdByName?: string; // Nome do criador da tarefa
  createdByPhotoURL?: string; // URL da foto do criador
  createdById?: string; // ID do criador da tarefa
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export class TaskService {
  private static instance: TaskService;
  private static TASKS_KEY = 'tasks';

  private constructor() {}

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  private validateMediaUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static async getTasks(): Promise<Task[]> {
    try {
      const currentSite = await AuthService.getCurrentSite();
      if (!currentSite) {
        throw new Error('Nenhuma obra selecionada');
      }

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', currentSite.id),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);

      const tasks = snapshot.docs.map(
        (doc, index) => {
          const taskData = doc.data();

          return {
            id: doc.id,
            ...taskData,
          } as Task;
        }
      );

      return tasks;
    } catch (error) {
      throw error;
    }
  }

  static async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    try {

      const currentSite = await AuthService.getCurrentSite();
      if (!currentSite) {
        throw new Error('Nenhuma obra selecionada');
      }

      // Buscar nome e foto do usuário atual
      const currentUser = await AuthService.getCurrentUser();
      const createdByName = currentUser?.name || 'Usuário';
      const createdByPhotoURL = currentUser?.photoURL || null;
      const createdById = currentUser?.id || null;

      const now = new Date().toISOString();
      const newTask: any = {
        ...task,
        siteId: currentSite.id,
        createdAt: now,
        updatedAt: now,
        photos: task.photos?.filter(url => TaskService.validateMediaUrlStatic(url)) || [],
        videos: task.videos?.filter(url => TaskService.validateMediaUrlStatic(url)) || [],
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        comments: [], // Garantir que comments sempre seja um array
        createdByName, // Adiciona o nome do criador
        createdByPhotoURL, // Adiciona a foto do criador
        createdById, // Adiciona o ID do criador
      };
      if (!newTask.completedAt) {
        delete newTask.completedAt;
      }

      const docRef = await addDoc(collection(db, 'tasks'), newTask);

      // Verificar se a tarefa foi realmente criada
      const createdTask = await TaskService.getTaskById(docRef.id);

      return {
        id: docRef.id,
        ...newTask,
      };
    } catch (error) {
      throw error;
    }
  }

  static async addTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    return TaskService.createTask({
      ...task,
      comments: [], // Garantir que comments sempre seja um array
    });
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        photos: updates.photos?.filter(url => TaskService.validateMediaUrlStatic(url)) || [],
        videos: updates.videos?.filter(url => TaskService.validateMediaUrlStatic(url)) || [],
        updatedAt: serverTimestamp(),
      };
      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      await updateDoc(doc(db, 'tasks', taskId), updateData);
    } catch (error) {
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      throw error;
    }
  }

  // Função utilitária estática para validação de URL
  static validateMediaUrlStatic(url: string): boolean {
    if (!url) {
      return false;
    }
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async completeTask(taskId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) {
        return null;
      }
      return {
        id: taskDoc.id,
        ...taskDoc.data(),
      } as Task;
    } catch (error) {
      throw error;
    }
  }

  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    try {
      const siteId = await AsyncStorage.getItem('selectedSite');
      if (!siteId) {
        throw new Error('Nenhuma obra selecionada');
      }

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', siteId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
    } catch (error) {
      throw error;
    }
  }

  async getTasksByWorker(workerId: string): Promise<Task[]> {
    try {
      const siteId = await AsyncStorage.getItem('selectedSite');
      if (!siteId) {
        throw new Error('Nenhuma obra selecionada');
      }

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', siteId),
        where('assignedTo', '==', workerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
    } catch (error) {
      throw error;
    }
  }

  async getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
    try {
      const siteId = await AsyncStorage.getItem('selectedSite');
      if (!siteId) {
        throw new Error('Nenhuma obra selecionada');
      }

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', siteId),
        where('priority', '==', priority),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
    } catch (error) {
      throw error;
    }
  }

  static async getTasksBySite(siteId: string): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', siteId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
    } catch (error) {
      throw error;
    }
  }

  async getTasksBySiteAndStatus(
    siteId: string,
    status: Task['status']
  ): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', siteId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
    } catch (error) {
      throw error;
    }
  }

  async getTasksBySiteAndWorker(
    siteId: string,
    workerId: string
  ): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', siteId),
        where('assignedTo', '==', workerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
    } catch (error) {
      throw error;
    }
  }

  async getTasksBySiteAndPriority(
    siteId: string,
    priority: Task['priority']
  ): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', siteId),
        where('priority', '==', priority),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Task)
      );
    } catch (error) {
      throw error;
    }
  }

  static subscribeToTasksBySite(siteId: string, callback: (tasks: Task[]) => void) {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('siteId', '==', siteId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Task));
      callback(tasks);
    });
  }

  static async addComment(taskId: string, comment: Comment): Promise<void> {
    try {

      const taskRef = doc(db, 'tasks', taskId);

      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('Tarefa não encontrada');
      }

      const taskData = taskDoc.data();

      const currentComments = taskData.comments || [];

      const updatedComments = [...currentComments, comment];

      await updateDoc(taskRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        return [];
      }

      let tasksQuery;

      if (currentUser.role === 'admin') {
        // Administradores podem ver todas as tarefas
        tasksQuery = query(
          collection(db, 'tasks'),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Workers só veem tarefas das obras que têm acesso
        if (!currentUser.sites || currentUser.sites.length === 0) {
          return [];
        }

        tasksQuery = query(
          collection(db, 'tasks'),
          where('siteId', 'in', currentUser.sites),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(tasksQuery);

      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));

      return tasks;
    } catch (error) {
      return [];
    }
  }
}

const taskService = TaskService.getInstance();
export { taskService };
export default TaskService;
