// Estado global de la aplicación
let tenants = [];
let activeTenant = null;
let lastResponseXml = '';

// Elementos del DOM
const brandTitle = document.getElementById('brandTitle');
const brandSubtitle = document.getElementById('brandSubtitle');
const brandLogo = document.getElementById('brandLogo');
const tenantChipsContainer = document.getElementById('tenantChipsContainer');
const currentEndpointUrl = document.getElementById('currentEndpointUrl');
const inputAccountId = document.getElementById('inputAccountId');
const xmlRequestEditor = document.getElementById('xmlRequestEditor');
const btnSendSoap = document.getElementById('btnSendSoap');
const btnResetXml = document.getElementById('btnResetXml');
const statusBadge = document.getElementById('statusBadge');
const latencyIndicator = document.getElementById('latencyIndicator');

// Vistas de respuesta
const emptyResponseState = document.getElementById('emptyResponseState');
const accountCard = document.getElementById('accountCard');
const faultCard = document.getElementById('faultCard');
const visualCardView = document.getElementById('visualCardView');
const rawXmlView = document.getElementById('rawXmlView');
const rawXmlCode = document.getElementById('rawXmlCode');
const viewCardBtn = document.getElementById('viewCardBtn');
const viewRawBtn = document.getElementById('viewRawBtn');
const btnCopyResponse = document.getElementById('btnCopyResponse');

// Elementos de la tarjeta de cuenta
const cardBrandFlag = document.getElementById('cardBrandFlag');
const cardAccountId = document.getElementById('cardAccountId');
const cardBalance = document.getElementById('cardBalance');
const cardHolder = document.getElementById('cardHolder');
const cardIssuer = document.getElementById('cardIssuer');
const cardSchemaTag = document.getElementById('cardSchemaTag');

// Elementos de error
const faultTitle = document.getElementById('faultTitle');
const faultMessage = document.getElementById('faultMessage');
const faultDetail = document.getElementById('faultDetail');

// Elementos WSDL
const wsdlFullUrl = document.getElementById('wsdlFullUrl');
const wsdlCodeDisplay = document.getElementById('wsdlCodeDisplay');
const btnCopyWsdl = document.getElementById('btnCopyWsdl');
const btnOpenWsdl = document.getElementById('btnOpenWsdl');

// Tabla de arquitectura
const tenantsTableBody = document.getElementById('tenantsTableBody');

/**
 * Convierte un color HEX a valores RGB.
 */
function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Aplica el branding y color de marca dinámico del inquilino seleccionado.
 */
function applyTenantTheme(tenant) {
  activeTenant = tenant;
  const color = tenant.brand_color || '#004488';
  const rgb = hexToRgb(color);

  // Actualizar variables CSS en el root
  document.documentElement.style.setProperty('--brand-primary', color);
  document.documentElement.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  document.documentElement.style.setProperty('--brand-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);

  // Actualizar textos e identidades
  const tenantName = tenant.nombre || tenant.name;
  brandTitle.textContent = tenantName;
  brandSubtitle.textContent = `Aislamiento en esquema "${tenant.schema_name}" | Tenant ID: ${tenant.id}`;
  
  // Iniciales del logo
  const initials = tenantName.split(' ').map(w => w[0]).slice(0, 2).join('');
  brandLogo.textContent = initials || tenant.id.toUpperCase();

  // Actualizar URL de endpoint en UI
  currentEndpointUrl.textContent = `/ws/${tenant.id}`;
  
  // Actualizar enlace WSDL
  const wsdlUrl = `${window.location.origin}/ws/${tenant.id}?wsdl`;
  wsdlFullUrl.textContent = wsdlUrl;
  btnOpenWsdl.href = `/ws/${tenant.id}?wsdl`;

  // Actualizar chips de selección
  document.querySelectorAll('.tenant-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.id === tenant.id);
  });

  // Regenerar plantilla XML de petición
  generateXmlTemplate();

  // Recargar WSDL si la pestaña está visible
  if (document.getElementById('panelWsdl').classList.contains('active')) {
    loadWsdl();
  }
}

