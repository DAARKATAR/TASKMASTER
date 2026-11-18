# Módulo de Pruebas: Servicio de Caché L1 en Memoria con TTL

## Propósito
Este módulo somete a prueba el motor de caché en memoria de alto rendimiento (`src/services/cacheService.js`), diseñado para acelerar la resolución de esquemas multi-inquilino y reducir la carga de lectura sobre la base de datos PostgreSQL en la nube (Neon DB).

---

## Archivos de Pruebas y Scripts Incluidos

| Archivo | Tipo | Componente Evaluado | Estado Actual |
| :--- | :---: | :--- | :---: |
| `cacheService.test.ts` | Test Suite Vitest | `src/services/cacheService.js` | ✅ **ÉXITO (4/4 tests passed)** |

---

## Desglose Detallado de Pruebas Unitarias

### Suite 1: `cacheService.test.ts`
- **Prueba 16:** *Almacenamiento y recuperación precisa de valores primitivos y objetos complejos.*
  - **Objetivo:** Verificar la integridad de los datos almacenados en memoria sin serializaciones corruptas.
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 17:** *Expiración automática por Time-To-Live (TTL).*
  - **Objetivo:** Garantizar que entradas vencidas retornen `null` y liberen memoria.
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 18:** *Eliminación selectiva de claves individuales vía `deleteCache(key)`.*
  - **Objetivo:** Permitir invalidaciones inmediatas ante actualizaciones de datos.
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 19:** *Vaciado global de la memoria caché mediante `clearMemoryCache()`.*
  - **Objetivo:** Garantizar el restablecimiento limpio de estado entre pruebas y despliegues.
  - **Resultado:** ✅ **ÉXITO**.
