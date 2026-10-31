'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const prefix = ['compose', '--project-name', 'herbalism-local-issue3', '-f', path.join(root, 'compose.local.yml')];
function validateConfiguration(owner, app) {
  require('../backend/scripts/migrate-local.cjs').options({ ...owner,
    HERBALISM_ENV: 'local-docker', PG_SCHEMA: 'herbalism' });
  let url;
  try { url = new URL(app.DATABASE_URL); } catch { throw new Error('Dedicated local app connection required'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== 'db' ||
      (url.port && url.port !== '5432') || url.pathname !== '/herbalism_db' ||
      url.username !== 'herbalism_app' || !url.password || url.search || url.hash ||
      !app.FIREBASE_PROJECT_ID) throw new Error('Local app must use its own db/herbalism_db identity and real Firebase project');
}
function preflight(env) {
  const parse = require('../backend/node_modules/dotenv').parse;
  const owner = parse(fs.readFileSync(env.HERBALISM_OWNER_ENV));
  const app = parse(fs.readFileSync(env.HERBALISM_APP_ENV));
  validateConfiguration(owner, app);
  const password = fs.readFileSync(env.HERBALISM_DB_PASSWORD_FILE, 'utf8').trimEnd();
  if (!password || decodeURIComponent(new URL(owner.DATABASE_URL).password) !== password) {
    throw new Error('Local bootstrap and owner credentials do not match');
  }
  const publicSource = fs.readFileSync(env.HERBALISM_PUBLIC_ENV);
  if (crypto.createHash('sha256').update(publicSource).digest('hex') !== env.PUBLIC_CONFIG_SHA256) {
    throw new Error('Public build config hash mismatch');
  }
}
function deploy(invoke) {
  const run = args => {
    const result = invoke([...prefix, ...args]);
    if (!result || result.error || result.signal || result.status !== 0) throw new Error('Local Docker deployment stopped; no later phase was started');
  };
  run(['config', '--quiet']);
  run(['build', 'backend', 'frontend']);
  // Build first; stop only this project's app before applying potentially incompatible DDL.
  run(['stop', 'frontend', 'backend']);
  run(['up', '-d', '--wait', '--wait-timeout', '120', 'db']);
  // Always creates a new one-shot execution, even if a previous migration exited 0.
  // No --rm: deleting containers is outside the deployment authorization.
  run(['run', '--no-deps', '-T', 'migration']);
  run(['up', '-d', '--no-deps', '--wait', '--wait-timeout', '120', 'backend']);
  run(['up', '-d', '--no-deps', '--wait', '--wait-timeout', '120', 'frontend']);
}
if (require.main === module) {
  try {
    if (process.argv.length !== 2) throw new Error('No arbitrary compose arguments accepted');
    preflight(process.env);
    deploy(args => spawnSync('docker', args, { cwd: root, stdio: 'inherit', timeout: 1800000 }));
  } catch (_) { console.error('Local Docker deployment failed; check the scoped configuration or failed phase.'); process.exitCode = 1; }
}
module.exports = { deploy, validateConfiguration };