/**
 * Genera el cuerpo XML del SOAP Envelope para la petición.
 */
function generateXmlTemplate() {
  if (!activeTenant) return;
  const accountId = inputAccountId.value || 1001;
  const targetNamespace = `https://${activeTenant.id}.servicios.com/schema`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="${targetNamespace}">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:ConsultarCuentaRequest>
      <sch:id>${accountId}</sch:id>
    </sch:ConsultarCuentaRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  xmlRequestEditor.value = xml.trim();
}

/**
 * Carga los tenants desde la API backend.
 * @param {string} [preferredId] - ID del tenant a seleccionar prioritariamente
 */
async function loadTenants(preferredId) {
  try {
    const res = await fetch('/api/tenants');
    tenants = await res.json();

    tenantChipsContainer.innerHTML = '';
    tenantsTableBody.innerHTML = '';

    tenants.forEach((tenant) => {
      // Chip selector
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tenant-chip';
      chip.dataset.id = tenant.id;
      chip.style.setProperty('--chip-color', tenant.brand_color);

      chip.innerHTML = `
        <span class="chip-dot" style="background-color: ${tenant.brand_color};"></span>
        <span>${tenant.nombre || tenant.name}</span>
      `;

      chip.addEventListener('click', () => applyTenantTheme(tenant));
      tenantChipsContainer.appendChild(chip);

      // Fila en tabla de arquitectura
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><code>${tenant.id}</code></td>
        <td><strong>${tenant.nombre || tenant.name}</strong></td>
        <td><span class="schema-tag">${tenant.schema_name}</span></td>
        <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${tenant.brand_color};margin-right:6px;"></span>${tenant.brand_color}</td>
      `;
      tenantsTableBody.appendChild(row);
    });

    if (tenants.length > 0) {
      // Priorizar el tenant solicitado, o NexusPay por defecto, o el primero
      let initialTenant = tenants[0];
      if (preferredId) {
        initialTenant = tenants.find(t => t.id === preferredId) || initialTenant;
      } else {
        const nexus = tenants.find(t => t.id === 'nexuspay');
        if (nexus) initialTenant = nexus;
      }
      applyTenantTheme(initialTenant);
    }
  } catch (error) {
    console.error('Error cargando inquilinos:', error);
  }
}

/**
 * Ejecuta la llamada SOAP POST contra el backend.
 */
async function sendSoapRequest() {
  if (!activeTenant) return;

  const xmlBody = xmlRequestEditor.value.trim();
  const startTime = performance.now();

  btnSendSoap.disabled = true;
  statusBadge.className = 'status-indicator';
  statusBadge.textContent = 'Enviando petición SOAP...';
  latencyIndicator.textContent = '... ms';

  try {
    const res = await fetch(`/ws/${activeTenant.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `https://${activeTenant.id}.servicios.com/wsdl/ConsultarCuenta`
      },
      body: xmlBody
    });

    const elapsed = Math.round(performance.now() - startTime);
    latencyIndicator.textContent = `${elapsed} ms`;

    const responseText = await res.text();
    lastResponseXml = responseText;
    rawXmlCode.textContent = formatXml(responseText);

    statusBadge.className = `status-indicator ${res.ok ? 'success' : 'error'}`;
    statusBadge.textContent = `HTTP ${res.status} ${res.statusText}`;

    renderParsedResponse(responseText, res.ok);
  } catch (err) {
    statusBadge.className = 'status-indicator error';
    statusBadge.textContent = 'Error de Conexión';
    renderFault('ClientNetworkError', err.message, 'No se pudo conectar con el endpoint SOAP.');
  } finally {
    btnSendSoap.disabled = false;
  }
}

/**
 * Parsea y renderiza la respuesta SOAP en el componente visual o en tarjeta de error.
 */
