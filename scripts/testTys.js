const xmlTysRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="https://tortasysnacks.pos-billing.com/schema">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:ConsultarFacturaRequest>
      <sch:numero_factura>TYS-1001</sch:numero_factura>
    </sch:ConsultarFacturaRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

async function run() {
  const res = await fetch('http://localhost:3000/ws/tortasysnacks', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: xmlTysRequest
  });
  console.log('Status:', res.status);
  console.log(await res.text());
}

run();
