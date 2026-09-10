/**
 * Servicio de Auditoría Aislada Multi-Tenant (Better Stack Logger)
 * Diseñado según la capa 4 de la arquitectura ($0 USD/Mes).
 */

const betterStackToken = process.env.BETTER_STACK_SOURCE_TOKEN;
const hasBetterStack = Boolean(betterStackToken);

if (hasBetterStack) {
  console.log('[Audit] Better Stack Logger activo para auditoría remota.');
}

/**
 * Registra un evento de auditoría de forma estructurada.
 * 
 * @param {Object} event
 * @param {string} event.tenantId - Identificador del inquilino
 * @param {string} event.action - Acción ejecutada (ej. ConsultarFactura, WSDL, RestAPI)
 * @param {number} event.durationMs - Tiempo de respuesta en ms
 * @param {number} event.statusCode - Código de estado HTTP
 * @param {string} [event.clientIp] - IP del cliente / proxy de Cloudflare
 * @param {Object} [event.metadata] - Metadatos adicionales
 */
export async function logAudit({ tenantId, action, durationMs, statusCode, clientIp, metadata = {} }) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'taskmaster-pos',
    tenant_id: tenantId || 'system',
    action: action || 'UNKNOWN_ACTION',
    status_code: statusCode || 200,
    duration_ms: Math.round(durationMs || 0),
    client_ip: clientIp || 'unknown',
    ...metadata
  };

  // 1. Emisión estructurada a stdout (compatible con Koyeb / Docker logs)
  const prefix = `[AUDIT][${logEntry.tenant_id.toUpperCase()}][${logEntry.action}]`;
  console.log(`${prefix} ${logEntry.status_code} (${logEntry.duration_ms}ms) - IP: ${logEntry.client_ip}`);

  // 2. Envío a Better Stack si el token está configurado
  if (hasBetterStack) {
    try {
      fetch('https://in.logs.betterstack.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${betterStackToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      }).catch(err => {
        console.warn('[Audit Warning] Error enviando a Better Stack:', err.message);
      });
    } catch {
      // No bloquear la petición principal
    }
  }
}

export default {
  logAudit
};
