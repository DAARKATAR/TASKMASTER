export interface InvoiceItem {
  id?: number;
  qty?: number;
  cantidad?: number;
  price?: number;
  precio?: number;
  name?: string;
  nombre?: string;
}

export interface CreateInvoiceDTO {
  cliente?: string;
  subtotal?: number;
  impuestos?: number;
  total?: number;
  items_count?: number;
  metodo_pago?: string;
  items?: InvoiceItem[];
}
