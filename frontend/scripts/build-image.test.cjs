const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { validate, readConfig, buildEnvironment } = require('./build-image.cjs');
function fixture() {
  return {
    ...Object.fromEntries(['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']
      .map(key => [`REACT_APP_FIREBASE_${key}`, 'synthetic-only'])),
    REACT_APP_API_URL: 'https://api.example.invalid', REACT_APP_SOCKET_URL: 'https://socket.example.invalid',
    REACT_APP_SOCKET_PATH: '/socket.io',
  };
}
test('valid explicit configuration forces real auth and disables source maps', () => {
  const result = validate(fixture());
  assert.equal(result.REACT_APP_E2E, '0');
  assert.equal(result.GENERATE_SOURCEMAP, 'false');
});
test('ambient CRA, auth, npm and Node overrides cannot change the validated output', () => {
  const result = buildEnvironment(fixture(), { PATH: '/usr/bin', HOME: '/fixture',
    REACT_APP_LIDS_ENABLED: 'true', REACT_APP_LIDS_ISSUER: 'https://unexpected.invalid',
    REACT_APP_E2E: '1', PUBLIC_URL: '/wrong-path', NODE_ENV: 'test', NODE_OPTIONS: '--require=unsafe',
    npm_config_ignore_scripts: 'true', GENERATE_SOURCEMAP: 'true', CI: 'true' });
  assert.equal(result.PATH, '/usr/bin');
  assert.equal(result.NODE_ENV, 'production');
  assert.equal(result.REACT_APP_E2E, '0');
  assert.equal(result.GENERATE_SOURCEMAP, 'false');
  for (const key of ['REACT_APP_LIDS_ENABLED', 'REACT_APP_LIDS_ISSUER', 'PUBLIC_URL', 'NODE_OPTIONS', 'npm_config_ignore_scripts', 'CI']) {
    assert.equal(result[key], undefined, key);
  }
});
test('missing fields, test auth, arbitrary env and interpolation fail without exposing values', () => {
  for (const key of Object.keys(fixture())) {
    const values = fixture(); delete values[key]; assert.throws(() => validate(values));
  }
  for (const invalid of [{ REACT_APP_E2E: '1' }, { NODE_OPTIONS: '--require=unsafe' },
    { REACT_APP_FIREBASE_API_KEY: '$SECRET' }, { REACT_APP_FIREBASE_API_KEY: 'line\nbreak' }]) {
    assert.throws(() => validate({ ...fixture(), ...invalid }));
  }
  assert.throws(() => validate({ ...fixture(), REACT_APP_API_URL: 'https://user:private-value@example.invalid' }),
    error => !error.message.includes('private-value'));
});
test('invalid URL/path and incomplete enabled SSO fail', () => {
  for (const value of ['file:///tmp/x', 'not-a-url', 'https://example.invalid/#fragment']) {
    assert.throws(() => validate({ ...fixture(), REACT_APP_API_URL: value }));
  }
  for (const value of ['socket.io', '//socket.io', '/socket.io?x=1', '/socket.io#x', '/bad path']) {
    assert.throws(() => validate({ ...fixture(), REACT_APP_SOCKET_PATH: value }));
  }
  assert.throws(() => validate({ ...fixture(), REACT_APP_LIDS_ENABLED: 'true' }));
  assert.doesNotThrow(() => validate({ ...fixture(), REACT_APP_LIDS_ENABLED: 'true',
    REACT_APP_LIDS_CLIENT_ID: 'fixture-client', REACT_APP_LIDS_ISSUER: 'https://sso.example.invalid',
    REACT_APP_LIDS_REDIRECT_URI: 'https://app.example.invalid/herbalism/callback' }));
});
test('digest binds mounted config to cache key; stale and absent hashes fail', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'herbalism-build-env-'));
  const file = path.join(directory, 'fixture');
  const source = Object.entries(fixture()).map(([key,value]) => `${key}=${value}`).join('\n');
  try {
    fs.writeFileSync(file, source);
    const digest = crypto.createHash('sha256').update(source).digest('hex');
    assert.equal(buildEnvironment(readConfig(file, digest), {}).REACT_APP_E2E, '0');
    assert.throws(() => readConfig(file, undefined));
    assert.throws(() => readConfig(file, '0'.repeat(64)));
    fs.appendFileSync(file, '\nREACT_APP_E2E=1');
    assert.throws(() => readConfig(file, digest));
  } finally { fs.rmSync(directory, { recursive: true }); }
});
