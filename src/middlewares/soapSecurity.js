import { XMLParser, XMLValidator } from 'fast-xml-parser';

/**
 * Genera un SOAP Fault XML estándar para errores de seguridad o validación.
 *
 * @param {string} faultCode
 * @param {string} faultString
 * @param {string} detail
 * @returns {string}
 */
function buildFaultXml(faultCode, faultString, detail) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
      <detail>
        <message>${detail}</message>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`.trim();
}

// Configuración segura del parser:
// 1. Prohibir expansión de entidades externas y DTDs para mitigar ataques XXE (XML External Entity).
// 2. Normalización de prefijos de namespace para lectura uniforme (Envelope, Body).
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  processEntities: false, // Desactiva resolución/expansión de entidades XML personalizadas
  allowBooleanAttributes: false,
  trimValues: true,
  removeNSPrefix: true // Remueve prefijos de namespace (soap:, tns:, etc.) de las claves
});

/**
 * Middleware para validar XML, proteger contra ataques XXE y extraer acción/parámetros SOAP.
 */
export function soapSecurity(req, res, next) {
  const rawBody = req.body;

  if (!rawBody || typeof rawBody !== 'string' || rawBody.trim() === '') {
    res.status(400)
      .type('text/xml; charset=utf-8')
      .send(buildFaultXml('soap:Client', 'Empty SOAP Request', 'The request body cannot be empty.'));
    return;
  }

  // Mitigación estricta de XXE: Rechazar peticiones que incluyan DOCTYPE o ENTITY
  if (/<!DOCTYPE/i.test(rawBody) || /<!ENTITY/i.test(rawBody)) {
    res.status(400)
      .type('text/xml; charset=utf-8')
      .send(buildFaultXml('soap:Client', 'Security Violation: XXE Detected', 'XML DTDs and External Entities are strictly prohibited.'));
    return;
  }

  // Validar sintaxis XML
  const validationResult = XMLValidator.validate(rawBody);
  if (validationResult !== true) {
    const errorMsg = validationResult.err ? validationResult.err.msg : 'Invalid XML syntax';
    res.status(400)
      .type('text/xml; charset=utf-8')
      .send(buildFaultXml('soap:Client', 'XML Syntax Error', errorMsg));
    return;
  }

  try {
    const parsedXml = parser.parse(rawBody);

    const envelope = parsedXml?.Envelope;
    if (!envelope || !envelope.Body) {
      res.status(400)
        .type('text/xml; charset=utf-8')
        .send(buildFaultXml('soap:Client', 'Invalid SOAP Envelope', 'Missing soap:Envelope or soap:Body.'));
      return;
    }

    const body = envelope.Body;
    const bodyKeys = Object.keys(body);

    if (bodyKeys.length === 0) {
      res.status(400)
        .type('text/xml; charset=utf-8')
        .send(buildFaultXml('soap:Client', 'Empty SOAP Body', 'No operation found in SOAP Body.'));
      return;
    }

    // La primera clave en Body es la operación (ej. ConsultarCuenta o ConsultarCuentaRequest)
    const rawAction = bodyKeys[0];
    const normalizedAction = rawAction.replace(/Request$/, '');
    const operationParams = body[rawAction] || {};

    // Inyectar en req el payload SOAP decodificado de forma segura
    req.soap = {
      action: normalizedAction,
      rawAction,
      params: operationParams,
      parsedEnvelope: envelope
    };

    next();
  } catch (error) {
    res.status(400)
      .type('text/xml; charset=utf-8')
      .send(buildFaultXml('soap:Client', 'Malformed SOAP Request', error.message));
  }
}

export default soapSecurity;
