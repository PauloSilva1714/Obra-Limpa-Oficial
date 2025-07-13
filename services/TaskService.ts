import { db } from '@/config/firebase';
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
  assignedTo?: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
  photos: string[];
  videos: string[];
  area: string;
  comments?: Comment[];
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
      console.log('[TaskService] Iniciando busca de tarefas...');
      const currentSite = await AuthService.getCurrentSite();
      if (!currentSite) {
        throw new Error('Nenhuma obra selecionada');
      }

      console.log('[TaskService] Site atual para busca:', currentSite.id);

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', currentSite.id),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      
      console.log('[TaskService] Total de tarefas encontradas:', snapshot.size);
      
      const tasks = snapshot.docs.map(
        (doc, index) => {
          const taskData = doc.data();
          console.log(`[TaskService] Tarefa ${index + 1}:`, {
            id: doc.id,
            title: taskData.title,
            siteId: taskData.siteId,
            status: taskData.status,
            createdAt: taskData.createdAt,
            photos: taskData.photos?.length || 0,
            photoUrls: taskData.photos || []
          });
          return {
            id: doc.id,
            ...taskData,
          } as Task;
        }
      );
      
      console.log('[TaskService] Lista final de tarefas:', tasks.map(t => ({ id: t.id, title: t.title })));
      return tasks;
    } catch (error) {
      console.error('[TaskService] Erro ao obter tarefas:', error);
      throw error;
    }
  }

  static async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    try {
      console.log('[TaskService] Iniciando criação de nova tarefa:', task);
      
      const currentSite = await AuthService.getCurrentSite();
      if (!currentSite) {
        throw new Error('Nenhuma obra selecionada');
      }

      console.log('[TaskService] Site atual:', currentSite.id);

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
      };
      if (!newTask.completedAt) {
        delete newTask.completedAt;
      }

      console.log('[TaskService] Dados da tarefa a serem salvos:', newTask);
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      console.log('[TaskService] Tarefa criada com ID:', docRef.id);

      // Verificar se a tarefa foi realmente criada
      const createdTask = await TaskService.getTaskById(docRef.id);
      console.log('[TaskService] Tarefa criada confirmada:', createdTask);

      return {
        id: docRef.id,
        ...newTask,
      };
    } catch (error) {
      console.error('[TaskService] Erro ao criar tarefa:', error);
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
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('TaskService: Iniciando exclusão da tarefa:', taskId);
      const taskRef = doc(db, 'tasks', taskId);
      console.log('TaskService: Referência da tarefa criada');
      await deleteDoc(taskRef);
      console.log('TaskService: Tarefa excluída com sucesso');
    } catch (error) {
      console.error('TaskService: Erro ao deletar tarefa:', error);
      throw error;
    }
  }

  // Função utilitária estática para validação de URL
  static validateMediaUrlStatic(url: string): boolean {
    console.log('[TaskService] Validando URL:', url);
    if (!url) {
      console.log('[TaskService] URL vazia, retornando false');
      return false;
    }
    try {
      new URL(url);
      console.log('[TaskService] URL válida:', url);
      return true;
    } catch {
      console.log('[TaskService] URL inválida:', url);
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
      console.error('Erro ao completar tarefa:', error);
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
      console.error('Erro ao obter tarefa:', error);
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
      console.error('Erro ao obter tarefas por status:', error);
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
      console.error('Erro ao obter tarefas da obra por colaborador:', error);
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
      console.error('Erro ao obter tarefas por prioridade:', error);
      throw error;
    }
  }

  async getTasksBySite(siteId: string): Promise<Task[]> {
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
      console.error('Erro ao obter tarefas da obra:', error);
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
      console.error('Erro ao obter tarefas da obra por status:', error);
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
      console.error('Erro ao obter tarefas da obra por colaborador:', error);
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
      console.error('Erro ao obter tarefas da obra por prioridade:', error);
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
      console.log('[TaskService] Iniciando adição de comentário:', { taskId, comment });
      
      const taskRef = doc(db, 'tasks', taskId);
      console.log('[TaskService] Referência da tarefa criada');
      
      const taskDoc = await getDoc(taskRef);
      console.log('[TaskService] Documento da tarefa obtido, existe:', taskDoc.exists());
      
      if (!taskDoc.exists()) {
        throw new Error('Tarefa não encontrada');
      }
      
      const taskData = taskDoc.data();
      console.log('[TaskService] Dados da tarefa obtidos:', taskData);
      
      const currentComments = taskData.comments || [];
      console.log('[TaskService] Comentários atuais:', currentComments);
      
      const updatedComments = [...currentComments, comment];
      console.log('[TaskService] Comentários atualizados:', updatedComments);
      
      console.log('[TaskService] Atualizando documento no Firestore...');
      await updateDoc(taskRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp(),
      });
      console.log('[TaskService] Documento atualizado com sucesso');
    } catch (error) {
      console.error('[TaskService] Erro ao adicionar comentário:', error);
      throw error;
    }
  }
}

const taskService = TaskService.getInstance();
export { taskService };
export default TaskService;
