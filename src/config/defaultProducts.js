/**
 * Catálogos predefinidos por rubro comercial para sembrar la tabla aislada productos
 * cuando un nuevo tenant es aprovisionado en Neon PostgreSQL.
 */

export const DEFAULT_CATALOGS_BY_RUBRO = {
  'Repostería & Café': [
    { nombre: 'Capuchino de Especialidad Doble', precio: 9500, rubro: 'Cafetería & Repostería', emoji: '☕', stock: 120, descripcion: 'Espresso doble con leche emulsionada sedosa' },
    { nombre: 'Croissant Francés de Mantequilla', precio: 8500, rubro: 'Cafetería & Repostería', emoji: '🥐', stock: 60, descripcion: 'Hojaldre horneado con mantequilla europea' },
    { nombre: 'Torta Selva Negra Gourmet', precio: 45000, rubro: 'Cafetería & Repostería', emoji: '🎂', stock: 25, descripcion: 'Chocolate belga, cerezas maceradas y crema suave' },
    { nombre: 'Cheesecake de Frutos Rojos', precio: 38000, rubro: 'Cafetería & Repostería', emoji: '🍰', stock: 30, descripcion: 'Base crocante con coulis de fresas y moras silvestres' },
    { nombre: 'Caja Macarons Surtidos (6u)', precio: 24000, rubro: 'Cafetería & Repostería', emoji: '🍡', stock: 45, descripcion: 'Almendra francesa rellenos de pistacho, frambuesa y chocolate' },
    { nombre: 'Americano Filtrado Origen Geisha', precio: 8000, rubro: 'Cafetería & Repostería', emoji: '☕', stock: 150, descripcion: 'Café de especialidad con notas florales y jazmín' }
  ],
  'Restaurante & Fast Food': [
    { nombre: 'Hamburguesa Angus Doble Queso', precio: 32000, rubro: 'Restaurante & Fast Food', emoji: '🍔', stock: 80, descripcion: '200g carne angus, queso cheddar madurado y tocineta crocante' },
    { nombre: 'Pizza Familiar Pepperoni Crispy', precio: 42000, rubro: 'Restaurante & Fast Food', emoji: '🍕', stock: 50, descripcion: 'Masa madre fermentada 48h con salsa pomodoro y mozzarella' },
    { nombre: 'Combo Tacos al Pastor (3u)', precio: 26000, rubro: 'Restaurante & Fast Food', emoji: '🌮', stock: 70, descripcion: 'Carne de cerdo marinada con piña asada, cebolla y cilantro' },
    { nombre: 'Papas Rústicas Trufadas', precio: 14000, rubro: 'Restaurante & Fast Food', emoji: '🍟', stock: 100, descripcion: 'Papas corte grueso con aceite de trufa y queso parmesano' },
    { nombre: 'Bowl Ensalada César con Pollo', precio: 22000, rubro: 'Restaurante & Fast Food', emoji: '🥗', stock: 40, descripcion: 'Lechuga romana fresca, pechuga a la plancha y crutones' },
    { nombre: 'Bebida Gaseosa Artesanal 500ml', precio: 7500, rubro: 'Restaurante & Fast Food', emoji: '🥤', stock: 120, descripcion: 'Refresco natural con infusión botánica' }
  ],
  'Boutique & Retail': [
    { nombre: 'Camiseta Algodón Pima Básica', precio: 55000, rubro: 'Boutique & Retail', emoji: '👕', stock: 65, descripcion: '100% algodón de fibra larga, tacto ultra suave' },
    { nombre: 'Jeans Slim Fit Denim Premium', precio: 120000, rubro: 'Boutique & Retail', emoji: '👖', stock: 40, descripcion: 'Denim elásticado con lavado índigo oscuro clásico' },
    { nombre: 'Zapatillas Urbanas Streetwear', precio: 180000, rubro: 'Boutique & Retail', emoji: '👟', stock: 30, descripcion: 'Suela ergonómica amortiguada con capellada en cuero ecológico' },
    { nombre: 'Gorra Clásica Ajustable', precio: 45000, rubro: 'Boutique & Retail', emoji: '🧢', stock: 55, descripcion: 'Algodón drill con visera curva y hebilla metálica' },
    { nombre: 'Bolso Tote Bag Canvas Eco', precio: 35000, rubro: 'Boutique & Retail', emoji: '🛍️', stock: 50, descripcion: 'Lona resistente con asas reforzadas y bolsillo interno' }
  ],
  'Farmacia & Salud': [
    { nombre: 'Protector Solar Facial SPF 50+', precio: 65000, rubro: 'Farmacia & Salud', emoji: '🧴', stock: 90, descripcion: 'Toque seco, amplio espectro UVA/UVB ultraligero' },
    { nombre: 'Complejo Multivitamínico Diario', precio: 48000, rubro: 'Farmacia & Salud', emoji: '💊', stock: 75, descripcion: 'Frasco de 60 cápsulas con zinc, vitamina C, D3 y magnesio' },
    { nombre: 'Kit de Primeros Auxilios Portátil', precio: 34000, rubro: 'Farmacia & Salud', emoji: '🩹', stock: 60, descripcion: 'Gasa esterilizada, vendas, micropore y antiséptico' },
    { nombre: 'Termómetro Digital Clínico', precio: 22000, rubro: 'Farmacia & Salud', emoji: '🌡️', stock: 45, descripcion: 'Lectura ultra rápida en 10 segundos con alarma sonora' },
    { nombre: 'Crema Hidratante Reparadora', precio: 39000, rubro: 'Farmacia & Salud', emoji: '✨', stock: 80, descripcion: 'Con ceramidas y ácido hialurónico para piel sensible' }
  ],
  'Minimarket & Abarrotes': [
    { nombre: 'Pack Aguas Minerales (6u)', precio: 18000, rubro: 'Minimarket & Abarrotes', emoji: '💧', stock: 100, descripcion: 'Agua de manantial natural sin gas 600ml cada una' },
    { nombre: 'Café de Origen en Grano (500g)', precio: 32000, rubro: 'Minimarket & Abarrotes', emoji: '🫘', stock: 50, descripcion: 'Variedad arábica tueste medio, notas a caramelo' },
    { nombre: 'Aceite de Oliva Extra Virgen 500ml', precio: 42000, rubro: 'Minimarket & Abarrotes', emoji: '🫒', stock: 60, descripcion: 'Prensado en frío de primera extracción, acidez 0.2%' },
    { nombre: 'Mix Frutos Secos Seleccionados', precio: 16500, rubro: 'Minimarket & Abarrotes', emoji: '🥜', stock: 85, descripcion: 'Almendras, nueces, arándanos y marañones horneados' },
    { nombre: 'Chocolate Amargo Orgánico 70%', precio: 12000, rubro: 'Minimarket & Abarrotes', emoji: '🍫', stock: 110, descripcion: 'Cacao fino de aroma certificado libre de gluten' }
  ]
};

/**
 * Retorna los productos de catálogo según el rubro o el catálogo general si no coincide
 */
export function getDefaultProducts(businessType = '') {
  const match = Object.keys(DEFAULT_CATALOGS_BY_RUBRO).find(k => 
    businessType.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(businessType.toLowerCase())
  );

  if (match) {
    return DEFAULT_CATALOGS_BY_RUBRO[match];
  }

  // Por defecto, retornar el catálogo de Repostería & Café
  return DEFAULT_CATALOGS_BY_RUBRO['Repostería & Café'];
}

export default {
  DEFAULT_CATALOGS_BY_RUBRO,
  getDefaultProducts
};
