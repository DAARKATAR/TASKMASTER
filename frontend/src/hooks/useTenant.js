import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import { DEFAULT_ACTIVE_MODULES } from '../config/modules';

/**
 * Hook para la gestión del inquilino (tenant) activo, módulos a la carta y lista de comercios
 */
export function useTenant(initialTenant = null) {
  const [currentTenant, setCurrentTenant] = useState(initialTenant);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

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
            if (list.length > 0 && !currentTenant) {
              const first = list[0];
              // Revisar si hay módulos en caché local
              const localMods = localStorage.getItem(`taskmaster_modules_${first.id}`);
              if (localMods) {
                try {
                  first.active_modules = JSON.parse(localMods);
                } catch {}
              }
              setCurrentTenant(first);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error cargando lista de tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    loadTenants();
  }, []);

  const selectTenant = (tenantOrId) => {
    if (typeof tenantOrId === 'string') {
      const found = availableTenants.find((t) => t.id === tenantOrId);
      if (found) {
        const localMods = localStorage.getItem(`taskmaster_modules_${found.id}`);
        if (localMods) {
          try {
            found.active_modules = JSON.parse(localMods);
          } catch {}
        }
        setCurrentTenant(found);
      }
    } else {
      if (tenantOrId?.id) {
        const localMods = localStorage.getItem(`taskmaster_modules_${tenantOrId.id}`);
        if (localMods) {
          try {
            tenantOrId.active_modules = JSON.parse(localMods);
          } catch {}
        }
      }
      setCurrentTenant(tenantOrId);
    }
  };

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

  return {
    currentTenant,
    setCurrentTenant,
    availableTenants,
    loadingTenants,
    loadTenants,
    selectTenant,
    activeModules,
    updateActiveModules
  };
}

export default useTenant;
