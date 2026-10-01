import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Hook personalizado para manejar la autenticación, sesión y token JWT
 */
export function useAuth() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('taskmaster_token') || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Inicializar o restaurar sesión
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('taskmaster_token');
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setAuthToken(token);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error restaurando sesión:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (token, user) => {
    localStorage.setItem('taskmaster_token', token);
    setAuthToken(token);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('taskmaster_token');
    setAuthToken(null);
    setCurrentUser(null);
  };

  return {
    authToken,
    currentUser,
    setCurrentUser,
    authLoading,
    login,
    logout,
    isAuthenticated: Boolean(authToken && currentUser)
  };
}

export default useAuth;
