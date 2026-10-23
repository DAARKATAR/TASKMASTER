// src/server.ts
import express2 from "express";
import morgan from "morgan";
import dotenv2 from "dotenv";

// src/routes/soapRoutes.js
import { Router } from "express";

// src/config/database.ts
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error("WARNING: DATABASE_URL is not set in environment variables!");
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 1e4,
  allowExitOnIdle: true
});
pool.connect((err, client, release) => {
  if (err) {
    console.error("[DATABASE] Error conectando con el pool de Neon DB:", err.message);
  } else {
    console.log("[DATABASE] Conexi\xF3n establecida con \xE9xito con Neon PostgreSQL.");
    release();
  }
});
var database_default = pool;

// src/services/cacheService.js
var inMemoryStore = /* @__PURE__ */ new Map();
var DEFAULT_TTL_SECONDS = 300;
var upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
var upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
var hasUpstash = Boolean(upstashUrl && upstashToken);
if (hasUpstash) {
  console.log("[Cache] Upstash Redis REST habilitado y configurado.");
} else {
  console.log("[Cache] Modo Local: Utilizando cach\xE9 L1 en memoria de alta velocidad con TTL.");
}
async function getCache(key) {
  if (!key) return null;
  if (hasUpstash) {
    try {
      const response = await fetch(`${upstashUrl}/get/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${upstashToken}`
        }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.result !== null && json.result !== void 0) {
          try {
            return JSON.parse(json.result);
          } catch {
            return json.result;
          }
        }
      }
    } catch (err) {
      console.warn(`[Cache Warning] Error consultando Upstash Redis (${key}):`, err.message);
    }
  }
  const item = inMemoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    inMemoryStore.delete(key);
    return null;
  }
  return item.value;
}
async function setCache(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!key) return;
  const valueStr = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (hasUpstash) {
    try {
      await fetch(`${upstashUrl}/set/${encodeURIComponent(key)}?ex=${ttlSeconds}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ value: valueStr })
      });
    } catch (err) {
      console.warn(`[Cache Warning] Error escribiendo en Upstash Redis (${key}):`, err.message);
    }
  }
  inMemoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1e3
  });
}
async function deleteCache(key) {
  if (!key) return;
  if (hasUpstash) {
    try {
      await fetch(`${upstashUrl}/del/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`
        }
      });
    } catch (err) {
      console.warn(`[Cache Warning] Error eliminando en Upstash Redis (${key}):`, err.message);
    }
  }
  inMemoryStore.delete(key);
}

// src/services/tenantService.js
var CACHE_PREFIX = "tenant:";
var CACHE_TTL_SECONDS = 300;
async function getTenantById(tenantId) {
  if (!tenantId || typeof tenantId !== "string") {
    return null;
  }
  const normalizedId = tenantId.trim().toLowerCase();
  const cacheKey = `${CACHE_PREFIX}${normalizedId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }
  const query = `
    SELECT id, nombre, nombre AS name, schema_name, brand_color
    FROM public.tenants
    WHERE id = $1
    LIMIT 1;
  `;
  try {
    const { rows } = await database_default.query(query, [normalizedId]);
    if (rows.length === 0) {
      return null;
    }
    const tenant = rows[0];
    await setCache(cacheKey, tenant, CACHE_TTL_SECONDS);
    return tenant;
  } catch (error) {
    console.error(`Error querying tenant [${normalizedId}]:`, error.message);
    throw error;
  }
}
async function invalidateTenantCache(tenantId) {
  if (tenantId) {
    const normalizedId = tenantId.trim().toLowerCase();
    await deleteCache(`${CACHE_PREFIX}${normalizedId}`);
  }
}

// src/middlewares/tenantResolver.js
function buildSoapFaultXml(faultCode, faultString, detailMessage) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
      <detail>
        <message>${detailMessage}</message>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`.trim();
}
function extractSubdomain(host) {
  if (!host) return null;
  const cleanHost = host.split(":")[0].toLowerCase();
  if (cleanHost === "localhost" || /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
    return null;
  }
  const parts = cleanHost.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== "www" && sub !== "api" && sub !== "app") {
      return sub;
    }
  }
  return null;
}
async function tenantResolver(req, res, next) {
  try {
    let tenantId = req.params?.tenantId || req.headers["x-tenant-id"] || req.query?.tenant;
    if (!tenantId) {
      const host = req.get("host") || req.headers["x-forwarded-host"];
      tenantId = extractSubdomain(host);
    }
    if (!tenantId) {
      res.status(404).type("text/xml; charset=utf-8").send(buildSoapFaultXml(
        "soap:Client",
        "Missing Tenant Identifier",
        "Tenant identifier must be provided via URL path (/ws/:tenantId), X-Tenant-ID header, or Cloudflare subdomain."
      ));
      return;
    }
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).type("text/xml; charset=utf-8").send(buildSoapFaultXml(
        "soap:Client",
        `Tenant '${tenantId}' not found`,
        "The specified tenant does not exist or is inactive in the system."
      ));
      return;
    }
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error("Tenant resolution error:", error);
    res.status(500).type("text/xml; charset=utf-8").send(buildSoapFaultXml(
      "soap:Server",
      "Internal Tenant Resolution Error",
      "An error occurred while resolving tenant configuration."
    ));
  }
}

// src/middlewares/soapSecurity.js
import { XMLParser, XMLValidator } from "fast-xml-parser";
function buildFaultXml(faultCode, faultString, detail) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
      <detail>
        <message>${detail}</message>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`.trim();
}
var parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: false,
  // Desactiva resolución/expansión de entidades XML personalizadas
  allowBooleanAttributes: false,
  trimValues: true,
  removeNSPrefix: true
  // Remueve prefijos de namespace (soap:, tns:, etc.) de las claves
});
function soapSecurity(req, res, next) {
  const rawBody = req.body;
  if (!rawBody || typeof rawBody !== "string" || rawBody.trim() === "") {
    res.status(400).type("text/xml; charset=utf-8").send(buildFaultXml("soap:Client", "Empty SOAP Request", "The request body cannot be empty."));
    return;
  }
  if (/<!DOCTYPE/i.test(rawBody) || /<!ENTITY/i.test(rawBody)) {
    res.status(400).type("text/xml; charset=utf-8").send(buildFaultXml("soap:Client", "Security Violation: XXE Detected", "XML DTDs and External Entities are strictly prohibited."));
    return;
  }
  const validationResult = XMLValidator.validate(rawBody);
  if (validationResult !== true) {
    const errorMsg = validationResult.err ? validationResult.err.msg : "Invalid XML syntax";
    res.status(400).type("text/xml; charset=utf-8").send(buildFaultXml("soap:Client", "XML Syntax Error", errorMsg));
    return;
  }
  try {
    const parsedXml = parser.parse(rawBody);
    const envelope = parsedXml?.Envelope;
    if (!envelope || !envelope.Body) {
      res.status(400).type("text/xml; charset=utf-8").send(buildFaultXml("soap:Client", "Invalid SOAP Envelope", "Missing soap:Envelope or soap:Body."));
      return;
    }
    const body = envelope.Body;
    const bodyKeys = Object.keys(body);
    if (bodyKeys.length === 0) {
      res.status(400).type("text/xml; charset=utf-8").send(buildFaultXml("soap:Client", "Empty SOAP Body", "No operation found in SOAP Body."));
      return;
    }
    const rawAction = bodyKeys[0];
    const normalizedAction = rawAction.replace(/Request$/, "");
    const operationParams = body[rawAction] || {};
    req.soap = {
      action: normalizedAction,
      rawAction,
      params: operationParams,
      parsedEnvelope: envelope
    };
    next();
  } catch (error) {
    res.status(400).type("text/xml; charset=utf-8").send(buildFaultXml("soap:Client", "Malformed SOAP Request", error.message));
  }
}

