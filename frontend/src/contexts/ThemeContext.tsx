import React, { createContext, useContext, useEffect, useState } from 'react';
import { colorThemes, type ColorTheme } from '@/lib/theme-utils';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  toggleTheme: () => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  availableColorThemes: { value: ColorTheme; label: string; preview: string; description: string }[];
}

const availableColorThemes = Object.entries(colorThemes).map(([key, config]) => ({
  value: key as ColorTheme,
  label: config.name,
  preview: config.preview,
  description: config.description
}));

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const savedColorTheme = localStorage.getItem('colorTheme');
    if (savedColorTheme && availableColorThemes.some(t => t.value === savedColorTheme)) {
      return savedColorTheme as ColorTheme;
    }
    return 'blue';
  });

  useEffect(() => {
    // Update localStorage
    localStorage.setItem('theme', theme);
    
    // Update document class for dark/light mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Update localStorage
    localStorage.setItem('colorTheme', colorTheme);
    
    // Remove all color theme classes
    availableColorThemes.forEach(({ value }) => {
      document.documentElement.classList.remove(`theme-${value}`);
    });
    
    // Add current color theme class (except for blue which is default)
    if (colorTheme !== 'blue') {
      document.documentElement.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorTheme, 
      toggleTheme, 
      setColorTheme, 
      availableColorThemes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}