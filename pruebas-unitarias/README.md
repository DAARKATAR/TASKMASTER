# Centro Maestro de Pruebas Unitarias, Integración y Scripts de Soporte

Este directorio consolida y clasifica la totalidad de pruebas automatizadas y scripts de prueba del proyecto **TASKMASTER**, organizados según el componente y dominio funcional evaluado.

---

## Estructura Clasificada de Pruebas

```
pruebas-unitarias/
├── 01-seguridad-soap-wsdl/            # Blindaje XML, Contratos WSDL 1.1 y Protección XXE
├── 02-autenticacion-usuarios/          # Tokens JWT, Validación de Esquemas y Permisos
├── 03-api-endpoints-servidor/          # Rutas REST Core y Negociación de Errores HTTP
├── 04-gestion-inquilinos-multi-tenant/ # Resolución de Dominios y Aislamiento PostgreSQL
├── 05-cache-rendimiento/               # Caché L1 en Memoria con expiración TTL
├── 06-pos-offline-catalogo/            # Catálogos de Inventario y Cola Fuera de Línea
└── 07-base-datos-migraciones/          # Scripts DDL, Semillas de Datos y Depuración
```

---

## Resumen de Ejecución de Pruebas Automatizadas (Vitest V8)

| Módulo / Carpeta | Archivos de Prueba | Tests | Cobertura Promedio | Estado |
| :--- | :---: | :---: | :---: | :---: |
| **`01-seguridad-soap-wsdl`** | 3 suites (`soapSecurity`, `wsdlGenerator`, `xmlSecurity`) | 12 tests | 95.8% | ✅ **100% ÉXITO** |
| **`02-autenticacion-usuarios`** | 2 suites (`auth`, `authValidation`) | 11 tests | 88.4% | ✅ **100% ÉXITO** |
| **`03-api-endpoints-servidor`** | 2 suites (`apiEndpoints`, `errorHandler`) | 15 tests | 92.1% | ✅ **100% ÉXITO** |
| **`04-gestion-inquilinos-multi-tenant`** | 1 suite (`tenantResolver`) | 5 tests | 89.3% | ✅ **100% ÉXITO** |
| **`05-cache-rendimiento`** | 1 suite (`cacheService`) | 4 tests | 74.1% | ✅ **100% ÉXITO** |
| **`06-pos-offline-catalogo`** | 2 suites (`defaultProducts`, `offlineQueue`) | 7 tests | 86.9% | ✅ **100% ÉXITO** |
| **TOTAL CONSOLIDADO** | **11 Suites de Prueba** | **54 Tests** | **57.82% Global** | ✅ **100% APROBADO (0 Fallos)** |

---

## Comandos de Ejecución

- **Ejecutar la suite completa:**
  ```bash
  npm test
  ```
- **Ejecutar con reporte detallado de cobertura V8:**
  ```bash
  npm run test:coverage
  ```
- **Ejecutar un módulo específico:**
  ```bash
  npx vitest run pruebas-unitarias/01-seguridad-soap-wsdl
  ```
