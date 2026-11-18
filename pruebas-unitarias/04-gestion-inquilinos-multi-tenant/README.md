# Módulo de Pruebas: Aislamiento Multi-Tenant y Resolución de Comercios

## Propósito
Este módulo verifica la correcta resolución dinámica del contexto multi-inquilino (*Multi-Tenancy*) a partir de subdominios, rutas URL o cabeceras HTTP, asegurando el aislamiento completo de esquemas PostgreSQL independientes para cada comercio registrado.

---

## Archivos de Pruebas y Scripts Incluidos

| Archivo | Tipo | Componente Evaluado | Estado Actual |
| :--- | :---: | :--- | :---: |
| `tenantResolver.test.ts` | Test Suite Vitest | `src/middlewares/tenantResolver.js` | ✅ **ÉXITO (5/5 tests passed)** |
| `syncAllTenants.js` | Script de Sincronización | Mapeo y verificación de esquemas PostgreSQL | ✅ **OPERATIVO** |
| `checkDetails.js` | Script de Inspección | Inspección de metadatos de configuración | ✅ **OPERATIVO** |
| `testProductsAndDetails.js` | Script de Integración | Validación de aislamiento de inventario | ✅ **OPERATIVO** |

---

## Desglose Detallado de Pruebas Unitarias

### Suite 1: `tenantResolver.test.ts`
- **Prueba 11:** *Resolución de tenant mediante parámetro de ruta en URL (ej: `/ws/:tenant`).*
  - **Resultado:** ✅ **ÉXITO** (Inyecta `req.tenant` con metadatos del comercio).
- **Prueba 12:** *Resolución de tenant mediante cabecera HTTP personalizada `X-Tenant-Id`.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 13:** *Resolución de tenant mediante subdominio de red (ej: `pasteleriatest.taskmaster.com`).*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 14:** *Rechazo con HTTP 404 estructurado si el tenant solicitado no existe en el catálogo o caché.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 15:** *Manejo tolerante a fallos si el identificador contiene caracteres especiales.*
  - **Resultado:** ✅ **ÉXITO** (Sanitización previa y prevención de fallos no controlados).
