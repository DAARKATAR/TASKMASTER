import app from "../dist/server.js";

export default function handler(req, res) {
  // Cabeceras CORS obligatorias para peticiones cruzadas (Cloudflare -> Vercel)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, SOAPAction, x-tenant-id, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Responder de inmediato a las peticiones OPTIONS preflight para evitar el HTTP 405
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Sanitizar URLs con doble barra
  if (req.url && req.url.startsWith("//")) {
    req.url = req.url.replace(/^\/+/, "/");
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Invocation Error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}
