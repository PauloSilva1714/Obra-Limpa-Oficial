import { AuthService, Site } from './AuthService';

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

      return sites.map((site: Site) => {
        const stats = this.demoSiteStats.find((s) => s.id === site.id);
        return {
          ...site,
          tasksCount: stats?.tasksCount || 0,
          completedTasks: stats?.completedTasks || 0,
        };
      });
    } catch (error) {
      console.error('Error loading user sites:', error);
      return [];
    }
  }
}

export const SiteService = new SiteManagementService();
