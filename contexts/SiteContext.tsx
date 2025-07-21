import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '@/services/AuthService';

interface Site {
  id: string;
  name: string;
  address: string;
  company: string;
}

interface SiteContextData {
  currentSite: Site | null;
  setCurrentSite: (site: Site | null) => void;
}

const SiteContext = createContext<SiteContextData>({} as SiteContextData);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [currentSite, setCurrentSite] = useState<Site | null>(null);

  useEffect(() => {
    async function loadSite() {
      const site = await AuthService.getCurrentSite();
      if (site) {
        setCurrentSite({ ...site, company: '' });
      }
    }
    loadSite();
  }, []);

  return (
    <SiteContext.Provider value={{ currentSite, setCurrentSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite deve ser usado dentro de um SiteProvider');
  }
  return context;
} 