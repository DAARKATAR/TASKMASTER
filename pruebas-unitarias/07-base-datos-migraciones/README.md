# Módulo de Pruebas: Scripts de Migración, Semillas y Base de Datos

## Propósito
Este módulo agrupa las herramientas de administración de datos, esquemas relacionales, inicialización de datos maestros (*seeds*) y procedimientos de saneamiento de base de datos para entornos de prueba y producción en PostgreSQL (Neon DB).

---

## Archivos y Scripts Incluidos

| Archivo | Tipo | Función | Estado |
| :--- | :---: | :--- | :---: |
| `inspectDb.js` | Script Node.js | Inspección de esquemas y tablas existentes | ✅ **OPERATIVO** |
| `resetDatabase.js` | Script Node.js | Recreación limpia de esquemas de prueba | ✅ **OPERATIVO** |
| `cleanTestData.js` | Script Node.js | Depuración de transacciones y datos residuales | ✅ **OPERATIVO** |
| `runSeed.js` | Script Node.js | Ejecución automatizada de datos iniciales | ✅ **OPERATIVO** |
| `seed.sql` | Script SQL DDL/DML | Sentencias SQL para poblar esquemas | ✅ **OPERATIVO** |

---

## Instrucciones de Uso

- **Inicializar base de datos:**
  ```bash
  npm run seed
  ```
- **Inspeccionar estado:**
  ```bash
  node pruebas-unitarias/07-base-datos-migraciones/inspectDb.js
  ```
- **Restablecer esquemas:**
  ```bash
  node pruebas-unitarias/07-base-datos-migraciones/resetDatabase.js
  ```
