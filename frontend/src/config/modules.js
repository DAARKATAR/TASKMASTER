export const AVAILABLE_MODULES = [
  {
    id: "pos",
    name: "Punto de Venta & Caja",
    shortName: "Terminal POS",
    description: "Terminal de cobro ágil en mostrador, emisión de tickets y medios de pago",
    iconName: "ShoppingBag",
    badge: "Esencial",
    color: "#10B981"
  },
  {
    id: "inventory",
    name: "Inventario & Stock en BD",
    shortName: "Inventario",
    description: "Control de catálogo con stock en Neon DB, precios y alertas de existencias",
    iconName: "Boxes",
    badge: "Almacén",
    color: "#6366F1"
  },
  {
    id: "invoices",
    name: "Libro de Ventas & Comprobantes",
    shortName: "Comprobantes",
    description: "Historial de transacciones de control interno y exportación CSV",
    iconName: "FileText",
    badge: "Auditoría",
    color: "#0EA5E9"
  },
  {
    id: "kpis",
    name: "Analítica & Desglose de Caja",
    shortName: "Métricas",
    description: "Estadísticas de facturación, medios de pago y rendimiento del negocio",
    iconName: "BarChart3",
    badge: "Negocio",
    color: "#F59E0B"
  }
];

export const PRESET_MODULAR_PROFILES = [
  {
    id: "fast-pos",
    name: "Mostrador Ultraligero (Sin Inventario BD)",
    description: "Solo caja rápida y comprobantes. Crea artículos libres al instante en memoria sin control de stock.",
    modules: ["pos", "invoices"],
    emoji: "⚡"
  },
  {
    id: "retail",
    name: "Comercio & Retail Completo",
    description: "Punto de venta, inventario con existencias en base de datos, comprobantes y analítica.",
    modules: ["pos", "inventory", "invoices", "kpis"],
    emoji: "🛍️"
  },
  {
    id: "simple-billing",
    name: "Solo Registro & Comprobantes",
    description: "Auditoría de recibos y emisión directa sin catálogo de artículos.",
    modules: ["invoices"],
    emoji: "📋"
  },
  {
    id: "all",
    name: "Suite Completa de Control Interno",
    description: "Todas las herramientas comerciales activas para máxima gestión.",
    modules: ["pos", "inventory", "invoices", "kpis"],
    emoji: "💎"
  }
];

export const DEFAULT_ACTIVE_MODULES = ["pos", "inventory", "invoices", "kpis"];
