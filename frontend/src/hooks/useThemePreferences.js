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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskmaster_dark_mode');
      if (saved !== null) return saved === 'true';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('taskmaster_dark_mode', String(next));
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  useEffect(() => {
    const tenantBg = currentTenant?.theme_palette?.background;
    if (currentView === 'pos') {
      document.documentElement.style.setProperty(
        '--brand-primary',
        currentTenant?.brand_color || '#4F46E5'
      );
      if (isDarkMode) {
        document.body.style.backgroundColor = tenantBg || '#0F172A';
      } else {
        document.body.style.backgroundColor = tenantBg || THEME_COLORS[bgTheme] || '#FFFFFF';
      }
    } else {
      document.documentElement.style.setProperty('--brand-primary', '#0F172A');
      document.body.style.backgroundColor = isDarkMode ? '#0F172A' : (tenantBg || '#FFFFFF');
    }
  }, [bgTheme, currentTenant?.theme_palette?.background, currentTenant?.brand_color, currentView, isDarkMode]);

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
    selectDisplayDensity,
    isDarkMode,
    toggleDarkMode
  };
}

export default useThemePreferences;
