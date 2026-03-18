const { spawn } = require('child_process');
const path = require('path');

const projectPath = process.cwd();
const projectName = path.basename(projectPath);

const child = spawn('npx', ['-y', '@testsprite/testsprite-mcp@latest'], {
  cwd: projectPath,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env,
  shell: true
});

let outBuf = Buffer.alloc(0);
const pending = new Map();
let seq = 1;

function send(msg) {
  const json = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n`;
  child.stdin.write(header + json);
}

function request(method, params) {
  const id = seq++;
  const payload = { jsonrpc: '2.0', id, method, params };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    send(payload);
  });
}

function handleMessage(msg) {
  if (typeof msg.id !== 'undefined' && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error); else resolve(msg.result);
  }
}

function tryParse() {
  while (true) {
    const sep = outBuf.indexOf('\r\n\r\n');
    if (sep === -1) return;
    const header = outBuf.slice(0, sep).toString('utf8');
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) {
      outBuf = outBuf.slice(sep + 4);
      continue;
    }
    const len = Number(m[1]);
    const total = sep + 4 + len;
    if (outBuf.length < total) return;
    const body = outBuf.slice(sep + 4, total).toString('utf8');
    outBuf = outBuf.slice(total);
    try {
      const msg = JSON.parse(body);
      handleMessage(msg);
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  }
}

child.stdout.on('data', (d) => { outBuf = Buffer.concat([outBuf, d]); tryParse(); });
child.stderr.on('data', (d) => process.stderr.write(d.toString()));

(async () => {
  try {
    const init = await request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'manual-mcp-client', version: '1.0.0' }
    });
    send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

    const result = await request('tools/call', {
      name: 'testsprite_generate_code_and_execute',
      arguments: {
        projectName,
        projectPath,
        testIds: [],
        additionalInstruction: 'Prueba básica automática en Ionic/Angular',
        serverMode: 'development'
      }
    });

    console.log('=== MCP TOOL RESULT START ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('=== MCP TOOL RESULT END ===');
  } catch (err) {
    console.error('MCP call failed:', err);
    process.exitCode = 1;
  } finally {
    child.kill();
    setTimeout(() => process.exit(process.exitCode || 0), 200);
  }
})();
