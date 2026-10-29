import { describe, it, expect } from 'vitest';
import { generateWsdl } from '../../src/services/wsdlGenerator.js';

describe('Unidad: Generador Dinámico de Contratos SOAP WSDL 1.1', () => {
  const mockTenant = {
    id: 'tortasnacks',
    nombre: 'Tortas & Snacks Gourmet',
    schema_name: 'tenant_tortasnacks',
    brand_color: '#F97316'
  };
  const mockHost = 'api.taskmaster-pos.com';

  it('7. generateWsdl debe producir un XML válido con raíz definitions y namespace WSDL', () => {
    const wsdl = generateWsdl(mockTenant, mockHost);

    expect(wsdl).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(wsdl).toContain('<definitions');
    expect(wsdl).toContain('xmlns="http://schemas.xmlsoap.org/wsdl/"');
    expect(wsdl).toContain('xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"');
  });

  it('8. generateWsdl debe aislar namespaces usando el ID único del tenant', () => {
    const wsdl = generateWsdl(mockTenant, mockHost);
    const expectedTargetNs = `https://${mockTenant.id}.pos-billing.com/wsdl`;
    const expectedSchemaNs = `https://${mockTenant.id}.pos-billing.com/schema`;

    expect(wsdl).toContain(`targetNamespace="${expectedTargetNs}"`);
    expect(wsdl).toContain(`xmlns:tns="${expectedTargetNs}"`);
    expect(wsdl).toContain(`xmlns:schema="${expectedSchemaNs}"`);
    expect(wsdl).toContain(mockTenant.nombre);
  });

  it('9. generateWsdl debe definir los tipos de datos fiscales (subtotal, impuestos, total, folio)', () => {
    const wsdl = generateWsdl(mockTenant, mockHost);

    expect(wsdl).toContain('<xsd:element name="ConsultarFacturaRequest">');
    expect(wsdl).toContain('<xsd:element name="numero_factura" type="xsd:string"/>');
    expect(wsdl).toContain('<xsd:element name="ConsultarFacturaResponse">');
    expect(wsdl).toContain('<xsd:element name="subtotal" type="xsd:float"/>');
    expect(wsdl).toContain('<xsd:element name="impuestos" type="xsd:float"/>');
    expect(wsdl).toContain('<xsd:element name="total" type="xsd:float"/>');
    expect(wsdl).toContain('<xsd:element name="folio_fiscal" type="xsd:string"/>');
    expect(wsdl).toContain('<xsd:element name="estado" type="xsd:string"/>');
  });

  it('10. generateWsdl debe configurar binding document/literal y endpoint location HTTP exacto', () => {
    const wsdl = generateWsdl(mockTenant, mockHost);
    const expectedLocation = `http://${mockHost}/ws/${mockTenant.id}`;

    expect(wsdl).toContain('style="document"');
    expect(wsdl).toContain('use="literal"');
    expect(wsdl).toContain(`<soap:address location="${expectedLocation}"/>`);
  });
});
