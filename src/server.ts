import express, { Request, Response } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import soapRoutes from './routes/soapRoutes.js';
import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './modules/tenants/tenant.routes.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { logAccess, getLogsSummary } from './services/auditLogger.js';
import { globalErrorHandler } from './middlewares/errorHandler.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Logging HTTP & Auditoría de accesos
app.use(morgan('dev'));
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logAccess({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      clientIp: (req.headers['cf-connecting-ip'] as string) || req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// 2. Parseo de cargas (XML para Web Services SOAP y JSON para API REST)
app.use(express.text({
  type: ['text/xml', 'application/xml', 'text/plain'],
  limit: '2mb'
}));
app.use(express.json());

// 3. CORS
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, SOAPAction, x-tenant-id, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 4. Endpoints base del sistema
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'TaskMaster Multi-Tenant SOAP & REST API Backend',
    status: 'online',
    version: '2.0.0 (Clean Architecture & TypeScript)',
    documentation: {
      health: '/health',
      auth: '/api/auth',
      tenants: '/api/tenants',
      soap_endpoint: '/ws/:tenantId',
      wsdl: '/ws/:tenantId?wsdl'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/logs/summary', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    logs: getLogsSummary()
  });
});

// 5. Montaje de Módulos y Rutas
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/ws', soapRoutes);

// 6. Manejador de 404 (Not Found)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 7. Manejador Global de Errores con Content-Negotiation (SOAP Fault XML vs JSON Error)
app.use(globalErrorHandler);

// 8. Inicialización del Servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[TaskMaster Engine] Servidor escuchando en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Endpoints] WSDL disponible en: http://localhost:${PORT}/ws/:tenantId?wsdl`);
    console.log(`[Endpoints] SOAP POST disponible en: http://localhost:${PORT}/ws/:tenantId`);
  });
}

export default app;
