# Módulo de Pruebas: Seguridad SOAP, Blindaje XML y Contratos WSDL 1.1

## Propósito
Este módulo agrupa las pruebas automatizadas y scripts de verificación para la interfaz de facturación y servicios SOAP de marca blanca (*White-Label*). Garantiza la inmunidad frente a ataques de inyección XML (XXE), ataques de denegación de servicio por expansión de entidades y ataques de Cross-Site Scripting Reflejado (Reflected XSS / CWE-79) en la entrega dinámica del contrato WSDL 1.1.

---

## Archivos de Pruebas y Scripts Incluidos

| Archivo | Tipo | Componente Evaluado | Estado Actual |
| :--- | :---: | :--- | :---: |
| `soapSecurity.test.ts` | Test Suite Vitest | `src/middlewares/soapSecurity.js` | ✅ **ÉXITO (3/3 tests passed)** |
| `wsdlGenerator.test.ts` | Test Suite Vitest | `src/services/wsdlGenerator.js` | ✅ **ÉXITO (5/5 tests passed)** |
| `xmlSecurity.test.ts` | Test Suite Vitest | `src/utils/xmlSecurity.js` | ✅ **ÉXITO (4/4 tests passed)** |
| `testClient.js` | Script de Integración | Cliente SOAP HTTP de prueba | ✅ **OPERATIVO** |
| `testTys.js` | Script de Verificación | Verificación de tipos y esquemas | ✅ **OPERATIVO** |

---

## Desglose Detallado de Pruebas Unitarias

### Suite 1: `soapSecurity.test.ts`
- **Prueba 1:** *Rechazo de payloads XML con declaración `<!DOCTYPE` maliciosa (XXE)*
  - **Objetivo:** Impedir que atacantes carguen archivos locales del servidor (`/etc/passwd`) o activen recursos de red externos vía DTD.
  - **Resultado:** ✅ **ÉXITO** (Retorna HTTP 400 Bad Request y bloquea la solicitud antes del parser).
- **Prueba 2:** *Rechazo de payloads XML con entidades generales `<!ENTITY`*
  - **Objetivo:** Mitigar ataques *Billion Laughs* o bombas de entidades XML que saturen la memoria RAM.
  - **Resultado:** ✅ **ÉXITO** (Detección preventiva activa).
- **Prueba 3:** *Aceptación de sobres SOAP válidos sin DTDs maliciosas*
  - **Objetivo:** Permitir el flujo regular de peticiones transaccionales legítimas.
  - **Resultado:** ✅ **ÉXITO** (Traspaso transparente al controlador).

### Suite 2: `wsdlGenerator.test.ts`
- **Prueba 7:** *Generación de estructura WSDL 1.1 válida con raíz `<definitions>` y namespaces oficiales.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 8:** *Aislamiento estricto de namespaces XML usando el ID único del tenant.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 9:** *Definición de tipos fiscales (`subtotal`, `impuestos`, `total`, `folio_fiscal`, `estado`).*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 10:** *Configuración de binding `document/literal` y localización exacta de endpoint HTTP.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 11:** *Saneamiento estricto de inyecciones XSS y caracteres XML especiales en metadatos del comercio.*
  - **Objetivo:** Neutralizar SonarQube `jssecurity:S5131`.
  - **Resultado:** ✅ **ÉXITO** (Convierte `<script>` en entidades seguras `&lt;script&gt;` y caracteres `&` en `&amp;`).

### Suite 3: `xmlSecurity.test.ts`
- **Prueba 1:** *Neutralización de caracteres XML peligrosos para evitar Reflected XSS.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 2:** *Retorno de cadena vacía ante valores nulos o indefinidos.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 3:** *Conversión segura de tipos numéricos a cadena.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 4:** *Escape de comillas simples y dobles para protección de atributos XML.*
  - **Resultado:** ✅ **ÉXITO**.
