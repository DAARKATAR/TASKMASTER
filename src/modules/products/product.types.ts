export interface Product {
  id: number;
  nombre: string;
  precio: number;
  rubro: string;
  emoji: string;
  descripcion?: string;
  stock: number;
  created_at?: string;
}

export interface CreateProductDTO {
  nombre: string;
  precio: number;
  rubro?: string;
  emoji?: string;
  stock?: number;
  descripcion?: string;
}
