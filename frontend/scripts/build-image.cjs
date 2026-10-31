const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const firebase = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']
  .map(key => `REACT_APP_FIREBASE_${key}`);
const required = [...firebase, 'REACT_APP_API_URL', 'REACT_APP_SOCKET_URL', 'REACT_APP_SOCKET_PATH'];
const allowed = new Set([...required, 'REACT_APP_E2E', 'REACT_APP_VERSION', 'REACT_APP_LIDS_ENABLED',
  'REACT_APP_LIDS_ISSUER', 'REACT_APP_LIDS_CLIENT_ID', 'REACT_APP_LIDS_REDIRECT_URI']);

function validate(values) {
  for (const key of Object.keys(values)) {
    if (!allowed.has(key)) throw new Error('Unsupported build configuration key');
    if (/[\r\n$]/.test(values[key])) throw new Error(`Invalid build configuration: ${key}`);
  }
  for (const key of required) {
    if (!values[key]?.trim()) throw new Error(`Missing build configuration: ${key}`);
  }
  if (values.REACT_APP_E2E && values.REACT_APP_E2E !== '0') throw new Error('E2E auth is forbidden in image builds');
  if (values.REACT_APP_LIDS_ENABLED && !['true', 'false'].includes(values.REACT_APP_LIDS_ENABLED)) {
    throw new Error('Invalid REACT_APP_LIDS_ENABLED');
  }
  const urls = ['REACT_APP_API_URL', 'REACT_APP_SOCKET_URL'];
  if (values.REACT_APP_LIDS_ENABLED === 'true') {
    urls.push('REACT_APP_LIDS_ISSUER', 'REACT_APP_LIDS_REDIRECT_URI');
    if (!values.REACT_APP_LIDS_CLIENT_ID?.trim()) throw new Error('Missing REACT_APP_LIDS_CLIENT_ID');
  }
  for (const key of urls) {
    let url;
    try { url = new URL(values[key]); } catch { throw new Error(`Invalid build URL: ${key}`); }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.hash) {
      throw new Error(`Invalid build URL: ${key}`);
    }
  }
  if (!/^\/(?!\/)[^?#\s]*$/.test(values.REACT_APP_SOCKET_PATH)) throw new Error('Invalid REACT_APP_SOCKET_PATH');
  return { ...values, REACT_APP_E2E: '0', GENERATE_SOURCEMAP: 'false' };
}

function readConfig(file, expectedHash) {
  const source = fs.readFileSync(file);
  if (!/^[a-f0-9]{64}$/.test(expectedHash || '') || crypto.createHash('sha256').update(source).digest('hex') !== expectedHash) {
    throw new Error('PUBLIC_CONFIG_SHA256 must match the supplied public build configuration');
  }
  const values = require('dotenv').parse(source);
  validate(values);
  return values;
}

function buildEnvironment(values, inherited = process.env) {
  // Keep only OS process plumbing, not ambient CRA/npm/Node build switches.
  const environment = {};
  for (const key of ['PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'SystemRoot']) {
    if (inherited[key] !== undefined) environment[key] = inherited[key];
  }
  return { ...environment, ...validate(values), NODE_ENV: 'production' };
}

if (require.main === module) {
  try {
    const values = readConfig(process.argv[2], process.argv[3]);
    const result = spawnSync('npm', ['run', 'build'], { env: buildEnvironment(values), stdio: 'inherit' });
    if (result.error || result.status === null) throw new Error('Frontend build process failed');
    process.exitCode = result.status;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validate, readConfig, buildEnvironment };
