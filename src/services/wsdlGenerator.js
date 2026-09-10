/**
 * Genera dinámicamente un documento WSDL 1.1 adaptado para servicios POS y Facturación Electrónica de Marca Blanca.
 *
 * @param {object} tenant - Objeto con los metadatos del inquilino POS (id, nombre, brand_color, schema_name)
 * @param {string} host - Host HTTP del servidor
 * @returns {string} Definición WSDL 1.1 en formato XML
 */
export function generateWsdl(tenant, host) {
  const tenantId = tenant.id;
  const tenantName = tenant.nombre || tenant.name || tenantId;
  const targetNamespace = `https://${tenantId}.pos-billing.com/wsdl`;
  const schemaNamespace = `https://${tenantId}.pos-billing.com/schema`;
  const endpointLocation = `http://${host}/ws/${tenantId}`;

  const cleanServiceName = tenantName.replace(/[^a-zA-Z0-9_]/g, '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="${cleanServiceName}Service"
  targetNamespace="${targetNamespace}"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:tns="${targetNamespace}"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:schema="${schemaNamespace}">

  <documentation>Servicio SOAP White-Label de Facturación Electrónica y POS para ${tenantName} (Tenant ID: ${tenantId})</documentation>

  <types>
    <xsd:schema targetNamespace="${schemaNamespace}" elementFormDefault="qualified">
      <xsd:element name="ConsultarFacturaRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="numero_factura" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="ConsultarFacturaResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="numero_factura" type="xsd:string"/>
            <xsd:element name="cliente" type="xsd:string"/>
            <xsd:element name="subtotal" type="xsd:float"/>
            <xsd:element name="impuestos" type="xsd:float"/>
            <xsd:element name="total" type="xsd:float"/>
            <xsd:element name="estado" type="xsd:string"/>
            <xsd:element name="folio_fiscal" type="xsd:string"/>
            <xsd:element name="items_count" type="xsd:int"/>
            <xsd:element name="emisor" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="ConsultarFacturaInput">
    <part name="parameters" element="schema:ConsultarFacturaRequest"/>
  </message>

  <message name="ConsultarFacturaOutput">
    <part name="parameters" element="schema:ConsultarFacturaResponse"/>
  </message>

  <portType name="${cleanServiceName}PortType">
    <operation name="ConsultarFactura">
      <documentation>Consulta el comprobante fiscal y estado de timbrado POS en el esquema aislado de ${tenantName}.</documentation>
      <input message="tns:ConsultarFacturaInput"/>
      <output message="tns:ConsultarFacturaOutput"/>
    </operation>
  </portType>

  <binding name="${cleanServiceName}Binding" type="tns:${cleanServiceName}PortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="ConsultarFactura">
      <soap:operation soapAction="${targetNamespace}/ConsultarFactura"/>
      <input>
        <soap:body use="literal"/>
      </input>
      <output>
        <soap:body use="literal"/>
      </output>
    </operation>
  </binding>

  <service name="${cleanServiceName}Service">
    <documentation>Servicio SOAP POS & Facturación de ${tenantName}</documentation>
    <port name="${cleanServiceName}Port" binding="tns:${cleanServiceName}Binding">
      <soap:address location="${endpointLocation}"/>
    </port>
  </service>
</definitions>`.trim();
}

export default {
  generateWsdl
};
