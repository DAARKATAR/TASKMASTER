# Módulo de Pruebas: Endpoints del Servidor y Negociación de Errores

## Propósito
Este módulo centraliza las pruebas de integración y comportamiento HTTP del servidor Express principal (`src/server.ts`) y del manejador global de excepciones (`src/middlewares/errorHandler.middleware.ts`), verificando la negociación de contenido según si la ruta afectada es REST (`/api`) o SOAP (`/ws`).

---

## Archivos de Pruebas y Scripts Incluidos

| Archivo | Tipo | Componente Evaluado | Estado Actual |
| :--- | :---: | :--- | :---: |
| `apiEndpoints.test.ts` | Test Suite Vitest | `src/server.ts` & Rutas REST Core | ✅ **ÉXITO (13/13 tests passed)** |
| `errorHandler.test.ts` | Test Suite Vitest | `src/middlewares/errorHandler.middleware.ts` | ✅ **ÉXITO (2/2 tests passed)** |
| `startTunnel.js` | Script de Utilidad | Exposición segura vía túnel para webhooks | ✅ **OPERATIVO** |

---

## Desglose Detallado de Pruebas Unitarias

### Suite 1: `apiEndpoints.test.ts`
- **GET `/api`:** Retorna metadatos del servicio y estado operacional (200). ✅
- **GET `/health`:** Diagnóstico de salud y métricas de uptime en JSON (200). ✅
- **GET `/api/logs/summary`:** Entrega resumen clasificado de logs de auditoría (200). ✅
- **GET `/api/tenants`:** Listado de comercios e inquilinos registrados (200). ✅
- **GET `/ws/pasteleratest`:** Generación y entrega del contrato WSDL en formato XML (200). ✅
- **POST `/ws/pasteleratest`:** Consulta de factura SOAP procesada exitosamente en XML (200). ✅
- **POST `/api/auth/login`:** Rechazo con 400 ante credenciales vacías. ✅
- **GET `/api/auth/me`:** Rechazo con 401 si no hay token de sesión. ✅
- **GET `/api/tenants/:tenant/products`:** Obtención del catálogo del inquilino (200). ✅
- **PATCH `/api/tenants/:tenant/products/:id`:** Retorno 404 al intentar actualizar producto inexistente. ✅
- **DELETE `/api/tenants/:tenant/products/:id`:** Manejo seguro de eliminación de productos (200). ✅
- **GET `/api/tenants/:tenant/invoices?paginated=true`:** Paginación de facturas emitidas (200). ✅
- **GET `/api/tenants/:tenant/metrics`:** Cálculo consolidado de KPIs de venta (200). ✅

### Suite 2: `errorHandler.test.ts`
- **Prueba 1:** *Negociación REST:* Ante un error interno en rutas `/api`, entrega una respuesta estructurada en formato JSON (`{ error: true, message: ... }`) con código de estado adecuado. ✅
- **Prueba 2:** *Negociación SOAP:* Ante un error interno en rutas `/ws`, entrega un XML de tipo `soap:Fault` con código `soap:Server` cumpliendo con el protocolo estándar SOAP 1.1. ✅
