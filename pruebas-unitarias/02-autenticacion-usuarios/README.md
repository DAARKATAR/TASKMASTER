# Módulo de Pruebas: Autenticación, JWT y Validación de Usuarios

## Propósito
Este módulo contiene las pruebas unitarias y scripts funcionales que resguardan la seguridad de los flujos de inicio de sesión, registro multi-inquilino, emisión de firmas criptográficas JWT (HMAC-SHA256) y validación de esquemas de datos de entrada en endpoints REST.

---

## Archivos de Pruebas y Scripts Incluidos

| Archivo | Tipo | Componente Evaluado | Estado Actual |
| :--- | :---: | :--- | :---: |
| `auth.test.ts` | Test Suite Vitest | `src/middlewares/auth.middleware.ts` | ✅ **ÉXITO (6/6 tests passed)** |
| `authValidation.test.ts` | Test Suite Vitest | `src/routes/authRoutes.js` | ✅ **ÉXITO (5/5 tests passed)** |
| `testAuthFlow.js` | Script de Integración | Flujo integral Login -> Token -> Me | ✅ **OPERATIVO** |
| `seedDemoUser.js` | Script de Poblado | Inicialización de credenciales demo | ✅ **OPERATIVO** |
| `initAuthTables.js` | Script DDL | Creación de tablas de autenticación | ✅ **OPERATIVO** |

---

## Desglose Detallado de Pruebas Unitarias

### Suite 1: `auth.test.ts`
- **Prueba 1:** *`signJwt` debe generar un token JWT válido con payload firmado.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 2:** *`authenticateJwt` debe permitir el acceso con token Bearer válido en la cabecera `Authorization`.*
  - **Resultado:** ✅ **ÉXITO** (Inyecta `req.user` con los datos decodificados).
- **Prueba 3:** *Rechazo con HTTP 401 si no se envía la cabecera `Authorization`.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 4:** *Rechazo con HTTP 401 si el esquema no es `Bearer <token>`.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 5:** *Rechazo con HTTP 403 si el token está firmado con una clave secreta diferente o manipulada.*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 6:** *Rechazo con HTTP 403 si el token ha expirado.*
  - **Resultado:** ✅ **ÉXITO**.

### Suite 2: `authValidation.test.ts`
- **Prueba 1:** *Rechazo de registro de comercio si `businessName` está ausente (HTTP 400).*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 2:** *Rechazo de registro si el correo electrónico posee un formato inválido (HTTP 400).*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 3:** *Rechazo de registro si la contraseña contiene menos de 6 caracteres (HTTP 400).*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 4:** *Rechazo de registro si el slug/subdominio posee caracteres especiales o espacios (HTTP 400).*
  - **Resultado:** ✅ **ÉXITO**.
- **Prueba 5:** *Rechazo de inicio de sesión con cuerpo vacío o credenciales incompletas (HTTP 400).*
  - **Resultado:** ✅ **ÉXITO**.
