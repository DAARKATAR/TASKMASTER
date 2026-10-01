import { useState, useEffect } from 'react';

export const THEME_COLORS = {
  white: '#FFFFFF',
  cream: '#FDFBF7',
  pink: '#FFF5F7',
  lavender: '#F8F7FF',
  mint: '#F0FDF4',
  slate: '#F8FAFC'
};

/**
 * Hook para la gestión de temas, estilos planos y posición de la Navbar
 */
export function useThemePreferences(currentTenant, currentView) {
  const [navbarPosition, setNavbarPosition] = useState(
    () => localStorage.getItem('taskmaster_nav_pos') || 'top'
  );
  const [bgTheme, setBgTheme] = useState(
    () => localStorage.getItem('taskmaster_bg_theme') || 'white'
  );
  const [showCustomizer, setShowCustomizer] = useState(false);

  const selectNavbarPosition = (pos) => {
    setNavbarPosition(pos);
    localStorage.setItem('taskmaster_nav_pos', pos);
  };

  const selectBgTheme = (theme) => {
    setBgTheme(theme);
    localStorage.setItem('taskmaster_bg_theme', theme);
  };

  useEffect(() => {
    if (currentView === 'pos') {
      document.documentElement.style.setProperty(
        '--brand-primary',
        currentTenant?.brand_color || '#4F46E5'
      );
      document.body.style.backgroundColor = THEME_COLORS[bgTheme] || '#FFFFFF';
    } else {
      document.documentElement.style.setProperty('--brand-primary', '#0F172A');
      document.body.style.backgroundColor = '#FFFFFF';
    }
  }, [bgTheme, currentTenant, currentView]);

  return {
    navbarPosition,
    selectNavbarPosition,
    bgTheme,
    selectBgTheme,
    showCustomizer,
    setShowCustomizer,
    themeColors: THEME_COLORS
  };
}

export default useThemePreferences;
