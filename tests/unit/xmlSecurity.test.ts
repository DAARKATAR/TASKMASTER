import { describe, it, expect } from 'vitest';
import { escapeXml } from '../../src/utils/xmlSecurity.js';

describe('Unidad: Seguridad y Saneamiento XML (xmlSecurity Utility)', () => {
  it('debe neutralizar caracteres XML peligrosos para evitar Reflected XSS', () => {
    const maliciousInput = '<script>alert("XSS")</script>&foo';
    const result = escapeXml(maliciousInput);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;&amp;foo');
    expect(result).not.toContain('<script>');
  });

  it('debe escapar comillas simples y dobles de forma segura', () => {
    const attributeInput = 'val"ue\'test';
    const result = escapeXml(attributeInput);
    expect(result).toBe('val&quot;ue&#x27;test');
  });

  it('debe manejar entradas nulas o indefinidas de forma segura', () => {
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
  });

  it('debe convertir números y tipos primitivos a cadenas seguras', () => {
    expect(escapeXml(12345)).toBe('12345');
    expect(escapeXml(0)).toBe('0');
  });
});
