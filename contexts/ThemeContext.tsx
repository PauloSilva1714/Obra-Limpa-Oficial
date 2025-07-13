import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  colors: ThemeColors;
}

interface ThemeColors {
  // Cores principais
  primary: string;
  secondary: string;
  accent: string;
  
  // Cores de fundo
  background: string;
  surface: string;
  card: string;
  
  // Cores de texto
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Cores de borda
  border: string;
  borderLight: string;
  
  // Cores de status
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Cores de prioridade
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  
  // Cores de status de tarefa
  statusPending: string;
  statusInProgress: string;
  statusCompleted: string;
}

const lightColors: ThemeColors = {
  // Cores principais
  primary: '#F97316',
  secondary: '#6B7280',
  accent: '#3B82F6',
  
  // Cores de fundo
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  // Cores de texto
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  
  // Cores de borda
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Cores de status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Cores de prioridade
  priorityLow: '#10B981',
  priorityMedium: '#F59E0B',
  priorityHigh: '#EF4444',
  
  // Cores de status de tarefa
  statusPending: '#F59E0B',
  statusInProgress: '#3B82F6',
  statusCompleted: '#10B981',
};

const darkColors: ThemeColors = {
  // Cores principais
  primary: '#F97316',
  secondary: '#9CA3AF',
  accent: '#60A5FA',
  
  // Cores de fundo
  background: '#111827',
  surface: '#1F2937',
  card: '#374151',
  
  // Cores de texto
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  
  // Cores de borda
  border: '#374151',
  borderLight: '#4B5563',
  
  // Cores de status
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // Cores de prioridade
  priorityLow: '#34D399',
  priorityMedium: '#FBBF24',
  priorityHigh: '#F87171',
  
  // Cores de status de tarefa
  statusPending: '#FBBF24',
  statusInProgress: '#60A5FA',
  statusCompleted: '#34D399',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      // Erro ao carregar preferência de tema: error
    }
  };

  const saveThemePreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(value));
    } catch (error) {
      // Erro ao salvar preferência de tema: error
    }
  };

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    saveThemePreference(newValue);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    saveThemePreference(value);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}; 