// src/services/wsdlGenerator.js
function generateWsdl(tenant, host) {
  const tenantId = tenant.id;
  const tenantName = tenant.nombre || tenant.name || tenantId;
  const targetNamespace = `https://${tenantId}.pos-billing.com/wsdl`;
  const schemaNamespace = `https://${tenantId}.pos-billing.com/schema`;
  const endpointLocation = `http://${host}/ws/${tenantId}`;
  const cleanServiceName = tenantName.replace(/[^a-zA-Z0-9_]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="${cleanServiceName}Service"
  targetNamespace="${targetNamespace}"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:tns="${targetNamespace}"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:schema="${schemaNamespace}">

  <documentation>Servicio SOAP White-Label de Facturaci\xF3n Electr\xF3nica y POS para ${tenantName} (Tenant ID: ${tenantId})</documentation>

  <types>
    <xsd:schema targetNamespace="${schemaNamespace}" elementFormDefault="qualified">
      <xsd:element name="ConsultarFacturaRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="numero_factura" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="ConsultarFacturaResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="numero_factura" type="xsd:string"/>
            <xsd:element name="cliente" type="xsd:string"/>
            <xsd:element name="subtotal" type="xsd:float"/>
            <xsd:element name="impuestos" type="xsd:float"/>
            <xsd:element name="total" type="xsd:float"/>
            <xsd:element name="estado" type="xsd:string"/>
            <xsd:element name="folio_fiscal" type="xsd:string"/>
            <xsd:element name="items_count" type="xsd:int"/>
            <xsd:element name="emisor" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="ConsultarFacturaInput">
    <part name="parameters" element="schema:ConsultarFacturaRequest"/>
  </message>

  <message name="ConsultarFacturaOutput">
    <part name="parameters" element="schema:ConsultarFacturaResponse"/>
  </message>

  <portType name="${cleanServiceName}PortType">
    <operation name="ConsultarFactura">
      <documentation>Consulta el comprobante fiscal y estado de timbrado POS en el esquema aislado de ${tenantName}.</documentation>
      <input message="tns:ConsultarFacturaInput"/>
      <output message="tns:ConsultarFacturaOutput"/>
    </operation>
  </portType>

  <binding name="${cleanServiceName}Binding" type="tns:${cleanServiceName}PortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="ConsultarFactura">
      <soap:operation soapAction="${targetNamespace}/ConsultarFactura"/>
      <input>
        <soap:body use="literal"/>
      </input>
      <output>
        <soap:body use="literal"/>
      </output>
    </operation>
  </binding>

  <service name="${cleanServiceName}Service">
    <documentation>Servicio SOAP POS & Facturaci\xF3n de ${tenantName}</documentation>
    <port name="${cleanServiceName}Port" binding="tns:${cleanServiceName}Binding">
      <soap:address location="${endpointLocation}"/>
    </port>
  </service>
</definitions>`.trim();
}

// src/services/tenantDbClient.js
var SAFE_SCHEMA_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
async function withTenantContext(schemaName, callback) {
  if (!schemaName || typeof schemaName !== "string") {
    throw new Error("Invalid schema name: schema name must be a non-empty string.");
  }
  if (!SAFE_SCHEMA_REGEX.test(schemaName)) {
    throw new Error(`Invalid schema name format: "${schemaName}". Only alphanumeric characters and underscores are allowed.`);
  }
  const client = await database_default.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL search_path TO "${schemaName}", public;`);
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error during transaction rollback:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
}

