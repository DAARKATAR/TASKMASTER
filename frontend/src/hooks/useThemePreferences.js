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
  const [buttonRadius, setButtonRadius] = useState(
    () => localStorage.getItem("taskmaster_btn_radius") || "rounded-2xl"
  );
  const [displayDensity, setDisplayDensity] = useState(
    () => localStorage.getItem("taskmaster_density") || "comfortable"
  );

  const selectButtonRadius = (rad) => {
    setButtonRadius(rad);
    localStorage.setItem("taskmaster_btn_radius", rad);
  };

  const selectDisplayDensity = (den) => {
    setDisplayDensity(den);
    localStorage.setItem("taskmaster_density", den);
  };

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
    themeColors: THEME_COLORS,
    buttonRadius,
    selectButtonRadius,
    displayDensity,
    selectDisplayDensity
  };
}

export default useThemePreferences;
