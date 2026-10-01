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
              setCurrentTenant(list[0]);
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
      if (found) setCurrentTenant(found);
    } else {
      setCurrentTenant(tenantOrId);
    }
  };

  // Módulos activos para el tenant actual
  const activeModules = useMemo(() => {
    if (currentTenant?.active_modules && Array.isArray(currentTenant.active_modules)) {
      return currentTenant.active_modules;
    }
    return DEFAULT_ACTIVE_MODULES;
  }, [currentTenant?.active_modules]);

  // Guardar cambios en los módulos activos (en Neon DB y en el estado local)
  const updateActiveModules = async (newModules) => {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${currentTenant.id}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_modules: newModules })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar módulos');
      }

      // Actualizar estado local reactivo
      setCurrentTenant((prev) => (prev ? { ...prev, active_modules: newModules } : prev));
      setAvailableTenants((prev) =>
        prev.map((t) => (t.id === currentTenant.id ? { ...t, active_modules: newModules } : t))
      );
      return true;
    } catch (err) {
      console.error('Error guardando módulos activos:', err);
      throw err;
    }
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
