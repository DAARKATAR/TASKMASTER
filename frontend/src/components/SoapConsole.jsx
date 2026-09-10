import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, ChevronDown, ChevronUp, FileCode, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SoapConsole({ 
  tenant, 
  onSendRequest, 
  lastResponse, 
  loading, 
  latency, 
  httpStatus 
}) {
  const [invoiceNumber, setInvoiceNumber] = useState('TYS-1001');
  const [xmlBody, setXmlBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [showWsdl, setShowWsdl] = useState(false);
  const [wsdlText, setWsdlText] = useState('Cargando WSDL...');
  const [wsdlCopied, setWsdlCopied] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    const targetNs = `https://${tenant.id}.pos-billing.com/schema`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="${targetNs}">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:ConsultarFacturaRequest>
      <sch:numero_factura>${invoiceNumber}</sch:numero_factura>
    </sch:ConsultarFacturaRequest>
  </soapenv:Body>
</soapenv:Envelope>`.trim();
    setXmlBody(xml);
  }, [tenant, invoiceNumber]);

  useEffect(() => {
    if (showWsdl && tenant) {
      fetch(`/ws/${tenant.id}?wsdl`)
        .then(r => r.text())
        .then(t => setWsdlText(t))
        .catch(err => setWsdlText(`Error cargando WSDL: ${err.message}`));
    }
  }, [showWsdl, tenant]);

  const handleCopy = () => {
    if (!lastResponse?.raw) return;
    navigator.clipboard.writeText(lastResponse.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWsdlCopy = () => {
    navigator.clipboard.writeText(wsdlText);
    setWsdlCopied(true);
    setTimeout(() => setWsdlCopied(false), 2000);
  };

  const handleExecute = () => {
    onSendRequest(xmlBody, invoiceNumber);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-flat-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 font-mono text-xs text-slate-700">
          <span className="px-2.5 py-1 rounded-lg bg-pink-600 text-white font-bold">POST</span>
          <span className="text-slate-900 font-semibold">/ws/{tenant?.id}</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">SOAPAction: "ConsultarFactura"</span>
        </div>

        {/* Facturas Semilla */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Comprobantes:</span>
          <button
            onClick={() => setInvoiceNumber('TYS-1001')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all ${
              invoiceNumber === 'TYS-1001' 
                ? 'bg-pink-600 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            TYS-1001 (Activa)
          </button>
          <button
            onClick={() => setInvoiceNumber('FAC-1001')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all ${
              invoiceNumber === 'FAC-1001' 
                ? 'bg-pink-600 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            FAC-1001 (Legacy)
          </button>
          <button
            onClick={() => setInvoiceNumber('TYS-9999')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all ${
              invoiceNumber === 'TYS-9999' 
                ? 'bg-red-600 text-white shadow-sm' 
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            }`}
          >
            TYS-9999 (Fault 404)
          </button>
        </div>
      </div>

      {/* Split Workbench: Request & Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Request Editor */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-flat-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-pink-600" />
                SOAP Request (Envelope XML)
              </span>
              <button
                onClick={() => setInvoiceNumber('TYS-1001')}
                className="text-[11px] font-semibold text-pink-600 hover:underline"
              >
                Restaurar TYS-1001
              </button>
            </div>

            <textarea
              value={xmlBody}
              onChange={(e) => setXmlBody(e.target.value)}
              className="w-full h-72 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 focus:outline-none focus:border-pink-600 focus:bg-white transition-all resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleExecute}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-pink-600 hover:bg-pink-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Consultando Factura...' : 'Ejecutar Consulta SOAP al POS'}</span>
            </button>
          </div>
        </div>

        {/* Right: Response Viewer */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-flat-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                  SOAP Response (Factura XML)
                </span>
                {httpStatus && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                    httpStatus === 200 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    HTTP {httpStatus}
                  </span>
                )}
                {latency && (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {latency} ms
                  </span>
                )}
              </div>

              <button
                onClick={handleCopy}
                disabled={!lastResponse?.raw}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <pre className="w-full h-72 bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-auto shadow-inner leading-relaxed select-text">
              <code>{lastResponse?.raw || '<!-- Haz clic en "Ejecutar Consulta" para consultar la base de datos de control interno -->'}</code>
            </pre>
          </div>

          {/* Decoded Data Banner */}
          <div className="pt-4">
            {lastResponse?.isFault ? (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <strong className="block font-bold">{lastResponse.faultCode || 'SOAP:Fault'}</strong>
                  <span>{lastResponse.faultString || 'Factura no encontrada'}</span>
                </div>
              </div>
            ) : lastResponse?.cliente ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500">FACTURA:</span>
                  <strong className="text-pink-700 block">{lastResponse.numero_factura}</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500">CLIENTE:</span>
                  <strong className="text-slate-900 truncate block font-sans">{lastResponse.cliente}</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500">TOTAL:</span>
                  <strong className="text-emerald-700 block font-bold">$ {Number(lastResponse.total).toLocaleString('es-CO')} COP</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500">ESTADO:</span>
                  <strong className="text-emerald-700 block truncate">{lastResponse.estado}</strong>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center font-mono">
                Esperando consulta de comprobante POS...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* WSDL 1.1 Accordion */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-flat-sm overflow-hidden">
        <button
          onClick={() => setShowWsdl(!showWsdl)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              WSDL 1.1
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Contrato WSDL POS: <code className="font-mono text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded">/ws/{tenant?.id}?wsdl</code>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-xs font-semibold">{showWsdl ? 'Ocultar Contrato' : 'Ver Contrato XML'}</span>
            {showWsdl ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showWsdl && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex justify-end gap-2">
              <button
                onClick={handleWsdlCopy}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shadow-sm"
              >
                {wsdlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{wsdlCopied ? '¡Copiado!' : 'Copiar WSDL'}</span>
              </button>
              <a
                href={`/ws/${tenant?.id}?wsdl`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-pink-600 text-white hover:bg-pink-700 shadow-sm"
              >
                Abrir en Pestaña ↗
              </a>
            </div>

            <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 max-h-96 overflow-auto leading-relaxed">
              <code>{wsdlText}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