function renderParsedResponse(xmlText, isOk) {
  emptyResponseState.classList.add('hidden');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Verificar si hay Fault
  const faultNode = xmlDoc.getElementsByTagNameNS('*', 'Fault')[0] || 
                    xmlDoc.getElementsByTagName('Fault')[0] || 
                    xmlDoc.getElementsByTagName('soap:Fault')[0];

  if (faultNode || !isOk) {
    const faultCode = faultNode?.getElementsByTagNameNS('*', 'faultcode')[0]?.textContent || 
                      faultNode?.getElementsByTagName('faultcode')[0]?.textContent || 'SOAP Fault';
    const faultString = faultNode?.getElementsByTagNameNS('*', 'faultstring')[0]?.textContent || 
                        faultNode?.getElementsByTagName('faultstring')[0]?.textContent || 'Error en la petición SOAP';
    const detail = faultNode?.getElementsByTagNameNS('*', 'detail')[0]?.textContent || 
                   faultNode?.getElementsByTagName('detail')[0]?.textContent || xmlText;

    renderFault(faultCode, faultString, detail);
    return;
  }

  // Éxito: Extraer datos de la cuenta soportando namespaces XML
  const titular = xmlDoc.getElementsByTagNameNS('*', 'titular')[0]?.textContent || 
                  xmlDoc.getElementsByTagName('titular')[0]?.textContent || 
                  xmlDoc.getElementsByTagName('tns:titular')[0]?.textContent || 'N/A';

  const saldo = xmlDoc.getElementsByTagNameNS('*', 'saldo')[0]?.textContent || 
                xmlDoc.getElementsByTagName('saldo')[0]?.textContent || 
                xmlDoc.getElementsByTagName('tns:saldo')[0]?.textContent || '0.00';

  const emisor = xmlDoc.getElementsByTagNameNS('*', 'emisor')[0]?.textContent || 
                 xmlDoc.getElementsByTagName('emisor')[0]?.textContent || 
                 xmlDoc.getElementsByTagName('tns:emisor')[0]?.textContent || (activeTenant.nombre || activeTenant.name);

  // Llenar tarjeta de cuenta
  faultCard.classList.add('hidden');
  accountCard.classList.remove('hidden');

  cardBrandFlag.textContent = (activeTenant.nombre || activeTenant.name).toUpperCase();
  cardAccountId.textContent = `CUENTA #${inputAccountId.value || '1001'}`;
  cardBalance.textContent = `$ ${Number(saldo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  cardHolder.textContent = titular;
  cardIssuer.textContent = emisor;
  cardSchemaTag.textContent = `Esquema aislado: ${activeTenant.schema_name}`;
}

/**
 * Muestra el panel de error SOAP Fault.
 */
function renderFault(code, message, detail) {
  accountCard.classList.add('hidden');
  faultCard.classList.remove('hidden');

  faultTitle.textContent = `${code}`;
  faultMessage.textContent = message;
  faultDetail.textContent = detail;
}

/**
 * Carga el WSDL en vivo del tenant activo.
 */
async function loadWsdl() {
  if (!activeTenant) return;
  wsdlCodeDisplay.textContent = 'Cargando contrato WSDL...';

  try {
    const res = await fetch(`/ws/${activeTenant.id}?wsdl`);
    const xml = await res.text();
    wsdlCodeDisplay.textContent = formatXml(xml);
  } catch (err) {
    wsdlCodeDisplay.textContent = `Error cargando WSDL: ${err.message}`;
  }
}

/**
 * Formatea XML con indentación legible.
 */
function formatXml(xml) {
  let formatted = '';
  let pad = 0;
  const reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, '$1\r\n$2$3');

  xml.split('\r\n').forEach(node => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) pad -= 1;
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    formatted += '  '.repeat(pad) + node + '\r\n';
    pad += indent;
  });

  return formatted.trim();
}

/**
 * Configuración de eventos de la interfaz.
 */
function setupEventListeners() {
  // Pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.target);
      targetPanel.classList.add('active');

      if (btn.dataset.target === 'panelWsdl') {
        loadWsdl();
      }
    });
  });

  // Cambio de vista entre tarjeta visual y raw XML
  viewCardBtn.addEventListener('click', () => {
    viewCardBtn.classList.add('active');
    viewRawBtn.classList.remove('active');
    visualCardView.classList.remove('hidden');
    rawXmlView.classList.add('hidden');
  });

  viewRawBtn.addEventListener('click', () => {
    viewRawBtn.classList.add('active');
    viewCardBtn.classList.remove('active');
    rawXmlView.classList.remove('hidden');
    visualCardView.classList.add('hidden');
  });

  // Botón copiar respuesta XML
  btnCopyResponse.addEventListener('click', () => {
    if (!lastResponseXml) return;
    navigator.clipboard.writeText(lastResponseXml);
    btnCopyResponse.textContent = '✅';
    setTimeout(() => btnCopyResponse.textContent = '📋', 1500);
  });

  // Botón copiar WSDL
  btnCopyWsdl.addEventListener('click', () => {
    navigator.clipboard.writeText(wsdlCodeDisplay.textContent);
    btnCopyWsdl.textContent = '¡Copiado!';
    setTimeout(() => btnCopyWsdl.textContent = 'Copiar WSDL', 1500);
  });

  // Input de ID de cuenta
  inputAccountId.addEventListener('input', generateXmlTemplate);

  // Chips de cuentas de prueba rápida
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inputAccountId.value = chip.dataset.id;
      generateXmlTemplate();
      sendSoapRequest();
    });
  });

  // Botón restaurar XML
  btnResetXml.addEventListener('click', generateXmlTemplate);

  // Botón ejecutar llamada SOAP
  btnSendSoap.addEventListener('click', sendSoapRequest);

  // Sincronización de color picker
  const newTenantColor = document.getElementById('newTenantColor');
  const newTenantColorHex = document.getElementById('newTenantColorHex');
  if (newTenantColor && newTenantColorHex) {
    newTenantColor.addEventListener('input', (e) => {
      newTenantColorHex.value = e.target.value;
    });
  }

  // Formulario para aprovisionar nueva empresa
  const formCreateTenant = document.getElementById('formCreateTenant');
  const newTenantFeedback = document.getElementById('newTenantFeedback');
  const btnSubmitTenant = document.getElementById('btnSubmitTenant');

  if (formCreateTenant) {
    formCreateTenant.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('newTenantNombre').value.trim();
      const id = document.getElementById('newTenantId').value.trim();
      const brand_color = newTenantColor.value;
      const initial_titular = document.getElementById('newTenantTitular').value.trim();
      const initial_saldo = document.getElementById('newTenantSaldo').value;

      btnSubmitTenant.disabled = true;
      btnSubmitTenant.innerHTML = '<span>⏳ Aprovisionando en Neon...</span>';
      newTenantFeedback.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem;">Creando esquema y registrando servicio SOAP...</div>';

      try {
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, nombre, brand_color, initial_titular, initial_saldo })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Error al aprovisionar tenant');
        }

        newTenantFeedback.innerHTML = `
          <div style="background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#10b981;padding:0.9rem 1.25rem;border-radius:var(--radius-sm);font-size:0.9rem;">
            ✅ <strong>¡Empresa Aprovisionada!</strong> ${data.message}
          </div>
        `;

        formCreateTenant.reset();
        newTenantColorHex.value = '#8B5CF6';

        // Recargar tenants y activar la nueva empresa
        await loadTenants(id);

        // Cambiar automáticamente a la pestaña de consola para probar
        setTimeout(() => {
          document.getElementById('tabBtnConsole').click();
          sendSoapRequest();
        }, 1200);

      } catch (err) {
        newTenantFeedback.innerHTML = `
          <div style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#ef4444;padding:0.9rem 1.25rem;border-radius:var(--radius-sm);font-size:0.9rem;">
            ❌ <strong>Error:</strong> ${err.message}
          </div>
        `;
      } finally {
        btnSubmitTenant.disabled = false;
        btnSubmitTenant.innerHTML = '<span>🚀 Aprovisionar Empresa en Neon</span>';
      }
    });
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadTenants();
});
