import { getTenantById } from '../services/tenantService.js';

/**
 * Genera una respuesta SOAP 1.1 Fault XML estándar.
 */
function buildSoapFaultXml(faultCode, faultString, detailMessage) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
      <detail>
        <message>${detailMessage}</message>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`.trim();
}

/**
 * Extrae el subdominio del host si aplica (ej. "alpha.midominio.com" -> "alpha").
 */
function extractSubdomain(host) {
  if (!host) return null;
  const cleanHost = host.split(':')[0].toLowerCase();
  
  // Excluir localhost, IPs y dominios directos
  if (cleanHost === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
    return null;
  }

  const parts = cleanHost.split('.');
  // Requiere al menos subdominio + dominio + tld (ej. alpha.example.com)
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'api' && sub !== 'app') {
      return sub;
    }
  }
  return null;
}

/**
 * Middleware para resolver y validar el inquilino (tenant) mediante:
 * 1. Parámetro de ruta (:tenantId)
 * 2. Cabecera HTTP X-Tenant-ID (Cloudflare / Clientes API)
 * 3. Query param (?tenant=...)
 * 4. Subdominio Cloudflare / DNS
 */
export async function tenantResolver(req, res, next) {
  try {
    let tenantId = req.params?.tenantId ||
                   req.headers['x-tenant-id'] ||
                   req.query?.tenant;

    if (!tenantId) {
      const host = req.get('host') || req.headers['x-forwarded-host'];
      tenantId = extractSubdomain(host);
    }

    if (!tenantId) {
      res.status(404)
        .type('text/xml; charset=utf-8')
        .send(buildSoapFaultXml(
          'soap:Client',
          'Missing Tenant Identifier',
          'Tenant identifier must be provided via URL path (/ws/:tenantId), X-Tenant-ID header, or Cloudflare subdomain.'
        ));
      return;
    }

    const tenant = await getTenantById(tenantId);

    if (!tenant) {
      res.status(404)
        .type('text/xml; charset=utf-8')
        .send(buildSoapFaultXml(
          'soap:Client',
          `Tenant '${tenantId}' not found`,
          'The specified tenant does not exist or is inactive in the system.'
        ));
      return;
    }

    // Adjuntar tenant al contexto de la petición
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500)
      .type('text/xml; charset=utf-8')
      .send(buildSoapFaultXml(
        'soap:Server',
        'Internal Tenant Resolution Error',
        'An error occurred while resolving tenant configuration.'
      ));
  }
}

export default tenantResolver;
