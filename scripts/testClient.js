const xmlInvoiceRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="https://pos-billing.com/schema">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:ConsultarFacturaRequest>
      <sch:numero_factura>FAC-1001</sch:numero_factura>
    </sch:ConsultarFacturaRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

async function runTests() {
  console.log('--- TEST 1: GOURMETCLOUD POS (/ws/gourmetpos) ---');
  const resGourmet = await fetch('http://localhost:3000/ws/gourmetpos', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: xmlInvoiceRequest
  });
  console.log('Status:', resGourmet.status);
  const text1 = await resGourmet.text();
  console.log(text1.replace(/[\r\n\t]+/g, ' '));

  console.log('\n--- TEST 2: RETAILX SMART POS (/ws/retailx) ---');
  const resRetail = await fetch('http://localhost:3000/ws/retailx', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: xmlInvoiceRequest
  });
  console.log('Status:', resRetail.status);
  const text2 = await resRetail.text();
  console.log(text2.replace(/[\r\n\t]+/g, ' '));
}

runTests();
