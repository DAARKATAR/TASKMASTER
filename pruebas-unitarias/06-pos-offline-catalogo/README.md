# Módulo de Pruebas: Catálogos Iniciales y Resiliencia POS Fuera de Línea

## Propósito
Este módulo asegura la continuidad operativa del terminal Punto de Venta (POS). Evalúa la provisión automática de inventarios por rubro comercial y la cola de contingencia fuera de línea (*Offline Queue*) construida en IndexedDB / Web Storage para encolar ventas ante interrupciones de conectividad a Internet.

---

## Archivos de Pruebas y Scripts Incluidos

| Archivo | Tipo | Componente Evaluado | Estado Actual |
| :--- | :---: | :--- | :---: |
| `defaultProducts.test.ts` | Test Suite Vitest | `src/config/defaultProducts.js` | ✅ **ÉXITO (3/3 tests passed)** |
| `offlineQueue.test.ts` | Test Suite Vitest | `frontend/src/utils/offlineQueue.js` | ✅ **ÉXITO (4/4 tests passed)** |
| `verifyJsxImports.js` | Script de Integración | Validación estática de dependencias JSX | ✅ **OPERATIVO** |

---

## Desglose Detallado de Pruebas Unitarias

### Suite 1: `defaultProducts.test.ts`
- **Prueba 20:** *Asignación exacta de catálogo base según coincidencia de rubro comercial (Farmacia, Fast Food, Panadería).*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 21:** *Asignación de catálogo genérico por defecto ante rubros no registrados.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 22:** *Integridad estructural de precios, nombres, unidades y emojis de cada producto por defecto.*
  - **Resultado:** ✅ **ÉXITO**.

### Suite 2: `offlineQueue.test.ts`
- **Prueba 23:** *Encolado persistente de transacciones de venta sin conexión a red.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 24:** *Recuperación secuencial de transacciones pendientes en la cola.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 25:** *Eliminación de ítems sincronizados con éxito en el servidor.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 26:** *Sincronización masiva automática (`syncOfflineQueue`) al restablecer la conectividad.*
  - **Resultado:** ✅ **ÉXITO**.
