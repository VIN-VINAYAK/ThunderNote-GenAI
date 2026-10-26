import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();
const THEMES = new Set(['light', 'dark']);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return THEMES.has(savedTheme) ? savedTheme : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const changeTheme = (nextTheme) => {
    if (THEMES.has(nextTheme)) setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}