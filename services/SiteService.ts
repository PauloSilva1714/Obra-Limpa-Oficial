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
      console.log('=== DEBUG: SiteService.getUserSites iniciada ===');
      const sites = await AuthService.getUserSites();
      console.log('=== DEBUG: Obras retornadas pelo AuthService:', sites.length);

      // Buscar contagem real de tarefas para cada obra
      const sitesWithStats = await Promise.all(
        sites.map(async (site: Site) => {
          console.log('=== DEBUG: Buscando tarefas para obra:', site.id, site.name);
          const tasks = await TaskService.getTasksBySite(site.id);
          const tasksCount = tasks.length;
          const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
          console.log('=== DEBUG: Estatísticas da obra', site.name, ':', tasksCount, 'tarefas,', completedTasks, 'concluídas');
          return {
            ...site,
            tasksCount,
            completedTasks,
          };
        })
      );

      console.log('=== DEBUG: Total de obras com estatísticas:', sitesWithStats.length);
      return sitesWithStats;
    } catch (error) {
      console.error('=== DEBUG: Erro em SiteService.getUserSites:', error);
      return [];
    }
  }
}

export const SiteService = new SiteManagementService();