// src/services/auditLogger.js
import fs from "fs";
import path from "path";
var LOGS_ROOT = process.env.VERCEL ? path.join("/tmp", "logs") : path.join(process.cwd(), "logs");
var betterStackToken = process.env.BETTER_STACK_SOURCE_TOKEN;
var hasBetterStack = Boolean(betterStackToken);
["audit", "access", "errors"].forEach((category) => {
  try {
    const dir = path.join(LOGS_ROOT, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
  }
});
function appendLog(category, data) {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filePath = path.join(LOGS_ROOT, category, `${category}-${today}.log`);
    const line = JSON.stringify({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...data }) + "\n";
    fs.appendFile(filePath, line, (err) => {
      if (err) console.error(`[Logger Error] No se pudo escribir en ${category}:`, err.message);
    });
  } catch (err) {
    console.error(`[Logger Exception] Fallo escribiendo log en ${category}:`, err.message);
  }
}
function logAudit({ tenantId, action, durationMs, statusCode, clientIp, metadata = {} }) {
  const entry = {
    tenant_id: tenantId || "system",
    action: action || "UNKNOWN_ACTION",
    status_code: statusCode || 200,
    duration_ms: Math.round(durationMs || 0),
    client_ip: clientIp || "unknown",
    ...metadata
  };
  console.log(`[AUDIT][${entry.tenant_id.toUpperCase()}][${entry.action}] ${entry.status_code} (${entry.duration_ms}ms) - IP: ${entry.client_ip}`);
  appendLog("audit", entry);
  if (hasBetterStack) {
    try {
      fetch("https://in.logs.betterstack.com", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${betterStackToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(entry)
      }).catch(() => {
      });
    } catch {
    }
  }
}
function logAccess({ method, url, statusCode, durationMs, clientIp, userAgent }) {
  appendLog("access", {
    method,
    url,
    status_code: statusCode,
    duration_ms: Math.round(durationMs || 0),
    client_ip: clientIp || "unknown",
    user_agent: userAgent || "unknown"
  });
}
function logError(err, context = {}) {
  console.error("[ERROR EVENT]", err.message, context);
  appendLog("errors", {
    message: err.message,
    stack: err.stack,
    ...context
  });
}
function getLogsSummary() {
  const summary = {};
  ["audit", "access", "errors"].forEach((cat) => {
    const dir = path.join(LOGS_ROOT, cat);
    if (!fs.existsSync(dir)) {
      summary[cat] = { fileCount: 0, files: [], recentEntries: [] };
      return;
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".log"));
    let recent = [];
    if (files.length > 0) {
      const latestFile = path.join(dir, files[files.length - 1]);
      try {
        const lines = fs.readFileSync(latestFile, "utf8").trim().split("\n").filter(Boolean);
        recent = lines.slice(-10).map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return l;
          }
        });
      } catch {
      }
    }
    summary[cat] = {
      fileCount: files.length,
      files,
      latestFile: files[files.length - 1] || null,
      recentEntries: recent
    };
  });
  return summary;
}

// src/controllers/soapController.js
function buildFaultXml2(faultCode, faultString, detail) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
      <detail>
        <message>${detail}</message>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`.trim();
}
function handleWsdl(req, res) {
  const startTime = Date.now();
  const tenant = req.tenant;
  const clientIp = req.headers["cf-connecting-ip"] || req.ip;
  try {
    const host = req.get("host") || `localhost:${process.env.PORT || 3e3}`;
    const wsdlXml = generateWsdl(tenant, host);
    logAudit({
      tenantId: tenant.id,
      action: "GET_WSDL_1.1",
      durationMs: Date.now() - startTime,
      statusCode: 200,
      clientIp
    });
    res.status(200).type("text/xml; charset=utf-8").send(wsdlXml);
  } catch (error) {
    console.error("Error generating WSDL:", error);
    logAudit({
      tenantId: tenant?.id || "unknown",
      action: "GET_WSDL_ERROR",
      durationMs: Date.now() - startTime,
      statusCode: 500,
      clientIp
    });
    res.status(500).type("text/xml; charset=utf-8").send(buildFaultXml2("soap:Server", "WSDL Generation Error", error.message));
  }
}
async function handleSoapAction(req, res) {
  const startTime = Date.now();
  const tenant = req.tenant;
  const { action, params } = req.soap;
  const tenantName = tenant.nombre || tenant.name || tenant.id;
  const brandColor = tenant.brand_color || "#F97316";
  const clientIp = req.headers["cf-connecting-ip"] || req.ip;
  const isQueryInvoice = action === "ConsultarFactura" || action === "ConsultarCuenta";
  if (!isQueryInvoice) {
    logAudit({
      tenantId: tenant.id,
      action: `UNSUPPORTED_${action}`,
      durationMs: Date.now() - startTime,
      statusCode: 404,
      clientIp
    });
    res.status(404).type("text/xml; charset=utf-8").send(buildFaultXml2(
      "soap:Client",
      `Unsupported Operation: ${action}`,
      `The requested operation "${action}" is not supported. Use "ConsultarFactura".`
    ));
    return;
  }
  const rawQuery = params.numero_factura || params.numeroFactura || params.id || "";
  const queryStr = String(rawQuery).trim();
  const numericId = parseInt(queryStr.replace(/\D/g, ""), 10) || 0;
  try {
    const factura = await withTenantContext(tenant.schema_name, async (client) => {
      const query = `
        SELECT id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count
        FROM facturas
        WHERE numero_factura = $1 
           OR numero_factura = $2 
           OR numero_factura = $3 
           OR id = $4
        LIMIT 1;
      `;
      const tysNum = `TYS-${numericId}`;
      const facNum = `FAC-${numericId}`;
      const { rows } = await client.query(query, [queryStr, tysNum, facNum, numericId]);
      return rows[0] || null;
    });
    if (!factura) {
      logAudit({
        tenantId: tenant.id,
        action: "CONSULTAR_FACTURA_NOT_FOUND",
        durationMs: Date.now() - startTime,
        statusCode: 404,
        clientIp,
        metadata: { query: queryStr }
      });
      res.status(404).type("text/xml; charset=utf-8").send(buildFaultXml2(
        "soap:Client",
        "Factura / Comprobante POS No Encontrado",
        `No se encontr\xF3 ninguna factura con el n\xFAmero "${queryStr}" en el tenant POS "${tenantName}".`
      ));
      return;
    }
    const targetNamespace = `https://${tenant.id}.pos-billing.com/wsdl`;
    const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${targetNamespace}">
  <soap:Header>
    <tns:FiscalBrandContext>
      <tns:emisor>${tenantName}</tns:emisor>
      <tns:tenantId>${tenant.id}</tns:tenantId>
      <tns:brandColor>${brandColor}</tns:brandColor>
      <tns:status>VALIDADA_DIAN_SAT</tns:status>
    </tns:FiscalBrandContext>
  </soap:Header>
  <soap:Body>
    <tns:ConsultarFacturaResponse>
      <tns:numero_factura>${factura.numero_factura}</tns:numero_factura>
      <tns:cliente>${factura.cliente}</tns:cliente>
      <tns:subtotal>${Number(factura.subtotal).toFixed(2)}</tns:subtotal>
      <tns:impuestos>${Number(factura.impuestos).toFixed(2)}</tns:impuestos>
      <tns:total>${Number(factura.total).toFixed(2)}</tns:total>
      <tns:estado>${factura.estado}</tns:estado>
      <tns:folio_fiscal>${factura.folio_fiscal}</tns:folio_fiscal>
      <tns:items_count>${factura.items_count || 1}</tns:items_count>
      <tns:emisor>${tenantName}</tns:emisor>
    </tns:ConsultarFacturaResponse>
  </soap:Body>
