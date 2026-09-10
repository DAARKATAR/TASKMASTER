import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cloudflaredBin = path.join(__dirname, '..', 'bin', 'cloudflared.exe');

console.log('🚀 Iniciando Cloudflare Tunnel hacia http://localhost:3000...');

const tunnel = spawn(cloudflaredBin, ['tunnel', '--url', 'http://localhost:3000'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let foundUrl = false;

function handleLog(data) {
  const text = data.toString();
  process.stdout.write(text);

  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !foundUrl) {
    foundUrl = true;
    const tunnelUrl = match[0];
    console.log('\n=============================================================');
    console.log(`🌐 CLOUDFLARE PUBLIC HTTPS GATEWAY ACTIVO:`);
    console.log(`👉 ${tunnelUrl}`);
    console.log(`👉 Health: ${tunnelUrl}/health`);
    console.log(`👉 API Tenants: ${tunnelUrl}/api/tenants`);
    console.log(`👉 WSDL Demo: ${tunnelUrl}/ws/gourmetpos?wsdl`);
    console.log('=============================================================\n');
  }
}

tunnel.stdout.on('data', handleLog);
tunnel.stderr.on('data', handleLog);

tunnel.on('close', (code) => {
  console.log(`Cloudflare Tunnel finalizó con código: ${code}`);
});

process.on('SIGINT', () => {
  tunnel.kill();
  process.exit(0);
});
