import { describe, it, expect } from 'vitest';
import { getDefaultProducts, DEFAULT_CATALOGS_BY_RUBRO } from '../../src/config/defaultProducts.js';

describe('Unidad: Catálogos de Inicialización Comercial (defaultProducts)', () => {
  it('20. getDefaultProducts debe retornar catálogo correspondiente según coincidencia de rubro', () => {
    const pharma = getDefaultProducts('Farmacia');
    expect(pharma.length).toBeGreaterThan(0);
    expect(pharma.some((p: any) => p.nombre.toLowerCase().includes('solar') || p.nombre.toLowerCase().includes('kit'))).toBe(true);

    const fastFood = getDefaultProducts('Restaurante & Fast Food');
    expect(fastFood.length).toBeGreaterThan(0);
    expect(fastFood.some((p: any) => p.nombre.toLowerCase().includes('hamburguesa') || p.nombre.toLowerCase().includes('pizza'))).toBe(true);

    const retail = getDefaultProducts('Boutique');
    expect(retail.some((p: any) => p.nombre.toLowerCase().includes('camiseta') || p.nombre.toLowerCase().includes('jeans'))).toBe(true);
  });

  it('21. getDefaultProducts debe proveer fallback seguro ante rubro desconocido o vacío', () => {
    const fallbackEmpty = getDefaultProducts('');
    const fallbackUnknown = getDefaultProducts('Cerrajería Aeroespacial Cuántica');

    expect(fallbackEmpty).toEqual(DEFAULT_CATALOGS_BY_RUBRO['Repostería & Café']);
    expect(fallbackUnknown).toEqual(DEFAULT_CATALOGS_BY_RUBRO['Repostería & Café']);
  });

  it('22. Todos los productos predefinidos deben tener atributos fiscales y de inventario válidos', () => {
    const allRubros = Object.values(DEFAULT_CATALOGS_BY_RUBRO);

    for (const catalog of allRubros) {
      expect(catalog.length).toBeGreaterThanOrEqual(4);
      for (const prod of catalog) {
        expect(typeof prod.nombre).toBe('string');
        expect(prod.nombre.trim().length).toBeGreaterThan(2);

        expect(typeof prod.precio).toBe('number');
        expect(prod.precio).toBeGreaterThan(0);

        expect(typeof prod.stock).toBe('number');
        expect(prod.stock).toBeGreaterThanOrEqual(10);

        expect(typeof prod.emoji).toBe('string');
        expect(prod.emoji.length).toBeGreaterThan(0);

        expect(typeof prod.rubro).toBe('string');
      }
    }
  });
});
