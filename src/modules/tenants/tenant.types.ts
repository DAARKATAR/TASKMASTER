export interface Tenant {
  id: string;
  nombre: string;
  name?: string;
  schema_name: string;
  brand_color: string;
}

export interface ProvisionTenantDTO {
  id: string;
  nombre: string;
  brandColor?: string;
  businessType?: string;
  initialTitular?: string;
  initialSaldo?: number;
  logo?: string;
}

export interface TenantMetrics {
  total_ventas: number;
  total_comprobantes: number;
  ticket_promedio: number;
  total_iva: number;
  desglose_pagos: Array<{ metodo: string; transacciones: number; total: number }>;
  ventas_por_dia: Array<{ dia: string; label: string; transacciones: number; total: number }>;
}
