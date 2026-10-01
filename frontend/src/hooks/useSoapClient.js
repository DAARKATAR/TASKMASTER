import { useState } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Hook para la ejecución e inspección de peticiones SOAP 1.1
 */
export function useSoapClient(currentTenant) {
  const [lastResponse, setLastResponse] = useState(null);
  const [loadingSoap, setLoadingSoap] = useState(false);
  const [latency, setLatency] = useState(12);
  const [httpStatus, setHttpStatus] = useState(200);

  const executeSoapCall = async (invoiceNumber = '') => {
    if (!invoiceNumber || !currentTenant?.id) return;
    setLoadingSoap(true);
    const startTime = performance.now();
    const targetNs = `https://${currentTenant.id}.pos-billing.com/schema`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="${targetNs}">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:ConsultarFacturaRequest>
      <sch:numero_factura>${invoiceNumber}</sch:numero_factura>
    </sch:ConsultarFacturaRequest>
  </soapenv:Body>
</soapenv:Envelope>`.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/ws/${currentTenant.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `https://${currentTenant.id}.pos-billing.com/wsdl/ConsultarFactura`
        },
        body: xml
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);
      setHttpStatus(res.status);
      const responseText = await res.text();

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');
      const faultNode =
        xmlDoc.getElementsByTagNameNS('*', 'Fault')[0] || xmlDoc.getElementsByTagName('Fault')[0];

      if (faultNode || !res.ok) {
        const faultCode =
          faultNode?.getElementsByTagNameNS('*', 'faultcode')[0]?.textContent || 'soap:Fault';
        const faultString =
          faultNode?.getElementsByTagNameNS('*', 'faultstring')[0]?.textContent ||
          'Factura no encontrada';

        setLastResponse({
          raw: responseText,
          isFault: true,
          faultCode,
          faultString
        });
      } else {
        const numero_factura =
          xmlDoc.getElementsByTagNameNS('*', 'numero_factura')[0]?.textContent || invoiceNumber;
        const cliente =
          xmlDoc.getElementsByTagNameNS('*', 'cliente')[0]?.textContent || 'Cliente';
        const subtotal =
          xmlDoc.getElementsByTagNameNS('*', 'subtotal')[0]?.textContent || '0.00';
        const impuestos =
          xmlDoc.getElementsByTagNameNS('*', 'impuestos')[0]?.textContent || '0.00';
        const total = xmlDoc.getElementsByTagNameNS('*', 'total')[0]?.textContent || '0.00';
        const estado =
          xmlDoc.getElementsByTagNameNS('*', 'estado')[0]?.textContent || 'TIMBRADA / APROBADA';
        const folio_fiscal =
          xmlDoc.getElementsByTagNameNS('*', 'folio_fiscal')[0]?.textContent || '';
        const items_count =
          xmlDoc.getElementsByTagNameNS('*', 'items_count')[0]?.textContent || '1';

        const updated = {
          numero_factura,
          cliente,
          subtotal,
          impuestos,
          total,
          estado,
          folio_fiscal,
          items_count,
          emisor: currentTenant.nombre,
          raw: responseText,
          isFault: false
        };

        setLastResponse(updated);
        return updated;
      }
    } catch (err) {
      console.error('Error invocando SOAP:', err);
      setLastResponse({
        raw: `<error>${err.message}</error>`,
        isFault: true,
        faultCode: 'soap:ClientError',
        faultString: err.message
      });
    } finally {
      setLoadingSoap(false);
    }
  };

  return {
    lastResponse,
    setLastResponse,
    loadingSoap,
    latency,
    httpStatus,
    executeSoapCall
  };
}

export default useSoapClient;