</soap:Envelope>`.trim();
    logAudit({
      tenantId: tenant.id,
      action: "CONSULTAR_FACTURA_SUCCESS",
      durationMs: Date.now() - startTime,
      statusCode: 200,
      clientIp,
      metadata: { invoice: factura.numero_factura, total: factura.total }
    });
    res.status(200).type("text/xml; charset=utf-8").send(responseXml);
  } catch (error) {
    console.error(`Error executing SOAP operation [${action}] for tenant [${tenant.id}]:`, error);
    logAudit({
      tenantId: tenant.id,
      action: "CONSULTAR_FACTURA_ERROR",
      durationMs: Date.now() - startTime,
      statusCode: 500,
      clientIp,
      metadata: { error: error.message }
    });
    res.status(500).type("text/xml; charset=utf-8").send(buildFaultXml2(
      "soap:Server",
      "Internal Database Error",
      `Error querying tenant schema "${tenant.schema_name}": ${error.message}`
    ));
  }
}

// src/routes/soapRoutes.js
var router = Router();
router.get("/:tenantId", tenantResolver, handleWsdl);
router.post("/:tenantId", tenantResolver, soapSecurity, handleSoapAction);
var soapRoutes_default = router;

// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";

// src/middlewares/auth.middleware.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "taskmaster_jwt_secret_super_secure_key_2026_prod";
function authenticateJwt(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Acceso no autorizado. Se requiere un token de sesi\xF3n v\xE1lido (Bearer Token)."
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "La sesi\xF3n ha expirado. Por favor inicie sesi\xF3n nuevamente." });
    }
    return res.status(403).json({ error: "Token de autenticaci\xF3n inv\xE1lido o manipulado." });
  }
}
function signJwt(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// src/middlewares/rateLimiter.middleware.ts
import rateLimit from "express-rate-limit";
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: process.env.NODE_ENV === "production" ? 15 : 1e3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de autenticaci\xF3n desde esta IP. Por favor espere 15 minutos antes de reintentar."
  }
});
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "L\xEDmite de peticiones excedido. Por favor reduzca la frecuencia de solicitudes."
  }
});

// src/routes/authRoutes.js
var router2 = express.Router();
router2.post("/register-tenant", authLimiter, async (req, res) => {
  const {
    businessName,
    slug,
    brandColor,
    logo,
    businessType,
    email,
    password,
    ownerName,
    activeModules
  } = req.body;
  const finalModules = Array.isArray(activeModules) && activeModules.length > 0 ? activeModules : ["pos", "inventory", "invoices", "kpis"];
  if (!businessName || !businessName.trim()) {
    return res.status(400).json({ error: "El nombre del negocio es obligatorio." });
  }
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Debe ingresar un correo electr\xF3nico v\xE1lido." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "La contrase\xF1a debe tener al menos 6 caracteres." });
  }
  const cleanEmail = email.trim().toLowerCase();
  const rawSlug = slug || businessName;
  const cleanId = rawSlug.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleanId.length < 2 || cleanId.length > 30) {
    return res.status(400).json({ error: "El identificador del negocio debe tener entre 2 y 30 caracteres alfanum\xE9ricos." });
  }
  const schemaName = `tenant_${cleanId}`;
  const color = brandColor || "#0F172A";
  const finalOwnerName = ownerName && ownerName.trim() || "Administrador";
  const finalType = businessType || "Comercio General";
  const finalLogo = logo || "\u{1F3EC}";
  const client = await database_default.connect();
  try {
    const { rows: existingUser } = await client.query(
      "SELECT id FROM public.tenant_users WHERE email = $1;",
      [cleanEmail]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Este correo electr\xF3nico ya est\xE1 registrado con otro negocio." });
    }
    const { rows: existingTenant } = await client.query(
      "SELECT id FROM public.tenants WHERE id = $1;",
      [cleanId]
    );
    if (existingTenant.length > 0) {
      return res.status(400).json({ error: `El identificador de negocio "${cleanId}" ya se encuentra en uso. Elige otro nombre o slug.` });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query("BEGIN");
    await client.query(`
      INSERT INTO public.tenants (id, nombre, schema_name, brand_color, business_type, logo, active_modules)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [cleanId, businessName.trim(), schemaName, color, finalType, finalLogo, JSON.stringify(finalModules)]);
    await client.query(`
      INSERT INTO public.tenant_users (email, tenant_id)
      VALUES ($1, $2);
    `, [cleanEmail, cleanId]);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".facturas (
        id SERIAL PRIMARY KEY,
        numero_factura VARCHAR(50) NOT NULL UNIQUE,
        cliente VARCHAR(150) NOT NULL,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        impuestos NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        estado VARCHAR(50) NOT NULL DEFAULT 'TIMBRADA / APROBADA',
        folio_fiscal VARCHAR(100) NOT NULL,
        items_count INT DEFAULT 1,
        metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Detalle de l\xEDneas de producto por factura
      CREATE TABLE IF NOT EXISTS "${schemaName}".factura_detalles (
        id SERIAL PRIMARY KEY,
        factura_id INT NOT NULL REFERENCES "${schemaName}".facturas(id) ON DELETE CASCADE,
        producto_id INT,
        nombre_producto VARCHAR(150) NOT NULL,
        cantidad INT NOT NULL DEFAULT 1,
        precio_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
      );

      -- Cat\xE1logo e inventario real de productos
      CREATE TABLE IF NOT EXISTS "${schemaName}".productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        precio NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        rubro VARCHAR(100) NOT NULL DEFAULT 'General',
        emoji VARCHAR(20) DEFAULT '\u{1F4E6}',
        descripcion TEXT,
        stock INT NOT NULL DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const { rows: userRows } = await client.query(`
      INSERT INTO "${schemaName}".usuarios (email, password_hash, nombre, role)
      VALUES ($1, $2, $3, 'admin')
      RETURNING id, email, nombre, role, created_at;
    `, [cleanEmail, passwordHash, finalOwnerName]);
    await client.query("COMMIT");
    const createdUser = userRows[0];
    const tenantData = {
      id: cleanId,
      nombre: businessName.trim(),
      schema_name: schemaName,
      brand_color: color,
      business_type: finalType,
      logo: finalLogo,
      active_modules: finalModules
    };
    const token = signJwt({
      userId: createdUser.id,
      email: createdUser.email,
      nombre: createdUser.nombre,
      role: createdUser.role,
      tenantId: cleanId,
      schemaName
    });
    logAudit({
      tenantId: cleanId,
      action: "TENANT_REGISTERED",
      statusCode: 201,
      durationMs: 0,
      clientIp: req.headers["cf-connecting-ip"] || req.ip,
      metadata: { email: cleanEmail, businessName }
    });
    res.status(201).json({
      success: true,
      message: `Negocio "${businessName}" y usuario administrador creados con \xE9xito.`,
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        nombre: createdUser.nombre,
        role: createdUser.role
      },
      tenant: tenantData
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[Register Error]", err);
    res.status(500).json({ error: `Error creando el negocio: ${err.message}` });
  } finally {
    client.release();
  }
});
router2.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "El correo electr\xF3nico y la contrase\xF1a son obligatorios." });
  }
  const cleanEmail = email.trim().toLowerCase();
  const client = await database_default.connect();
  try {
    console.log(`[Auth Login] \u{1F4E5} Nueva petici\xF3n de inicio de sesi\xF3n para: "${cleanEmail}"`);
    console.log(`[Auth Login] \u{1F50D} Consultando mapeo en tabla central "public.tenant_users"...`);
    let { rows: mappingRows } = await client.query(
      "SELECT tenant_id FROM public.tenant_users WHERE email = $1;",
      [cleanEmail]
    );
    let tenantId = mappingRows[0]?.tenant_id;
    if (!tenantId) {
      console.log(`[Auth Login] \u26A0\uFE0F Usuario no encontrado en "public.tenant_users". Buscando en esquemas de tenants...`);
      const { rows: allTenants } = await client.query(
        "SELECT id, schema_name FROM public.tenants;"
      );
      for (const t of allTenants) {
        try {
          const { rows: checkUser } = await client.query(`
            SELECT id FROM "${t.schema_name}".usuarios WHERE email = $1;
          `, [cleanEmail]);
          if (checkUser.length > 0) {
            tenantId = t.id;
            console.log(`[Auth Login] \u{1F4A1} Usuario localizado en esquema "${t.schema_name}" (${t.id}). Auto-registrando en "public.tenant_users"...`);
            await client.query(`
              INSERT INTO public.tenant_users (email, tenant_id)
              VALUES ($1, $2)
              ON CONFLICT (email) DO UPDATE SET tenant_id = $2;
            `, [cleanEmail, tenantId]);
            break;
          }
        } catch (schemaErr) {
        }
      }
    }
    if (!tenantId) {
      console.log(`[Auth Login] \u274C Usuario "${cleanEmail}" no encontrado en la base de datos.`);
      return res.status(401).json({ error: "Credenciales inv\xE1lidas. Usuario no registrado en ning\xFAn negocio." });
    }
    console.log(`[Auth Login] \u{1F3E2} Tenant identificado: "${tenantId}". Consultando datos del inquilino...`);
    const { rows: tenantRows } = await client.query(
      "SELECT id, nombre, schema_name, brand_color, business_type, logo, active_modules FROM public.tenants WHERE id = $1;",
      [tenantId]
    );
    if (tenantRows.length === 0) {
      console.log(`[Auth Login] \u274C El negocio "${tenantId}" no est\xE1 activo.`);
      return res.status(401).json({ error: "El negocio asociado a este usuario no se encuentra activo." });
    }
    const tenant = tenantRows[0];
    console.log(`[Auth Login] \u{1F510} Verificando credenciales en "${tenant.schema_name}".usuarios...`);
    const { rows: userRows } = await client.query(`
      SELECT id, email, password_hash, nombre, role, activo 
      FROM "${tenant.schema_name}".usuarios 
      WHERE email = $1;
    `, [cleanEmail]);
    if (userRows.length === 0) {
      console.log(`[Auth Login] \u274C El usuario no existe en la tabla "${tenant.schema_name}".usuarios.`);
      return res.status(401).json({ error: "Credenciales inv\xE1lidas." });
    }
    const user = userRows[0];
    if (!user.activo) {
      console.log(`[Auth Login] \u26A0\uFE0F Cuenta desactivada para: "${cleanEmail}".`);
      return res.status(403).json({ error: "Esta cuenta de usuario ha sido desactivada." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`[Auth Login] \u274C Contrase\xF1a incorrecta para: "${cleanEmail}".`);
      return res.status(401).json({ error: "Credenciales inv\xE1lidas. Contrase\xF1a incorrecta." });
    }
    console.log(`[Auth Login] \u2705 Contrase\xF1a v\xE1lida para: "${cleanEmail}". Generando token JWT...`);
    const token = signJwt({
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      tenantId: tenant.id,
      schemaName: tenant.schema_name
    });
    logAudit({
      tenantId: tenant.id,
      action: "LOGIN_SUCCESS",
      statusCode: 200,
      durationMs: 0,
      clientIp: req.headers["cf-connecting-ip"] || req.ip,
      metadata: { email: cleanEmail }
    });
    res.json({
      success: true,
      message: "Inicio de sesi\xF3n exitoso.",
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        name: user.nombre || (user.email ? user.email.split("@")[0] : "Usuario"),
        role: user.role
      },
      tenant
    });
  } catch (err) {
    console.error("[Login Error]", err);
    res.status(500).json({ error: `Error en la autenticaci\xF3n: ${err.message}` });
  } finally {
    client.release();
  }
});
router2.get("/me", authenticateJwt, async (req, res) => {
  const { tenantId, email } = req.user;
  const client = await database_default.connect();
  try {
    const { rows: tenantRows } = await client.query(
      "SELECT id, nombre, schema_name, brand_color, business_type, logo, active_modules FROM public.tenants WHERE id = $1;",
      [tenantId]
    );
    if (tenantRows.length === 0) {
      return res.status(404).json({ error: "Inquilino no encontrado." });
    }
    const tenant = tenantRows[0];
    const { rows: userRows } = await client.query(`
      SELECT id, email, nombre, role, created_at 
      FROM "${tenant.schema_name}".usuarios 
      WHERE email = $1;
    `, [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado en el inquilino." });
    }
    const dbUser = userRows[0];
    res.json({
      success: true,
      user: {
        ...dbUser,
        name: dbUser.nombre || (dbUser.email ? dbUser.email.split("@")[0] : "Usuario")
      },
      tenant
    });
  } catch (err) {
    console.error("[Me Error]", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
var authRoutes_default = router2;

// src/modules/tenants/tenant.routes.ts
import { Router as Router2 } from "express";

// src/modules/tenants/tenant.provisioner.ts
var SAFE_SLUG_REGEX = /^[a-z0-9_]{2,30}$/;
async function provisionTenant(dto) {
  const cleanId = String(dto.id).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!SAFE_SLUG_REGEX.test(cleanId)) {
    throw new Error("El identificador del tenant debe tener entre 2 y 30 caracteres alfanum\xE9ricos.");
  }
  const schemaName = `tenant_${cleanId}`;
  const titular = dto.initialTitular || `Administrador de ${dto.nombre}`;
  const brandColor = dto.brandColor || "#4F46E5";
  const saldo = Number(dto.initialSaldo) || 5e4;
  const activeModules = dto.activeModules || ["pos", "inventory", "invoices", "kpis"];
  const client = await database_default.connect();
  try {
    await client.query("BEGIN");
    const bType = dto.businessType || "Comercio General";
    const bLogo = dto.logo || "\u{1F3EC}";
    await client.query(`
      INSERT INTO public.tenants (id, nombre, schema_name, brand_color, business_type, logo, active_modules)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE
      SET nombre = EXCLUDED.nombre,
          schema_name = EXCLUDED.schema_name,
          brand_color = EXCLUDED.brand_color,
          business_type = EXCLUDED.business_type,
          logo = EXCLUDED.logo,
          active_modules = EXCLUDED.active_modules;
    `, [cleanId, dto.nombre, schemaName, brandColor, bType, bLogo, JSON.stringify(activeModules)]);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".facturas (
        id SERIAL PRIMARY KEY,
        numero_factura VARCHAR(50) NOT NULL UNIQUE,
        cliente VARCHAR(150) NOT NULL,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        impuestos NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        estado VARCHAR(50) NOT NULL DEFAULT 'TIMBRADA / APROBADA',
        folio_fiscal VARCHAR(100) NOT NULL,
        items_count INT DEFAULT 1,
        metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "${schemaName}".factura_detalles (
        id SERIAL PRIMARY KEY,
        factura_id INT NOT NULL REFERENCES "${schemaName}".facturas(id) ON DELETE CASCADE,
        producto_id INT,
        nombre_producto VARCHAR(150) NOT NULL,
        cantidad INT NOT NULL DEFAULT 1,
        precio_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
      );

      CREATE TABLE IF NOT EXISTS "${schemaName}".productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        precio NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        rubro VARCHAR(100) NOT NULL DEFAULT 'General',
        emoji VARCHAR(20) DEFAULT '\u{1F4E6}',
        descripcion TEXT,
        stock INT NOT NULL DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "${schemaName}".usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "${schemaName}".cuentas (
        id SERIAL PRIMARY KEY,
        numero_cuenta VARCHAR(50) NOT NULL UNIQUE,
        titular VARCHAR(150) NOT NULL,
        saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        moneda VARCHAR(10) NOT NULL DEFAULT 'COP',
        tipo_cuenta VARCHAR(50) NOT NULL DEFAULT 'Corriente POS',
        activa BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      INSERT INTO "${schemaName}".cuentas (numero_cuenta, titular, saldo, moneda, tipo_cuenta, activa)
      VALUES ($1, $2, $3, 'COP', 'Terminal POS Principal', TRUE)
      ON CONFLICT (numero_cuenta) DO NOTHING;
    `, [`CTA-${cleanId.toUpperCase()}-001`, titular, saldo]);
    await client.query("COMMIT");
    invalidateTenantCache(cleanId);
    return {
      id: cleanId,
      nombre: dto.nombre,
      name: dto.nombre,
      schema_name: schemaName,
      brand_color: brandColor,
      active_modules: activeModules,
      logo: bLogo,
      business_type: bType
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// src/modules/tenants/tenant.controller.ts
async function listTenants(req, res, next) {
  try {
    const { rows } = await database_default.query(
      "SELECT id, nombre, nombre AS name, schema_name, brand_color, business_type, logo, active_modules FROM public.tenants ORDER BY id ASC"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}
async function createTenant(req, res, next) {
  try {
    const { id, nombre, brand_color, business_type, logo, initial_titular, initial_saldo, active_modules } = req.body;
    if (!id || !nombre) {
      return res.status(400).json({ error: "El identificador (slug) y el nombre de la empresa son obligatorios." });
    }
    const tenant = await provisionTenant({
      id,
      nombre,
      brandColor: brand_color,
      businessType: business_type,
      logo,
      initialTitular: initial_titular,
      initialSaldo: parseFloat(initial_saldo) || 5e4,
      activeModules: Array.isArray(active_modules) ? active_modules : ["pos", "inventory", "invoices", "kpis"]
    });
    res.status(201).json({
      success: true,
      message: `Tenant "${nombre}" aprovisionado con \xE9xito.`,
      tenant
    });
  } catch (error) {
    next(error);
  }
}
async function updateTenantModules(req, res, next) {
  const { tenantId } = req.params;
  const { active_modules } = req.body;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!Array.isArray(active_modules) || active_modules.length === 0) {
    return res.status(400).json({ error: "Debes seleccionar al menos un m\xF3dulo activo para tu negocio." });
  }
  try {
    const { rowCount } = await database_default.query(
      "UPDATE public.tenants SET active_modules = $1 WHERE id = $2",
      [JSON.stringify(active_modules), cleanId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "Negocio no encontrado." });
    }
    res.json({
      success: true,
      message: "M\xF3dulos actualizados con \xE9xito.",
      active_modules
    });
  } catch (error) {
    next(error);
  }
}
async function getTenantMetrics(req, res, next) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  try {
    const { rows: aggRows } = await database_default.query(`
      SELECT 
        COALESCE(SUM(total), 0) AS total_ventas,
        COUNT(*)::int AS total_comprobantes,
        COALESCE(AVG(total), 0) AS ticket_promedio,
        COALESCE(SUM(impuestos), 0) AS total_iva
      FROM "${schemaName}".facturas
    `);
    const { rows: paymentRows } = await database_default.query(`
      SELECT 
        COALESCE(metodo_pago, 'Efectivo') AS metodo,
        COUNT(*)::int AS transacciones,
        COALESCE(SUM(total), 0) AS total
      FROM "${schemaName}".facturas
      GROUP BY metodo_pago
      ORDER BY total DESC
    `);
    const { rows: dailyRows } = await database_default.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS dia,
        TO_CHAR(created_at, 'Dy DD Mon') AS label,
        COUNT(*)::int AS transacciones,
        COALESCE(SUM(total), 0) AS total
      FROM "${schemaName}".facturas
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), TO_CHAR(created_at, 'Dy DD Mon')
      ORDER BY dia ASC
      LIMIT 14
    `);
    const summary = aggRows[0];
    res.json({
      total_ventas: parseFloat(summary.total_ventas),
      total_comprobantes: summary.total_comprobantes,
      ticket_promedio: Math.round(parseFloat(summary.ticket_promedio)),
      total_iva: parseFloat(summary.total_iva),
      desglose_pagos: paymentRows.map((r) => ({
        metodo: r.metodo,
        transacciones: r.transacciones,
        total: parseFloat(r.total)
      })),
      ventas_por_dia: dailyRows.map((r) => ({
        dia: r.dia,
        label: r.label,
        transacciones: r.transacciones,
        total: parseFloat(r.total)
      }))
    });
  } catch (error) {
    next(error);
  }
}

// src/modules/products/product.controller.ts
var productsCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 60 * 1e3;
function invalidateProductsCache(tenantId) {
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  productsCache.delete(cleanId);
}
async function listProducts(req, res, next) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  const cached = productsCache.get(cleanId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("X-Cache-TTL", Math.round((cached.expiresAt - now) / 1e3));
    return res.json(cached.data);
  }
  try {
    const products = await withTenantContext(schemaName, async (client) => {
      const { rows } = await client.query(`
        SELECT id, nombre, precio, rubro, emoji, descripcion, stock, created_at
        FROM productos
        ORDER BY id ASC
      `);
      return rows;
    });
    productsCache.set(cleanId, {
      data: products,
      expiresAt: now + CACHE_TTL_MS
    });
    res.setHeader("X-Cache", "MISS");
    res.json(products);
  } catch (error) {
    next(error);
  }
}
async function createProduct(req, res, next) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  const { nombre, precio, rubro, emoji, stock, descripcion } = req.body;
  if (!nombre || precio === void 0) {
    return res.status(400).json({ error: "El nombre y el precio del producto son obligatorios." });
  }
  try {
    const product = await withTenantContext(schemaName, async (client) => {
      const { rows } = await client.query(`
        INSERT INTO productos (nombre, precio, rubro, emoji, stock, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [
        nombre.trim(),
        parseFloat(precio) || 0,
        (rubro || "General").trim(),
        (emoji || "\u{1F4E6}").trim(),
        parseInt(stock, 10) || 50,
        (descripcion || "").trim()
      ]);
      return rows[0];
    });
    invalidateProductsCache(cleanId);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}
async function updateProduct(req, res, next) {
  const { tenantId, productId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  const prodId = parseInt(String(productId), 10);
  if (!prodId) {
    return res.status(400).json({ error: "ID de producto inv\xE1lido" });
  }
  const { stock, precio, nombre, rubro, emoji, descripcion } = req.body;
  try {
    const updated = await withTenantContext(schemaName, async (client) => {
      const fields = [];
      const values = [];
      let idx = 1;
      if (stock !== void 0) {
        fields.push(`stock = $${idx++}`);
        values.push(Math.max(0, parseInt(String(stock), 10) || 0));
      }
      if (precio !== void 0) {
        fields.push(`precio = $${idx++}`);
        values.push(parseFloat(String(precio)) || 0);
      }
      if (nombre !== void 0) {
        fields.push(`nombre = $${idx++}`);
        values.push(String(nombre).trim());
      }
      if (rubro !== void 0) {
        fields.push(`rubro = $${idx++}`);
        values.push(String(rubro).trim());
      }
      if (emoji !== void 0) {
        fields.push(`emoji = $${idx++}`);
        values.push(String(emoji).trim());
      }
      if (descripcion !== void 0) {
        fields.push(`descripcion = $${idx++}`);
        values.push(String(descripcion).trim());
      }
      if (fields.length === 0) return null;
      values.push(prodId);
      const query = `
        UPDATE productos 
        SET ${fields.join(", ")} 
        WHERE id = $${idx} 
        RETURNING *;
      `;
      const { rows } = await client.query(query, values);
      return rows[0] || null;
    });
    if (!updated) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    invalidateProductsCache(cleanId);
    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
}
async function deleteProduct(req, res, next) {
  const { tenantId, productId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  const prodId = parseInt(String(productId), 10);
  if (!prodId) {
    return res.status(400).json({ error: "ID de producto inv\xE1lido" });
  }
  try {
    await withTenantContext(schemaName, async (client) => {
      await client.query("DELETE FROM productos WHERE id = $1", [prodId]);
    });
    invalidateProductsCache(cleanId);
    res.json({ success: true, message: "Producto eliminado exitosamente" });
  } catch (error) {
    next(error);
  }
}

// src/modules/invoices/invoice.controller.ts
async function listInvoices(req, res, next) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"), 10)));
  const offset = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : null;
  const wantsPaginatedWrapper = req.query.paginated === "true";
  try {
    const { rows, total } = await withTenantContext(schemaName, async (client) => {
      let countQuery = "SELECT COUNT(*)::int AS total FROM facturas";
      let dataQuery = `
        SELECT id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count, metodo_pago, created_at
        FROM facturas
      `;
      const queryParams = [];
      if (search) {
        countQuery += " WHERE cliente ILIKE $1 OR numero_factura ILIKE $1";
        dataQuery += " WHERE cliente ILIKE $1 OR numero_factura ILIKE $1";
        queryParams.push(`%${search}%`);
      }
      dataQuery += ` ORDER BY id DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      const dataParams = [...queryParams, limit, offset];
      const countRes = await client.query(countQuery, queryParams);
      const dataRes = await client.query(dataQuery, dataParams);
      return {
        rows: dataRes.rows,
        total: countRes.rows[0]?.total || 0
      };
    });
    const totalPages = Math.ceil(total / limit) || 1;
    res.setHeader("X-Total-Count", total);
    res.setHeader("X-Page", page);
    res.setHeader("X-Limit", limit);
    res.setHeader("X-Total-Pages", totalPages);
    if (wantsPaginatedWrapper) {
      return res.json({
        invoices: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
    }
    res.json(rows);
  } catch (error) {
    next(error);
  }
}
async function getInvoiceDetails(req, res, next) {
  const { tenantId, invoiceId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  try {
    const details = await withTenantContext(schemaName, async (client) => {
      const { rows } = await client.query(`
        SELECT id, factura_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal
        FROM factura_detalles
        WHERE factura_id = $1
        ORDER BY id ASC
      `, [invoiceId]);
      return rows;
    });
    res.json(details);
  } catch (error) {
    next(error);
  }
}
async function createInvoice(req, res, next) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const schemaName = `tenant_${cleanId}`;
  const { cliente, subtotal, impuestos, total, items_count, metodo_pago, items } = req.body;
  const clientName = (cliente || "Cliente General").trim();
  const subtotalNum = parseFloat(String(subtotal)) || 0;
  const impuestosNum = parseFloat(String(impuestos)) || 0;
  const totalNum = parseFloat(String(total)) || subtotalNum + impuestosNum;
  const itemsCount = parseInt(String(items_count), 10) || (Array.isArray(items) ? items.reduce((acc, i) => acc + (i.qty || 1), 0) : 1);
  const paymentMethod = (metodo_pago || "Efectivo").trim();
  try {
    const invoice = await withTenantContext(schemaName, async (client) => {
      const countRes = await client.query("SELECT COALESCE(MAX(id), 1000) + 1 AS next_id FROM facturas");
      const nextId = countRes.rows[0].next_id;
      const prefix = cleanId === "tortasysnacks" ? "REC" : "FAC";
      const numeroFactura = `${prefix}-${nextId}`;
      const cufe = `CUFE-${cleanId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const insertRes = await client.query(`
        INSERT INTO facturas (id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count, metodo_pago, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'TIMBRADA / APROBADA', $7, $8, $9, NOW())
        RETURNING *;
      `, [nextId, numeroFactura, clientName, subtotalNum, impuestosNum, totalNum, cufe, itemsCount, paymentMethod]);
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const itemQty = parseInt(String(item.qty || item.cantidad || 1), 10);
          const itemPrice = parseFloat(String(item.price || item.precio || 0));
          const itemSubtotal = itemPrice * itemQty;
          const itemName = (item.name || item.nombre || "Art\xEDculo POS").trim();
          const prodId = item.id && Number.isInteger(Number(item.id)) ? Number(item.id) : null;
          await client.query(`
            INSERT INTO factura_detalles (factura_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
            VALUES ($1, $2, $3, $4, $5, $6);
          `, [nextId, prodId, itemName, itemQty, itemPrice, itemSubtotal]);
          if (prodId) {
            await client.query(`
              UPDATE productos 
              SET stock = GREATEST(0, stock - $1)
              WHERE id = $2;
            `, [itemQty, prodId]);
          }
        }
      }
      return insertRes.rows[0];
    });
    invalidateProductsCache(cleanId);
    res.status(201).json({
      success: true,
      message: "Venta registrada, inventario actualizado y comprobante emitido exitosamente",
      invoice
    });
  } catch (error) {
    next(error);
  }
}

// src/modules/tenants/tenant.routes.ts
var router3 = Router2();
router3.get("/", listTenants);
router3.post("/", createTenant);
router3.patch("/:tenantId/modules", updateTenantModules);
router3.put("/:tenantId/modules", updateTenantModules);
router3.get("/:tenantId/products", listProducts);
router3.post("/:tenantId/products", createProduct);
router3.patch("/:tenantId/products/:productId", updateProduct);
router3.put("/:tenantId/products/:productId", updateProduct);
router3.delete("/:tenantId/products/:productId", deleteProduct);
router3.get("/:tenantId/invoices", listInvoices);
router3.post("/:tenantId/invoices", createInvoice);
router3.get("/:tenantId/invoices/:invoiceId/details", getInvoiceDetails);
router3.get("/:tenantId/metrics", getTenantMetrics);
var tenant_routes_default = router3;

// src/middlewares/errorHandler.middleware.ts
function buildSoapFaultXml2(faultCode, faultString, detailMessage) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
      <detail>
        <message>${detailMessage}</message>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`.trim();
}
function globalErrorHandler(err, req, res, next) {
  logError(err, {
    url: req.originalUrl || req.url,
    method: req.method,
    clientIp: req.headers["cf-connecting-ip"] || req.ip
  });
  const isSoapRequest = req.originalUrl && req.originalUrl.startsWith("/ws") || Boolean(req.headers["content-type"] && req.headers["content-type"].includes("xml"));
  if (isSoapRequest) {
    return res.status(500).type("text/xml; charset=utf-8").send(buildSoapFaultXml2("soap:Server", "Internal Server Error", err.message));
  }
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Error interno del servidor",
      code: err.code || "INTERNAL_ERROR",
      ...process.env.NODE_ENV !== "production" && { stack: err.stack }
    }
  });
}

// src/server.ts
dotenv2.config();
var app = express2();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, SOAPAction, x-tenant-id, Authorization");
  res.header("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
var PORT = process.env.PORT || 3e3;
app.use(morgan("dev"));
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logAccess({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      clientIp: req.headers["cf-connecting-ip"] || req.ip,
      userAgent: req.get("user-agent")
    });
  });
  next();
});
app.use(express2.text({
  type: ["text/xml", "application/xml", "text/plain"],
  limit: "2mb"
}));
app.use(express2.json());
app.get(["/", "/api"], (req, res) => {
  res.json({
    service: "TaskMaster Multi-Tenant SOAP & REST API Backend",
    status: "online",
    version: "2.0.0 (Clean Architecture & TypeScript)",
    documentation: {
      health: "/health",
      auth: "/api/auth",
      tenants: "/api/tenants",
      soap_endpoint: "/ws/:tenantId",
      wsdl: "/ws/:tenantId?wsdl"
    }
  });
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/logs/summary", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    logs: getLogsSummary()
  });
});
app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes_default);
app.use("/api/tenants", tenant_routes_default);
app.use("/ws", soapRoutes_default);
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});
app.use(globalErrorHandler);
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[TaskMaster Engine] Servidor escuchando en el puerto ${PORT} en modo ${process.env.NODE_ENV || "development"}`);
    console.log(`[Endpoints] WSDL disponible en: http://localhost:${PORT}/ws/:tenantId?wsdl`);
    console.log(`[Endpoints] SOAP POST disponible en: http://localhost:${PORT}/ws/:tenantId`);
  });
}
var server_default = app;
export {
  server_default as default
};
