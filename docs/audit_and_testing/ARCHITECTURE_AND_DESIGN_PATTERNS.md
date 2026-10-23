# 🏛️ Arquitectura de Software y Patrones de Diseño (TaskMaster POS)

Este documento describe la estructura técnica, principios de código limpio y patrones de diseño aplicados en el frontend y backend de **TaskMaster POS**.

---

## 1. Arquitectura General del Sistema

```
                      ┌──────────────────────────────────────────────┐
                      │             CLIENTE NAVEGADOR (SPA)          │
                      │  React 19 + Vite + Tailwind CSS + Lucide     │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP REST / SOAP XML
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │              BACKEND API GATEWAY             │
                      │         Node.js + Express + TypeScript       │
                      ├──────────────────────┬───────────────────────┤
                      │   MÓDULOS DE DOMINIO │  INFRAESTRUCTURA      │
                      │   - Tenants          │  - Neon PostgreSQL   │
                      │   - Products         │  - L1 Memory Cache    │
                      │   - Invoices         │  - Error Negotiation  │
                      │   - SOAP WSDL Engine │  - JWT Auth Guard     │
                      └──────────────────────┴───────────────────────┘
```

---

## 2. Patrones de Diseño en Backend

### A. Modular Monolith / Arquitectura Limpia
- El código se estructura por módulos de negocio verticales dentro de `src/modules/`:
  - `tenants/`: Gestión de inquilinos, perfiles y paletas de colores corporativas.
  - `products/`: Catálogo de inventario con aislamiento estricto por `tenant_id`.
  - `invoices/`: Facturación electrónica, generación de folios y auditoría contable.
  - `soap/`: Adaptador legacy SOAP/XML con especificación formal WSDL 1.1.
- **Beneficio:** Alta cohesión y bajo acoplamiento; permite migrar cualquier módulo a un microservicio independiente en el futuro sin reescribir la lógica de dominio.

### B. Aislamiento Multi-Inquilino (Multi-Tenant Isolation)
- Cada consulta de base de datos incluye obligatoriamente el parámetro `tenant_id` o el slug correspondiente.
- Las preferencias visuales dinámicas se almacenan en columnas `JSONB` flexibles (`theme_palette`, `active_modules`), evitando migraciones destructivas de esquemas relacionales.

### C. Negociación de Contenido en Manejo de Errores (Content-Negotiation)
- Implementado en [errorHandler.ts](file:///home/daarkatar/Documentos/TASKMASTER/src/middlewares/errorHandler.ts).
- Detecta el encabezado `Accept` y la ruta solicitada:
  - Rutas `/api/*` reciben respuestas en formato `application/json`.
  - Rutas `/ws/*` reciben respuestas en formato `text/xml` con un sobre formal `<soapenv:Fault>`.

---

## 3. Patrones de Diseño en Frontend

### A. Patrón de Hooks Personalizados (Custom Hooks Separation)
Toda la lógica de estado y consumo de APIs se aísla de los componentes visuales:
- [useTenant.js](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/hooks/useTenant.js): Manejo del inquilino activo, sincronización en `localStorage` y actualización optimista de módulos y paletas.
- [useThemePreferences.js](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/hooks/useThemePreferences.js): Gestión de modo nocturno (`isDarkMode`), temas de fondo y posición del Navbar.
- [useInvoices.js](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/hooks/useInvoices.js): Emisión y consulta de facturas con soporte de paginación.
- [NotificationContext.jsx](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/context/NotificationContext.jsx): Proveedor global para alertas, notificaciones toast y modales de confirmación con Promises (`async confirm()`).

### B. Inyección de Tokens de Diseño por Variables CSS (Design Token Inversion)
- En lugar de modificar clases CSS estáticas en tiempo de ejecución, la aplicación inyecta variables nativas en el elemento raíz (`document.documentElement`):
  - `--tenant-primary`: Color de marca para botones principales y llamadas a la acción.
  - `--tenant-accent`: Color secundario para estados, badges y categorías.
  - `--tenant-bg`: Color de fondo de pantalla del espacio de trabajo.
- **Beneficio:** Renderizado de máxima velocidad sin recalcular estilos de Tailwind en tiempo de ejecución.

### C. Modo Nocturno Basado en Clases (Class-Based Dark Mode)
- Configurado con `darkMode: 'class'` en Tailwind CSS.
- El estado activa o desactiva la clase `.dark` en la etiqueta raíz `<html>`.
- Los componentes aprovechan las variantes `dark:*` de Tailwind de manera limpia y declarativa.

### D. Optimización de Carga con Code-Splitting
- En [App.jsx](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/App.jsx), las vistas pesadas secundarias (`ThemeCustomizerModal`, `NewTenantWizard`, `InventoryManager`, `KpiGrid`, `SoapConsole`) se cargan bajo demanda con `React.lazy()` y `Suspense`, reduciendo el bundle inicial en más de un 60%.
