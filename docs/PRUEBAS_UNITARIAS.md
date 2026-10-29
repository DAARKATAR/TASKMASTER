# Suite de Pruebas Unitarias y de Integración — TASKMASTER POS

> **Fecha:** Octubre 2026  
> **Framework de Testing:** [Vitest 5.0.3](https://vitest.dev/) con Supertest y mocks deterministas  
> **Resultado:** **44 / 44 pruebas aprobadas (100% PASS)**  
> **Tiempo de ejecución total:** ~4.1 segundos  

---

## 1. Resumen Ejecutivo

Esta suite de pruebas fue diseñada para certificar la estabilidad, seguridad, aislamiento multi-inquilino y resiliencia de la plataforma **TASKMASTER (Multi-Tenant SOAP & REST API Backend)**.

Las pruebas se ejecutan de manera completamente desacoplada de la base de datos física mediante mocks controlados de la capa `pg` y de `localStorage`, lo que permite ejecutarlas en cualquier entorno de integración continua (CI/CD), contenedores Docker o entornos locales sin requerir credenciales de red activas.

```bash
Test Files  9 passed (9)
Tests       44 passed (44)
Duration    ~4.12s
```

---

## 2. Mapa y Organización de las Pruebas

```
tests/
├── unit/
│   ├── auth.test.ts             # 6 pruebas: JWT, firma, expiración y middleware authenticateJwt
│   ├── tenantResolver.test.ts   # 5 pruebas: Resolución por URL, headers HTTP y subdominios DNS
│   ├── wsdlGenerator.test.ts    # 4 pruebas: Contratos SOAP WSDL 1.1, esquemas XML y bindings
│   ├── cacheService.test.ts     # 4 pruebas: Caché L1 en memoria, TTL, invalidación y expiración
│   ├── defaultProducts.test.ts  # 3 pruebas: Catálogos predefinidos, rubros y fallback seguro
│   └── offlineQueue.test.ts     # 4 pruebas: Cola de contingencia local, folios temporales y sync
├── soapSecurity.test.ts         # 3 pruebas: Mitigación de inyecciones XML XXE y validación sintáctica
├── errorHandler.test.ts         # 2 pruebas: Content-negotiation (SOAP Fault XML vs REST JSON)
└── apiEndpoints.test.ts         # 13 pruebas: Cobertura integral de endpoints HTTP REST y SOAP
```

---

## 3. Especificación Detallada de Pruebas Unitarias

### Bloque 1: Autenticación y Autorización JWT (`tests/unit/auth.test.ts`)
Valida la integridad de la seguridad de sesiones, verificación criptográfica y prevención de acceso no autorizado.

* **Prueba 1 — `signJwt` generación íntegra:** Verifica que la función genere un token en formato estándar `Header.Payload.Signature` conservando intactos los claims del usuario (`userId`, `email`, `role`, `tenantId`).
* **Prueba 2 — `authenticateJwt` autorización exitosa:** Simula una petición con encabezado `Authorization: Bearer <token_valido>`, comprobando que el middleware ejecute `next()` y adjunte el contexto `req.user` sin alterar el estado HTTP.
* **Prueba 3 — `authenticateJwt` encabezado faltante (401):** Comprueba que si la petición no incluye cabecera `Authorization`, se bloquee la ejecución con código HTTP 401 y mensaje `Acceso no autorizado`.
* **Prueba 4 — `authenticateJwt` esquema no-Bearer (401):** Valida que peticiones con otros esquemas (como `Basic` o cadenas crudas) sean rechazadas con 401 exigiendo el formato Bearer.
* **Prueba 5 — `authenticateJwt` detección de firma manipulada (403):** Verifica que si un token es firmado con una clave secreta no autorizada o si su payload fue alterado, el middleware retorne 403 con mensaje de token inválido o manipulado.
* **Prueba 6 — `authenticateJwt` expiración temporal (401):** Comprueba que tokens con tiempo de vida caducado sean detectados de inmediato (`TokenExpiredError`) retornando 401 con el mensaje `La sesión ha expirado`.

---

### Bloque 2: Resolución Multi-Inquilino (`tests/unit/tenantResolver.test.ts`)
Garantiza el correcto aislamiento multi-tenant y la detección dinámica del esquema de base de datos correspondiente.

* **Prueba 7 — Resolución por parámetro de ruta:** Valida que peticiones a `/ws/:tenantId` (ej. `/ws/pasteleriatest`) resuelvan el inquilino y asignen `req.tenant`.
* **Prueba 8 — Resolución por cabecera HTTP `x-tenant-id`:** Comprueba que clientes API o integraciones que envíen el identificador en headers sean resueltos correctamente.
* **Prueba 9 — Resolución por subdominio Cloudflare:** Verifica la extracción automática del subdominio a partir del header `Host` (ej. `tortas.taskmaster-pos.com` -> inquilino `tortas`).
* **Prueba 10 — Ausencia de identificador (404 SOAP Fault):** Valida que si la petición no incluye ningún identificador válido, se responda un `<soap:Fault>` con código `soap:Client` y detalle `Missing Tenant Identifier`.
* **Prueba 11 — Inquilino inexistente (404 SOAP Fault):** Comprueba que ante un inquilino no registrado en el sistema, se emita un `<soap:Fault>` con código 404 indicando que el tenant no fue encontrado.

---

### Bloque 3: Generador Dinámico de Contratos WSDL 1.1 (`tests/unit/wsdlGenerator.test.ts`)
Valida la generación en tiempo de ejecución del contrato formal SOAP para integración con clientes empresariales y DIAN/SAT.

* **Prueba 12 — Estructura XML y namespaces WSDL:** Valida que el documento generado contenga la declaración XML, nodo raíz `<definitions>` y namespaces estándar WSDL y SOAP.
* **Prueba 13 — Aislamiento de namespaces por inquilino:** Comprueba que `targetNamespace` y `schemaNamespace` contengan el subdominio y slug único del inquilino consultado.
* **Prueba 14 — Definición de tipos de datos fiscales:** Verifica que el esquema XSD declare `ConsultarFacturaRequest` y `ConsultarFacturaResponse` con todos sus campos numéricos y de texto (`subtotal`, `impuestos`, `total`, `folio_fiscal`, `estado`).
* **Prueba 15 — Binding Document/Literal y Endpoint Address:** Valida que el binding configure el estilo `document/literal` y que `soap:address location` apunte a la URL canónica del host y tenant correspondiente.

---

### Bloque 4: Servicio de Caché L1 en Memoria (`tests/unit/cacheService.test.ts`)
Verifica la capa de aceleración en memoria diseñada para no saturar las cuotas de la base de datos PostgreSQL Serverless.

* **Prueba 16 — Almacenamiento y recuperación clave-valor:** Comprueba que `setCache` y `getCache` almacenen y entreguen estructuras JSON complejas sin pérdida de tipos.
* **Prueba 17 — Consulta de claves inexistentes:** Verifica que ante una clave no registrada, la función retorne `null` de forma segura.
* **Prueba 18 — Expiración temporal por TTL:** Valida que al transcurrir el tiempo de vida asignado (Time-To-Live), la entrada sea purgada automáticamente y retorne `null`.
* **Prueba 19 — Invalidación explícita (`deleteCache`):** Comprueba que ante mutaciones en la base de datos (actualización de productos o módulos), la clave de caché sea eliminada de inmediato.

---

### Bloque 5: Catálogos de Inicialización Comercial (`tests/unit/defaultProducts.test.ts`)
Garantiza que cada comercio aprovisionado reciba un inventario de arranque coherente con su industria.

* **Prueba 20 — Coincidencia contextual por rubro:** Verifica que al solicitar catálogos para "Farmacia", "Restaurante" o "Boutique", se entreguen los productos especializados de ese sector.
* **Prueba 21 — Fallback seguro ante rubros desconocidos:** Comprueba que si el usuario ingresa un rubro no mapeado o una cadena vacía, el sistema asigne de manera segura el catálogo por defecto ("Repostería & Café").
* **Prueba 22 — Validación de atributos comerciales e inventario:** Itera sobre todos los productos de todos los rubros para verificar que tengan `nombre` válido, `precio > 0`, `stock >= 10`, `emoji` y `rubro` no vacíos.

---

### Bloque 6: Resiliencia de Ventas Fuera de Línea (`tests/unit/offlineQueue.test.ts`)
Valida la capacidad del punto de venta para seguir facturando ante interrupciones de internet.

* **Prueba 23 — Encolamiento y generación de comprobante temporal:** Comprueba que `enqueueOfflineSale` almacene la venta en cola local y le asigne un folio de contingencia `REC-OFF-xxxx`.
* **Prueba 24 — Filtrado de cola por inquilino:** Valida que en terminales compartidas o multi-sesión, cada comercio visualice exclusivamente sus propias ventas pendientes de sincronizar.
* **Prueba 25 — Eliminación selectiva de comprobantes sincronizados:** Verifica que al confirmarse la persistencia de una factura en Neon DB, esta sea removida de la cola sin afectar a las demás.
* **Prueba 26 — Sincronización en lote (`syncOfflineQueue`):** Simula el restablecimiento de la conexión, validando el procesamiento secuencial de todas las órdenes en cola y el vaciado del almacenamiento local.

---

### Bloque 7: Mitigación de Ataques XXE en SOAP (`tests/soapSecurity.test.ts`)
Asegura la protección del endpoint XML contra vulnerabilidades de inyección y lectura no autorizada del sistema de archivos.

* **Prueba 27 — Rechazo de cargas vacías:** Responde `400 Bad Request` con SOAP Fault ante peticiones con cuerpo en blanco.
* **Prueba 28 — Bloqueo estricto de ataques XXE:** Detecta y aborta inmediatamente cargas que contengan `<!DOCTYPE>` o `<!ENTITY>`, protegiendo el servidor contra ataques de exfiltración de archivos (`/etc/passwd`).
* **Prueba 29 — Parseo de Envelope válido:** Comprueba la deserialización segura de envoltorios SOAP válidos con extracción limpia de la operación `ConsultarFactura`.

---

### Bloque 8: Content-Negotiation de Errores Globales (`tests/errorHandler.test.ts`)
Garantiza que la respuesta ante excepciones coincida estrictamente con el protocolo que el cliente está utilizando.

* **Prueba 30 — Errores en rutas `/api` (REST):** Verifica que ante una excepción en la API REST, el middleware devuelva cabecera `Content-Type: application/json` y objeto JSON `{ success: false, error: ... }`.
* **Prueba 31 — Errores en rutas `/ws` (SOAP):** Comprueba que ante una excepción en el Web Service SOAP, se emita un `Content-Type: text/xml` con un XML `<soap:Fault>` estándar.

---

### Bloque 9: Endpoints Core y API REST/SOAP (`tests/apiEndpoints.test.ts`)
Certifica el comportamiento de todas las rutas HTTP públicas y privadas del servidor Express.

* **Prueba 32 — `GET /api` y `GET /`:** Valida la respuesta de bienvenida y documentación de la API con estado `online`.
* **Prueba 33 — `GET /health`:** Verifica el endpoint de monitoreo de disponibilidad retornando `status: 'healthy'`.
* **Prueba 34 — `GET /api/logs/summary`:** Comprueba la lectura de archivos clasificados de auditoría (`audit`, `access`, `errors`).
* **Prueba 35 — `GET /api/tenants`:** Valida el listado de todos los inquilinos activos del sistema.
* **Prueba 36 — `GET /ws/:tenantId`:** Comprueba la entrega del documento WSDL del inquilino con cabecera XML.
* **Prueba 37 — `POST /ws/:tenantId`:** Valida la consulta SOAP de comprobantes fiscales devolviendo un XML estructurado.
* **Prueba 38 — `POST /api/auth/login` validación:** Comprueba el rechazo 400 ante credenciales incompletas.
* **Prueba 39 — `GET /api/auth/me` seguridad:** Comprueba el rechazo 401 si se intenta consultar la sesión sin token JWT.
* **Prueba 40 — `GET /api/tenants/:id/products`:** Valida la obtención del inventario y catálogo de productos del tenant.
* **Prueba 41 — `PATCH /api/tenants/:id/products/:id`:** Comprueba la existencia y ruteo de actualización de stock.
* **Prueba 42 — `DELETE /api/tenants/:id/products/:id`:** Comprueba la existencia y ruteo de eliminación de artículos.
* **Prueba 43 — `GET /api/tenants/:id/invoices`:** Valida la consulta paginada del historial de facturación fiscal.
* **Prueba 44 — `GET /api/tenants/:id/metrics`:** Comprueba el cálculo de métricas financieras (`total_ventas`, `total_comprobantes`, `ticket_promedio`, `total_iva`).

---

## 4. Guía de Ejecución

### Ejecutar toda la suite de pruebas
```bash
npm test
```

### Ejecutar pruebas en modo observador (Watch Mode durante desarrollo)
```bash
npx vitest
```

### Ejecutar un archivo o módulo específico
```bash
npx vitest run tests/unit/auth.test.ts
npx vitest run tests/unit/tenantResolver.test.ts
npx vitest run tests/unit/offlineQueue.test.ts
```

### Generar reporte de cobertura de código (Coverage)
```bash
npx vitest run --coverage
```

---

## 5. Tabla Resumen de Cobertura

| Módulo / Componente | Archivo de Prueba | Casos | Estado |
| :--- | :--- | :---: | :---: |
| **Autenticación & JWT** | `tests/unit/auth.test.ts` | 6 | ✅ APROBADO |
| **Resolución Multi-Tenant** | `tests/unit/tenantResolver.test.ts` | 5 | ✅ APROBADO |
| **Generador WSDL SOAP 1.1** | `tests/unit/wsdlGenerator.test.ts` | 4 | ✅ APROBADO |
| **Caché en Memoria L1** | `tests/unit/cacheService.test.ts` | 4 | ✅ APROBADO |
| **Catálogos por Rubro** | `tests/unit/defaultProducts.test.ts` | 3 | ✅ APROBADO |
| **Resiliencia Offline** | `tests/unit/offlineQueue.test.ts` | 4 | ✅ APROBADO |
| **Seguridad SOAP & XXE** | `tests/soapSecurity.test.ts` | 3 | ✅ APROBADO |
| **Content-Negotiation Errores**| `tests/errorHandler.test.ts` | 2 | ✅ APROBADO |
| **Endpoints Core API** | `tests/apiEndpoints.test.ts` | 13 | ✅ APROBADO |
| **TOTAL** | **9 Archivos de Prueba** | **44** | **100% PASS** |


---

## 6. Galería de Evidencias Gráficas de Ejecución (Capturas de Terminal)

Todas las capturas de ejecución se encuentran almacenadas en formato vectorial de alta resolución en la carpeta [`docs/evidence/`](./evidence/):

| Suite de Prueba | Archivo de Captura | Estado y Casos |
| :--- | :--- | :---: |
| **Resumen General de la Suite (44 Tests)** | [`summary-all-tests.svg`](./evidence/summary-all-tests.svg) | ![Resumen](./evidence/summary-all-tests.svg) |
| **1. Autenticación & JWT** | [`suite-auth.svg`](./evidence/suite-auth.svg) | 6 Casos (100% PASS) |
| **2. Resolución Multi-Inquilino** | [`suite-tenant-resolver.svg`](./evidence/suite-tenant-resolver.svg) | 5 Casos (100% PASS) |
| **3. Generador de Contratos WSDL 1.1** | [`suite-wsdl-generator.svg`](./evidence/suite-wsdl-generator.svg) | 4 Casos (100% PASS) |
| **4. Caché L1 en Memoria con TTL** | [`suite-cache-service.svg`](./evidence/suite-cache-service.svg) | 4 Casos (100% PASS) |
| **5. Catálogos por Rubro Comercial** | [`suite-default-products.svg`](./evidence/suite-default-products.svg) | 3 Casos (100% PASS) |
| **6. Resiliencia y Contingencia Offline** | [`suite-offline-queue.svg`](./evidence/suite-offline-queue.svg) | 4 Casos (100% PASS) |
| **7. Seguridad SOAP & Mitigación XXE** | [`suite-soap-security.svg`](./evidence/suite-soap-security.svg) | 3 Casos (100% PASS) |
| **8. Content-Negotiation de Errores** | [`suite-error-handler.svg`](./evidence/suite-error-handler.svg) | 2 Casos (100% PASS) |
| **9. Endpoints Core de la API** | [`suite-core-api.svg`](./evidence/suite-core-api.svg) | 13 Casos (100% PASS) |
