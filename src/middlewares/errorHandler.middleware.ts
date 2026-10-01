import { Request, Response, NextFunction } from 'express';
import { logError } from '../services/auditLogger.js';

function buildSoapFaultXml(faultCode: string, faultString: string, detailMessage: string): string {
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

/**
 * Middleware universal de manejo de errores con negociación de contenido (Content-Negotiation).
 * Discrimina entre peticiones REST (JSON) y peticiones SOAP (XML).
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logError(err, {
    url: req.originalUrl || req.url,
    method: req.method,
    clientIp: (req.headers['cf-connecting-ip'] as string) || req.ip
  });

  const isSoapRequest =
    (req.originalUrl && req.originalUrl.startsWith('/ws')) ||
    Boolean(req.headers['content-type'] && req.headers['content-type'].includes('xml'));

  if (isSoapRequest) {
    return res
      .status(500)
      .type('text/xml; charset=utf-8')
      .send(buildSoapFaultXml('soap:Server', 'Internal Server Error', err.message));
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Error interno del servidor',
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
}

export default globalErrorHandler;
