import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Hook para la gestión del inquilino (tenant) activo y lista de comercios
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
        const list = await res.json();
        setAvailableTenants(list);
        if (list.length > 0 && !currentTenant) {
          setCurrentTenant(list[0]);
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

  return {
    currentTenant,
    setCurrentTenant,
    availableTenants,
    loadingTenants,
    loadTenants,
    selectTenant
  };
}

export default useTenant;
