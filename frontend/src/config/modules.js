export const AVAILABLE_MODULES = [
  {
    id: 'pos',
    name: 'Punto de Venta (POS)',
    shortName: 'Terminal POS',
    description: 'Terminal de cobro ágil en mostrador, tickets y medios de pago',
    iconName: 'ShoppingBag',
    badge: 'Esencial',
    color: '#10B981'
  },
  {
    id: 'inventory',
    name: 'Inventario & Catálogo',
    shortName: 'Inventario',
    description: 'Control de existencias, precios, categorías y alertas de stock bajo',
    iconName: 'Boxes',
    badge: 'Gestión',
    color: '#6366F1'
  },
  {
    id: 'invoices',
    name: 'Libro de Ventas & Comprobantes',
    shortName: 'Comprobantes',
    description: 'Historial auditado de transacciones y exportación CSV para Excel',
    iconName: 'FileText',
    badge: 'Auditoría',
    color: '#0EA5E9'
  },
  {
    id: 'kpis',
    name: 'Analítica & KPIs',
    shortName: 'Métricas',
    description: 'Estadísticas de facturación, ticket promedio y tendencias de ventas',
    iconName: 'BarChart3',
    badge: 'Negocio',
    color: '#F59E0B'
  },
  {
    id: 'soap',
    name: 'Enlace Fiscal / SOAP 1.1',
    shortName: 'SOAP / Fiscal',
    description: 'Consola técnica de timbrado, validación XML y diagnóstico de pasarela',
    iconName: 'Terminal',
    badge: 'Técnico',
    color: '#8B5CF6'
  }
];

export const PRESET_MODULAR_PROFILES = [
  {
    id: 'fast-pos',
    name: 'Mostrador Rápido (Panadería / Café)',
    description: 'Solo caja rápida y comprobantes. Cero distracciones.',
    modules: ['pos', 'invoices'],
    emoji: '☕'
  },
  {
    id: 'retail',
    name: 'Comercio & Retail Completo',
    description: 'Punto de venta, inventario en tiempo real y libro contable.',
    modules: ['pos', 'inventory', 'invoices', 'kpis'],
    emoji: '🛍️'
  },
  {
    id: 'inventory-only',
    name: 'Solo Inventario & Almacén',
    description: 'Control de catálogo, entradas y existencias.',
    modules: ['inventory', 'invoices'],
    emoji: '📦'
  },
  {
    id: 'all',
    name: 'Modo Completo / Avanzado',
    description: 'Todas las herramientas activas incluyendo enlace SOAP.',
    modules: ['pos', 'inventory', 'invoices', 'kpis', 'soap'],
    emoji: '⚡'
  }
];

export const DEFAULT_ACTIVE_MODULES = ['pos', 'inventory', 'invoices', 'kpis'];
