# 📜 Bitácora de Cambios, Adiciones y Remociones (Changelog)

Este documento registra de manera formal y cronológica las adiciones, modificaciones y elementos retirados en la plataforma **TaskMaster POS**.

---

## [2026-10-23] - Iteración: Personalización Corporativa, Modo Nocturno y Auditoría

### 🟢 Adiciones (Added)
1. **Modo Nocturno Global (Dark Mode):**
   - Implementado botón de alternancia rápida entre **Modo Claro / Modo Nocturno** con íconos dinámicos (`Moon` / `Sun`).
   - Ubicación en todos los layouts de navegación:
     - Barra superior (`Navbar position="top"`).
     - Barras laterales (`position="left"` y `position="right"`).
     - Barra móvil/tablet inferior (`position="bottom"`).
     - Botón flotante inferior de herramientas rápidas.
     - Pestaña de Ajustes en [ThemeCustomizerModal.jsx](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/components/ThemeCustomizerModal.jsx).
   - Configuración Tailwind `darkMode: 'class'` habilitada en [tailwind.config.js](file:///home/daarkatar/Documentos/TASKMASTER/frontend/tailwind.config.js).
   - Persistencia local en `localStorage` con la clave `taskmaster_dark_mode`.
2. **Sistema de Paleta Corporativa en Neon DB:**
   - Adición del campo `theme_palette JSONB` en tabla `public.tenants`.
   - Endpoint `PATCH /api/tenants/:tenantId/theme` en backend para persistencia multi-tenant aislada.
   - Variables CSS globales inyectadas en `:root` (`--tenant-primary`, `--tenant-accent`, `--tenant-bg`).
3. **Simulador de Menú & Caja POS de Alta Fidelidad en Modal:**
   - Previsualizador interactivo que emula la interfaz real de TaskMaster (navbar con nombre de comercio, tabs de módulos, tarjeta de producto con precio y badge de acento, y ticket de cobro).
   - Detección inteligente de luminancia YIQ (`isColorDark`): adaptación automática de tipografía y bordes a tonos claros de alto contraste cuando se seleccionan fondos oscuros (como `#0F172A`).
4. **Muestra de 3 Colores en Presets:**
   - Círculos superpuestos de muestra en cada botón de preset que enseñan con claridad el color Primario, Secundario y de Fondo antes de seleccionarlo.
5. **Directorio Central de Auditoría y Pruebas (`docs/audit_and_testing/`):**
   - Creación de este registro para documentar pruebas, cambios de diseño y trazabilidad técnica.

---

### 🟡 Modificaciones (Changed)
1. **Nivelación y Simetría en Cuadros de Selección de Color:**
   - Corrección del desnivel visual causado por el salto de línea en la etiqueta "Secundario".
   - Encabezados estandarizados con altura uniforme (`h-5`) y cajas de input fijas de `h-11`.
2. **Simplificación del Botón de Guardado:**
   - Renombrado de `"Guardar Paleta en Neon DB"` a simplemente **`"Guardar"`**.
3. **Consistencia Global del Fondo de Trabajo:**
   - Actualización de [App.jsx](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/App.jsx) y [useThemePreferences.js](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/hooks/useThemePreferences.js) para que el fondo de la pantalla reaccione fielmente a `currentTenant.theme_palette.background`.
   - Armonización de los 7 presets de industria con tonos de fondo limpios y diferenciados (`#F8FAFC`, `#FFF5F7`, `#FDFBF7`, `#F0FDF4`, `#FEF2F2`, `#0F172A`, `#F8F7FF`).
4. **Aislamiento de Impresión de Facturas:**
   - Corrección de la impresión en [BakeryReceiptTicket.jsx](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/components/BakeryReceiptTicket.jsx) mediante directivas `@media print` para imprimir únicamente el ticket térmico formal, omitiendo el resto del navegador.
5. **Persistencia de Tenant Activo tras Recarga:**
   - Corrección en [useTenant.js](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/hooks/useTenant.js) para evitar que al presionar F5 el sistema cambie de comercio arbitrariamente.

---

### 🔴 Remociones (Removed)
1. **Retiro del Botón "Aplicar":**
   - Eliminado el botón experimental de *"Aplicar"* en [ThemeCustomizerModal.jsx](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/components/ThemeCustomizerModal.jsx), simplificando la interfaz del pie a únicamente **Cerrar** y **Guardar**.
2. **Eliminación de Productos Precargados para Nuevos Comercios:**
   - Se removió la inyección de productos demo por defecto; los nuevos comercios inician con inventario en 0, listo para carga limpia.
3. **Eliminación de Alertas Genéricas de Navegador:**
   - Sustitución de `window.alert` y `window.confirm` por diálogos y toasts interactivos personalizados a través de [NotificationContext.jsx](file:///home/daarkatar/Documentos/TASKMASTER/frontend/src/context/NotificationContext.jsx).
