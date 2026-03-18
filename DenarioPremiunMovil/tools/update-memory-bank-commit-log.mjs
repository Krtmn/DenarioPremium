import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..');
const logPath = path.join(repoRoot, 'DenarioPremiunMovil', 'memory-bank', 'commit-log.md');

function run(cmd) {
  return execSync(cmd, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function ensureLogFile() {
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(
      logPath,
      '# Commit Log (automático)\n\nEste archivo se actualiza automáticamente en cada commit mediante el hook `post-commit`.\n\nFormato:\n- `YYYY-MM-DD HH:mm` | `hash` | autor | mensaje\n\n---\n',
      'utf8'
    );
  }
}

function main() {
  ensureLogFile();

  const hash = run('git rev-parse --short HEAD');
  const author = run('git log -1 --pretty=format:%an');
  const date = run('git log -1 --date=format-local:"%Y-%m-%d %H:%M" --pretty=format:%cd');
  const message = run('git log -1 --pretty=format:%s').replace(/\r?\n/g, ' ');

  const entry = `- ${date} | ${hash} | ${author} | ${message}\n`;
  const current = fs.readFileSync(logPath, 'utf8');

  if (current.includes(`| ${hash} |`)) {
    return;
  }

  fs.appendFileSync(logPath, entry, 'utf8');
}

try {
  main();
} catch (error) {
  console.error('[memory-bank] No se pudo actualizar commit-log.md:', error?.message || error);
  process.exit(0);
}
