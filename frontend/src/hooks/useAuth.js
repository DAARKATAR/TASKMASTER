
function normalizeUser(user) {
  if (!user) return null;
  const name = user.name || user.nombre || (user.email ? user.email.split("@")[0] : "Usuario");
  return {
    ...user,
    name,
    nombre: user.nombre || name,
    sucursal: user.sucursal || "Caja Principal",
    role: user.role || "Cajero POS"
  };
}
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Hook personalizado para manejar la autenticación, sesión y token JWT
 */
export function useAuth() {
  const [authToken, setAuthToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('taskmaster_token') : null));
  const [currentUser, setCurrentUser] = useState(null);
  const [authTenant, setAuthTenant] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskmaster_current_tenant');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Inicializar o restaurar sesión
  useEffect(() => {
    const restoreSession = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('taskmaster_token') : null;
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
          setCurrentUser(normalizeUser(data.user));
          setAuthToken(token);
          if (data.tenant) {
            setAuthTenant(data.tenant);
            if (typeof window !== 'undefined') {
              localStorage.setItem('taskmaster_current_tenant', JSON.stringify(data.tenant));
              localStorage.setItem('taskmaster_current_tenant_id', data.tenant.id);
            }
          }
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

  const login = (token, user, tenant = null) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskmaster_token', token);
      if (tenant) {
        localStorage.setItem('taskmaster_current_tenant', JSON.stringify(tenant));
        localStorage.setItem('taskmaster_current_tenant_id', tenant.id);
      }
    }
    setAuthToken(token);
    setCurrentUser(normalizeUser(user));
    if (tenant) setAuthTenant(tenant);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskmaster_token');
      localStorage.removeItem('taskmaster_current_tenant');
      localStorage.removeItem('taskmaster_current_tenant_id');
    }
    setAuthToken(null);
    setCurrentUser(null);
    setAuthTenant(null);
  };

  return {
    authToken,
    currentUser,
    setCurrentUser,
    authTenant,
    authLoading,
    login,
    logout,
    isAuthenticated: Boolean(authToken && currentUser)
  };
}

export default useAuth;
