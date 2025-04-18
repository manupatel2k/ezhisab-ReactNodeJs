
import React, { createContext, useState, useContext, useEffect } from 'react';

export type ThemeType = 'light' | 'dark' | 'blue' | 'purple' | 'green' | 'amber' | 'teal' | 'rose';

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  // Load theme from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme') as ThemeType;
    if (savedTheme && ['light', 'dark', 'blue', 'purple', 'green', 'amber', 'teal', 'rose'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // If no saved theme but system prefers dark mode
      setTheme('dark');
    }
  }, []);

  // Update localStorage and apply theme class when theme changes
  useEffect(() => {
    localStorage.setItem('color-theme', theme);
    
    // Remove all theme classes
    document.documentElement.classList.remove(
      'theme-light', 'theme-dark', 'theme-blue', 'theme-purple', 
      'theme-green', 'theme-amber', 'theme-teal', 'theme-rose'
    );
    
    // Add the current theme class
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Add data attribute for tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
