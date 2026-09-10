# Task Master | Servicio POS & Facturación Multi-Tenant

Sistema de facturación electrónica y terminal POS de marca blanca con arquitectura **Multi-Tenant** (aislamiento por esquemas en PostgreSQL) y motor de servicios **SOAP 1.1** dinámicos con interfaz visual en **React + Tailwind CSS + Vite**.

---

## 📋 Requisitos Previos

- **Node.js** v18 o superior (v20+ recomendado)
- **npm** v9 o superior
- Instancia de **PostgreSQL** (local o en la nube como Neon DB)

---

## ⚙️ Configuración Inicial

### 1. Variables de Entorno

Crea o revisa el archivo `.env` en la raíz del proyecto (puedes guiarte con [.env.example](file:///c:/Users/DAARK/TaskMaster/.env.example)):

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@host/dbname?sslmode=require
```

### 2. Instalación de Dependencias

Instala los paquetes tanto del servidor backend como de la aplicación frontend:

```bash
# Dependencias del backend (raíz)
npm install

# Dependencias del frontend
cd frontend
npm install
cd ..
```

### 3. Migración y Semillado de la Base de Datos

Para inicializar las tablas maestras (`public.tenants`), los esquemas de inquilinos de prueba (`tenant_alpha`, `tenant_beta`, etc.) y las facturas iniciales:

```bash
node scripts/runSeed.js
```

---

## 🚀 Comandos para Arrancar en Local

### Modo Desarrollo (Recomendado con HMR)

Para desarrollar con recarga en vivo de cambios tanto en backend como frontend, abre dos terminales:

#### Terminal 1 — Backend (API & Motor SOAP)
```bash
# En la raíz del proyecto:
npm run dev
```
- Servidor escuchando en: `http://localhost:3000`
- Monitoreo automático de cambios con `node --watch`.

#### Terminal 2 — Frontend (Vite + React)
```bash
# Entrar a la carpeta frontend:
cd frontend
npm run dev
```
- Aplicación web disponible en: `http://localhost:5173`
- Configurado con proxy automático que redirige `/api`, `/ws` y `/health` a `http://localhost:3000`.

---

### Modo Producción / Servidor Único

Si deseas compilar la interfaz de React para que Express sirva tanto la API como el frontend estático en el puerto 3000:

```bash
# 1. Compilar frontend (genera los assets en public/)
cd frontend
npm run build
cd ..

# 2. Iniciar el servidor
npm start
```
- Todo el sistema (Frontend + Backend) quedará disponible en: `http://localhost:3000`

---

## 🔍 Endpoints del Sistema

### 1. Diagnóstico y Salud
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servicio y timestamp actual |

### 2. API REST Multi-Tenant
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/tenants` | Lista todos los tenants y sus esquemas |
| `POST` | `/api/tenants` | Aprovisiona un nuevo tenant y su esquema aislado en PostgreSQL |

**Ejemplo payload POST `/api/tenants`:**
```json
{
  "id": "mifarmacia",
  "nombre": "Farmacias Unidas",
  "brand_color": "#10B981",
  "initial_titular": "Cliente Mostrador",
  "initial_saldo": 45000.00
}
```

### 3. Servicios SOAP 1.1 por Tenant
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/ws/:tenantId?wsdl` | Contrato WSDL dinámico personalizado para el inquilino |
| `POST` | `/ws/:tenantId` | Procesamiento de peticiones SOAP XML (`ConsultarFactura`) |

---

## 🧪 Comandos de Prueba Útiles

### Probar Health Check con PowerShell / cURL
```powershell
# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/health

# cURL
curl http://localhost:3000/health
```

### Consultar WSDL de un Tenant
```powershell
curl http://localhost:3000/ws/gourmetpos?wsdl
```

### Ejecutar Petición SOAP `ConsultarFactura`
```powershell
curl -X POST http://localhost:3000/ws/gourmetpos `
  -H "Content-Type: text/xml; charset=utf-8" `
  -d "<?xml version='1.0' encoding='UTF-8'?><soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:sch='https://pos-billing.com/schema'><soapenv:Body><sch:ConsultarFacturaRequest><sch:numero_factura>FAC-1001</sch:numero_factura></sch:ConsultarFacturaRequest></soapenv:Body></soapenv:Envelope>"
```

### Ejecutar Scripts de Test Automatizados
```bash
# Pruebas integradas de clientes SOAP
node scripts/testClient.js

# Pruebas específicas para tenant
node scripts/testTys.js
```

---

## 📂 Estructura del Proyecto

```plaintext
TaskMaster/
├── frontend/               # Aplicación React 19 + Tailwind CSS + Vite
│   ├── src/
│   │   ├── components/     # Componentes (PosTerminal, NewTenantWizard, etc.)
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js      # Configuración de proxy a Express (:3000)
├── public/                 # Archivos estáticos y bundle servido por Express
├── scripts/
│   ├── runSeed.js          # Script ejecutable de inicialización
│   ├── seed.sql            # Definiciones DDL y esquemas iniciales
│   ├── testClient.js       # Script cliente de prueba SOAP
│   └── testTys.js
├── src/
│   ├── config/             # Conexión a base de datos PostgreSQL (pg Pool)
│   ├── controllers/        # Controladores SOAP y generador WSDL
│   ├── middlewares/        # Resolución de tenant y protección XXE
│   ├── routes/             # Enrutamiento Express (/ws/:tenantId)
│   ├── services/           # Lógica de base de datos aislada con search_path
│   └── server.js           # Servidor Express principal
├── .env.example            # Plantilla de variables de entorno
├── package.json            # Scripts y dependencias del backend
└── README.md               # Documentación general
```

---

## 🛡️ Seguridad y Aislamiento Multi-Tenant

- **Aislamiento por Esquema**: Cada petición resuelve el `schema_name` del tenant y ejecuta transacciones acotadas con `SET LOCAL search_path = "${schemaName}", public;` previniendo fuga de datos entre empresas.
- **Protección XXE (XML External Entity)**: Los middlewares del motor SOAP deshabilitan la resolución de entidades externas para evitar ataques a la infraestructura.
- **Caché en Memoria**: Resolución de tenants optimizada con TTL y limpieza reactiva al dar de alta nuevos negocios.
