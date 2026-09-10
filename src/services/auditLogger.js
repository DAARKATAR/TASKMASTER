import fs from 'fs';
import path from 'path';

/**
 * Servicio de Logging y Auditoría Automatizado y Clasificado
 * Categorías:
 *  - logs/audit/   : Operaciones SOAP, emisión de facturas y transacciones
 *  - logs/access/  : Peticiones HTTP a la API y endpoints
 *  - logs/errors/  : Excepciones y fallos de servidor o base de datos
 */

const LOGS_ROOT = path.join(process.cwd(), 'logs');
const betterStackToken = process.env.BETTER_STACK_SOURCE_TOKEN;
const hasBetterStack = Boolean(betterStackToken);

// Asegurar directorios de logs al inicializar
['audit', 'access', 'errors'].forEach((category) => {
  const dir = path.join(LOGS_ROOT, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Escribe de forma asíncrona y no bloqueante en el archivo de log correspondiente con rotación diaria.
 */
function appendLog(category, data) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filePath = path.join(LOGS_ROOT, category, `${category}-${today}.log`);
    const line = JSON.stringify({ timestamp: new Date().toISOString(), ...data }) + '\n';
    fs.appendFile(filePath, line, (err) => {
      if (err) console.error(`[Logger Error] No se pudo escribir en ${category}:`, err.message);
    });
  } catch (err) {
    console.error(`[Logger Exception] Fallo escribiendo log en ${category}:`, err.message);
  }
}

/**
 * Registra un evento de auditoría de negocio / SOAP / facturación.
 */
export function logAudit({ tenantId, action, durationMs, statusCode, clientIp, metadata = {} }) {
  const entry = {
    tenant_id: tenantId || 'system',
    action: action || 'UNKNOWN_ACTION',
    status_code: statusCode || 200,
    duration_ms: Math.round(durationMs || 0),
    client_ip: clientIp || 'unknown',
    ...metadata
  };

  // 1. Consola estructurada
  console.log(`[AUDIT][${entry.tenant_id.toUpperCase()}][${entry.action}] ${entry.status_code} (${entry.duration_ms}ms) - IP: ${entry.client_ip}`);

  // 2. Archivo persistente clasificado en logs/audit/
  appendLog('audit', entry);

  // 3. Envío opcional a Better Stack
  if (hasBetterStack) {
    try {
      fetch('https://in.logs.betterstack.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${betterStackToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      }).catch(() => {});
    } catch {}
  }
}

/**
 * Registra acceso HTTP a la API.
 */
export function logAccess({ method, url, statusCode, durationMs, clientIp, userAgent }) {
  appendLog('access', {
    method,
    url,
    status_code: statusCode,
    duration_ms: Math.round(durationMs || 0),
    client_ip: clientIp || 'unknown',
    user_agent: userAgent || 'unknown'
  });
}

/**
 * Registra errores y excepciones del sistema.
 */
export function logError(err, context = {}) {
  console.error('[ERROR EVENT]', err.message, context);
  appendLog('errors', {
    message: err.message,
    stack: err.stack,
    ...context
  });
}

/**
 * Devuelve un resumen del estado de los logs almacenados y las últimas líneas de cada categoría.
 */
export function getLogsSummary() {
  const summary = {};
  ['audit', 'access', 'errors'].forEach((cat) => {
    const dir = path.join(LOGS_ROOT, cat);
    if (!fs.existsSync(dir)) {
      summary[cat] = { fileCount: 0, files: [], recentEntries: [] };
      return;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.log'));
    let recent = [];

    if (files.length > 0) {
      const latestFile = path.join(dir, files[files.length - 1]);
      try {
        const lines = fs.readFileSync(latestFile, 'utf8').trim().split('\n').filter(Boolean);
        recent = lines.slice(-10).map(l => {
          try { return JSON.parse(l); } catch { return l; }
        });
      } catch {}
    }

    summary[cat] = {
      fileCount: files.length,
      files,
      latestFile: files[files.length - 1] || null,
      recentEntries: recent
    };
  });
  return summary;
}

export default {
  logAudit,
  logAccess,
  logError,
  getLogsSummary
};
