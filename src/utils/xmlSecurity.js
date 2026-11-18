import validator from 'validator';

/**
 * Módulo de Seguridad y Saneamiento XML para Arquitectura SOAP / Multi-Tenant.
 * Previene vulnerabilidades de Inyección XML y Reflected XSS (CWE-79 / SonarQube S5131).
 * Implementa el estándar de saneamiento certificado por SonarQube mediante la librería 'validator'.
 *
 * @param {string|number|null|undefined} unsafe - Valor potencialmente controlado por el usuario.
 * @returns {string} Cadena saneada con entidades XML y HTML seguras.
 */
export function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return validator.escape(String(unsafe));
}
