import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import { DEFAULT_ACTIVE_MODULES } from '../config/modules';

/**
 * Hook para la gestión del inquilino (tenant) activo, módulos a la carta y lista de comercios
 */
export function useTenant(initialTenant = null) {
  const [currentTenant, setCurrentTenantState] = useState(() => {
    if (initialTenant) return initialTenant;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskmaster_current_tenant');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  });

  const [availableTenants, setAvailableTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Wrapper para asegurar que cada actualización de currentTenant se persista en localStorage
  const setCurrentTenant = useCallback((tenantOrUpdater) => {
    setCurrentTenantState((prev) => {
      const nextTenant = typeof tenantOrUpdater === 'function' ? tenantOrUpdater(prev) : tenantOrUpdater;
      if (typeof window !== 'undefined') {
        if (nextTenant && nextTenant.id) {
          localStorage.setItem('taskmaster_current_tenant', JSON.stringify(nextTenant));
          localStorage.setItem('taskmaster_current_tenant_id', nextTenant.id);
        } else if (nextTenant === null) {
          localStorage.removeItem('taskmaster_current_tenant');
          localStorage.removeItem('taskmaster_current_tenant_id');
        }
      }
      return nextTenant;
    });
  }, []);

  const loadTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setAvailableTenants(list);
            if (list.length > 0) {
              setCurrentTenantState((prev) => {
                // 1. Prioridad: Conservar el tenant actualmente activo o guardado en sesión
                const targetId = prev?.id || (typeof window !== 'undefined' ? localStorage.getItem('taskmaster_current_tenant_id') : null);
                if (targetId) {
                  const found = list.find((t) => t.id === targetId);
                  if (found) {
                    const localMods = localStorage.getItem(`taskmaster_modules_${found.id}`);
                    if (localMods) {
                      try {
                        found.active_modules = JSON.parse(localMods);
                      } catch {}
                    }
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('taskmaster_current_tenant', JSON.stringify(found));
                      localStorage.setItem('taskmaster_current_tenant_id', found.id);
                    }
                    return found;
                  }
                }

                // 2. Si ya hay un tenant en memoria, no sobreescribir
                if (prev) return prev;

                // 3. Fallback: solo si no hay ningún tenant previo
                const first = list[0];
                const localMods = localStorage.getItem(`taskmaster_modules_${first.id}`);
                if (localMods) {
                  try {
                    first.active_modules = JSON.parse(localMods);
                  } catch {}
                }
                if (typeof window !== 'undefined') {
                  localStorage.setItem('taskmaster_current_tenant', JSON.stringify(first));
                  localStorage.setItem('taskmaster_current_tenant_id', first.id);
                }
                return first;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error cargando lista de tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const selectTenant = useCallback((tenantOrId) => {
    if (tenantOrId === null) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taskmaster_current_tenant');
        localStorage.removeItem('taskmaster_current_tenant_id');
      }
      setCurrentTenantState(null);
      return;
    }

    if (typeof tenantOrId === 'string') {
      const found = availableTenants.find((t) => t.id === tenantOrId);
      if (found) {
        const localMods = localStorage.getItem(`taskmaster_modules_${found.id}`);
        if (localMods) {
          try {
            found.active_modules = JSON.parse(localMods);
          } catch {}
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('taskmaster_current_tenant', JSON.stringify(found));
          localStorage.setItem('taskmaster_current_tenant_id', found.id);
        }
        setCurrentTenantState(found);
      }
    } else if (tenantOrId?.id) {
      const localMods = localStorage.getItem(`taskmaster_modules_${tenantOrId.id}`);
      if (localMods) {
        try {
          tenantOrId.active_modules = JSON.parse(localMods);
        } catch {}
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('taskmaster_current_tenant', JSON.stringify(tenantOrId));
        localStorage.setItem('taskmaster_current_tenant_id', tenantOrId.id);
      }
      setCurrentTenantState(tenantOrId);
    }
  }, [availableTenants]);

  // Módulos activos para el tenant actual
  const activeModules = useMemo(() => {
    if (currentTenant?.id) {
      const localMods = localStorage.getItem(`taskmaster_modules_${currentTenant.id}`);
      if (localMods) {
        try {
          const parsed = JSON.parse(localMods);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    if (currentTenant?.active_modules && Array.isArray(currentTenant.active_modules)) {
      return currentTenant.active_modules;
    }
    return DEFAULT_ACTIVE_MODULES;
  }, [currentTenant?.active_modules, currentTenant?.id]);

  // Guardar cambios en los módulos activos (en Neon DB y optimista en local)
  const updateActiveModules = async (newModules) => {
    if (!currentTenant?.id) return;

    // 1. Persistencia optimista inmediata en local
    localStorage.setItem(`taskmaster_modules_${currentTenant.id}`, JSON.stringify(newModules));
    setCurrentTenant((prev) => (prev ? { ...prev, active_modules: newModules } : prev));
    setAvailableTenants((prev) =>
      prev.map((t) => (t.id === currentTenant.id ? { ...t, active_modules: newModules } : t))
    );

    // 2. Persistencia en base de datos remota
    const token = localStorage.getItem('taskmaster_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE_URL}/api/tenants/${currentTenant.id}/modules`;
    const payload = JSON.stringify({ active_modules: newModules });

    let responseOk = false;
    let errorDetail = '';

    // Intentar primero con PATCH, luego con PUT como fallback
    for (const method of ['PATCH', 'PUT', 'POST']) {
      try {
        const res = await fetch(url, { method, headers, body: payload });
        if (res.ok) {
          responseOk = true;
          break;
        } else {
          try {
            const data = await res.json();
            errorDetail = data.error || `HTTP ${res.status}`;
          } catch {
            errorDetail = `HTTP ${res.status}`;
          }
        }
      } catch (networkErr) {
        errorDetail = networkErr.message || 'Error de red';
      }
    }

    if (!responseOk && errorDetail && !errorDetail.includes('Failed to fetch')) {
      console.warn('Servidor no pudo guardar módulos, mantenidos localmente:', errorDetail);
    }

    return true;
  };

  // Guardar cambios en el tema y paleta de colores del tenant en Neon DB
  const updateTenantTheme = async ({ brand_color, theme_palette }) => {
    if (!currentTenant?.id) return;

    const nextTenant = {
      ...currentTenant,
      brand_color: brand_color || currentTenant.brand_color,
      theme_palette: theme_palette || currentTenant.theme_palette
    };

    // 1. Optimistic local update
    setCurrentTenant(nextTenant);
    setAvailableTenants((prev) =>
      prev.map((t) => (t.id === currentTenant.id ? nextTenant : t))
    );

    // 2. Persistencia en Neon DB
    const token = typeof window !== 'undefined' ? localStorage.getItem('taskmaster_token') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE_URL}/api/tenants/${currentTenant.id}/theme`;
    const payload = JSON.stringify({ brand_color, theme_palette });

    try {
      const res = await fetch(url, { method: 'PATCH', headers, body: payload });
      if (!res.ok) {
        await fetch(url, { method: 'PUT', headers, body: payload });
      }
    } catch (err) {
      console.warn('No se pudo guardar el tema en Neon, se mantiene local:', err);
    }

    return true;
  };

  return {
    currentTenant,
    setCurrentTenant,
    availableTenants,
    loadingTenants,
    loadTenants,
    selectTenant,
    activeModules,
    updateActiveModules,
    updateTenantTheme
  };
}

export default useTenant;
