import validator from 'validator';
import { generateWsdl } from '../services/wsdlGenerator.js';
import { withTenantContext } from '../services/tenantDbClient.js';
import { logAudit } from '../services/auditLogger.js';
import { escapeXml } from '../utils/xmlSecurity.js';

/**
 * Construye un SOAP Fault XML con saneamiento estricto contra XSS e inyecciones.
 */
function buildFaultXml(faultCode, faultString, detail) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${escapeXml(faultCode)}</faultcode>
      <faultstring>${escapeXml(faultString)}</faultstring>
      <detail>
        <message>${escapeXml(detail)}</message>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`.trim();
}

/**
 * Entrega el contrato WSDL 1.1 dinámico con branding del tenant POS.
 */
export function handleWsdl(req, res) {
  const startTime = Date.now();
  const tenant = req.tenant;
  const clientIp = req.headers['cf-connecting-ip'] || req.ip;

  try {
    const rawHost = req.get('host') || `localhost:${process.env.PORT || 3000}`;
    const host = validator.escape(String(rawHost).replace(/[^a-zA-Z0-9.:_-]/g, ''));
    const wsdlXml = generateWsdl(tenant, host);

    logAudit({
      tenantId: tenant?.id || 'unknown',
      action: 'GET_WSDL_1.1',
      durationMs: Date.now() - startTime,
      statusCode: 200,
      clientIp
    });

    res.status(200)
      .type('text/xml; charset=utf-8')
      .send(wsdlXml);
  } catch (error) {
    console.error('Error generating WSDL:', error);

    logAudit({
      tenantId: tenant?.id || 'unknown',
      action: 'GET_WSDL_ERROR',
      durationMs: Date.now() - startTime,
      statusCode: 500,
      clientIp
    });

    res.status(500)
      .type('text/xml; charset=utf-8')
      .send(buildFaultXml('soap:Server', 'WSDL Generation Error', error.message));
  }
}

/**
 * Controlador principal de operaciones SOAP para Facturación Electrónica & POS con aislamiento multi-tenant.
 */
export async function handleSoapAction(req, res) {
  const startTime = Date.now();
  const tenant = req.tenant;
  const { action, params } = req.soap;
  const tenantName = tenant.nombre || tenant.name || tenant.id;
  const brandColor = tenant.brand_color || '#F97316';
  const clientIp = req.headers['cf-connecting-ip'] || req.ip;

  // Soportar ConsultarFactura o ConsultarCuenta (compatibilidad)
  const isQueryInvoice = action === 'ConsultarFactura' || action === 'ConsultarCuenta';

  if (!isQueryInvoice) {
    logAudit({
      tenantId: tenant.id,
      action: `UNSUPPORTED_${action}`,
      durationMs: Date.now() - startTime,
      statusCode: 404,
      clientIp
    });

    res.status(404)
      .type('text/xml; charset=utf-8')
      .send(buildFaultXml(
        'soap:Client',
        `Unsupported Operation: ${action}`,
        `The requested operation "${action}" is not supported. Use "ConsultarFactura".`
      ));
    return;
  }

  // Extraer número de factura o ID
  const rawQuery = params.numero_factura || params.numeroFactura || params.id || '';
  const queryStr = String(rawQuery).trim();
  const numericId = parseInt(queryStr.replace(/\D/g, ''), 10) || 0;

  try {
    // Consulta a la tabla `facturas` aislada dentro del search_path del tenant
    const factura = await withTenantContext(tenant.schema_name, async (client) => {
      const query = `
        SELECT id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count
        FROM facturas
        WHERE numero_factura = $1 
           OR numero_factura = $2 
           OR numero_factura = $3 
           OR id = $4
        LIMIT 1;
      `;
      const tysNum = `TYS-${numericId}`;
      const facNum = `FAC-${numericId}`;
      const { rows } = await client.query(query, [queryStr, tysNum, facNum, numericId]);
      return rows[0] || null;
    });

    if (!factura) {
      logAudit({
        tenantId: tenant.id,
        action: 'CONSULTAR_FACTURA_NOT_FOUND',
        durationMs: Date.now() - startTime,
        statusCode: 404,
        clientIp,
        metadata: { query: queryStr }
      });

      res.status(404)
        .type('text/xml; charset=utf-8')
        .send(buildFaultXml(
          'soap:Client',
          'Factura / Comprobante POS No Encontrado',
          `No se encontró ninguna factura con el número "${queryStr}" en el tenant POS "${tenantName}".`
        ));
      return;
    }

    const targetNamespace = `https://${tenant.id}.pos-billing.com/wsdl`;

    // Envelope SOAP 1.1 completo con cabecera de timbrado fiscal y saneamiento de entidades XML
    const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${escapeXml(targetNamespace)}">
  <soap:Header>
    <tns:FiscalBrandContext>
      <tns:emisor>${escapeXml(tenantName)}</tns:emisor>
      <tns:tenantId>${escapeXml(tenant.id)}</tns:tenantId>
      <tns:brandColor>${escapeXml(brandColor)}</tns:brandColor>
      <tns:status>VALIDADA_DIAN_SAT</tns:status>
    </tns:FiscalBrandContext>
  </soap:Header>
  <soap:Body>
    <tns:ConsultarFacturaResponse>
      <tns:numero_factura>${escapeXml(factura.numero_factura)}</tns:numero_factura>
      <tns:cliente>${escapeXml(factura.cliente)}</tns:cliente>
      <tns:subtotal>${Number(factura.subtotal).toFixed(2)}</tns:subtotal>
      <tns:impuestos>${Number(factura.impuestos).toFixed(2)}</tns:impuestos>
      <tns:total>${Number(factura.total).toFixed(2)}</tns:total>
      <tns:estado>${escapeXml(factura.estado)}</tns:estado>
      <tns:folio_fiscal>${escapeXml(factura.folio_fiscal)}</tns:folio_fiscal>
      <tns:items_count>${Number(factura.items_count) || 1}</tns:items_count>
      <tns:emisor>${escapeXml(tenantName)}</tns:emisor>
    </tns:ConsultarFacturaResponse>
  </soap:Body>
</soap:Envelope>`.trim();

    logAudit({
      tenantId: tenant.id,
      action: 'CONSULTAR_FACTURA_SUCCESS',
      durationMs: Date.now() - startTime,
      statusCode: 200,
      clientIp,
      metadata: { invoice: factura.numero_factura, total: factura.total }
    });

    res.status(200)
      .type('text/xml; charset=utf-8')
      .send(responseXml);

  } catch (error) {
    const safeAction = validator.escape(String(action || '')).replace(/[\r\n]/g, '');
    const safeTenantId = validator.escape(String(tenant?.id || '')).replace(/[\r\n]/g, '');
    console.error(`Error executing SOAP operation [${safeAction}] for tenant [${safeTenantId}]:`, error);

    logAudit({
      tenantId: safeTenantId,
      action: 'CONSULTAR_FACTURA_ERROR',
      durationMs: Date.now() - startTime,
      statusCode: 500,
      clientIp,
      metadata: { error: error.message }
    });

    res.status(500)
      .type('text/xml; charset=utf-8')
      .send(buildFaultXml(
        'soap:Server',
        'Internal Database Error',
        `Error querying tenant schema "${escapeXml(tenant?.schema_name)}": ${escapeXml(error.message)}`
      ));
  }
}

export default {
  handleWsdl,
  handleSoapAction
};
