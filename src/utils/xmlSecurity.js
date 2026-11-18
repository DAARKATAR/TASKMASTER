/**
 * Módulo de Seguridad y Saneamiento XML para Arquitectura SOAP / Multi-Tenant.
 * Previene vulnerabilidades de Inyección XML y Reflected XSS (CWE-79 / SonarQube S5131).
 */

/**
 * Escapa caracteres especiales en cadenas que se incrustan en documentos XML o SOAP Faults.
 * Para contenido entre etiquetas (element text), neutraliza '&', '<', y '>'.
 * Si se usa en atributos XML, también escapa comillas dobles y simples.
 * 
 * @param {string|number|null|undefined} unsafe - Valor a sanear.
 * @param {boolean} [forAttribute=false] - Indica si el valor se inserta dentro de un atributo XML.
 * @returns {string} Cadena saneada con entidades XML seguras.
 */
export function escapeXml(unsafe, forAttribute = false) {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  const escaped = String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (forAttribute) {
    return escaped.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  return escaped;
}
