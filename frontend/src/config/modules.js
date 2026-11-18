const createModule = (id, name, shortName, description, iconName, badge, color) => ({
  id, name, shortName, description, iconName, badge, color
});

export const AVAILABLE_MODULES = [
  createModule("pos", "Punto de Venta & Caja", "Terminal POS", "Terminal de cobro ágil en mostrador, emisión de tickets y medios de pago", "ShoppingBag", "Esencial", "#10B981"),
  createModule("inventory", "Inventario & Stock en BD", "Inventario", "Control de catálogo con stock en Neon DB, precios y alertas de existencias", "Boxes", "Almacén", "#6366F1"),
  createModule("invoices", "Libro de Ventas & Comprobantes", "Comprobantes", "Historial de transacciones de control interno y exportación CSV", "FileText", "Auditoría", "#0EA5E9"),
  createModule("kpis", "Analítica & Desglose de Caja", "Métricas", "Estadísticas de facturación, medios de pago y rendimiento del negocio", "BarChart3", "Negocio", "#F59E0B"),
  createModule("console", "Consola Fiscal SOAP / WSDL", "Consola SOAP", "Inspección de contratos WSDL 1.1, pruebas de timbrado y consultas XML en tiempo real", "Terminal", "Fiscal", "#8B5CF6")
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
    modules: ["pos", "inventory", "invoices", "kpis", "console"],
    emoji: "💎"
  }
];

export const DEFAULT_ACTIVE_MODULES = ["pos", "inventory", "invoices", "kpis", "console"];
