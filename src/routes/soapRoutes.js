import { Router } from 'express';
import { tenantResolver } from '../middlewares/tenantResolver.js';
import { soapSecurity } from '../middlewares/soapSecurity.js';
import { handleWsdl, handleSoapAction } from '../controllers/soapController.js';

const router = Router();

// Entrega del contrato WSDL 1.1 adaptado al inquilino
router.get('/:tenantId', tenantResolver, handleWsdl);

// Ejecución de la petición SOAP con validación XXE y aislamiento de search_path
router.post('/:tenantId', tenantResolver, soapSecurity, handleSoapAction);

export default router;
