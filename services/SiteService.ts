import { AuthService, Site } from './AuthService';
import { TaskService } from './TaskService';

export interface SiteWithStats extends Site {
  tasksCount: number;
  completedTasks: number;
}

class SiteManagementService {
  private demoSiteStats = [
    {
      id: '1',
      tasksCount: 25,
      completedTasks: 18,
    },
    {
      id: '2',
      tasksCount: 32,
      completedTasks: 8,
    },
    {
      id: '3',
      tasksCount: 15,
      completedTasks: 15,
    },
  ];

  async getUserSites(): Promise<SiteWithStats[]> {
    try {
      const sites = await AuthService.getUserSites();
      // Buscar contagem real de tarefas para cada obra
      const sitesWithStats = await Promise.all(
        sites.map(async (site: Site) => {
          const tasks = await TaskService.getTasksBySite(site.id);
          const tasksCount = tasks.length;
          const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
          return {
            ...site,
            tasksCount,
            completedTasks,
          };
        })
      );
      return sitesWithStats;
    } catch (error) {
      console.error('Error loading user sites:', error);
      return [];
    }
  }
}

export const SiteService = new SiteManagementService();
