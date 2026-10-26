// Run via stdin in the candidate image with --network none; no live credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');

async function main() {
  assert.notEqual(process.getuid(), 0, 'image must run as non-root');
  assert.equal(process.cwd(), '/app/backend');
  assert.equal(process.env.NODE_ENV, 'production');
  for (const dependency of ['jest', 'nodemon', 'supertest']) {
    assert.throws(() => require.resolve(dependency), { code: 'MODULE_NOT_FOUND' });
  }
  function checkTree(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      assert(!/^\.env(?:\.|$)/.test(entry.name), 'image contains a local environment file');
      assert(!/\.(?:test|spec)\.(?:js|cjs)$/.test(entry.name), 'image contains tests');
      if (entry.isDirectory()) checkTree(path.join(directory, entry.name));
    }
  }
  checkTree('/app');
  assert(!fs.existsSync('/app/frontend'), 'backend image must exclude frontend');
  assert(fs.existsSync('/app/shared/constants/evolution.js'), 'shared runtime is missing');

  // A lazy PG client is configured, but any connection attempt fails the check.
  Object.assign(process.env, {
    DB_PROVIDER: 'postgres', DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/fixture',
    PORT: '0',
  });
  let connectionAttempts = 0;
  require('pg').Client.prototype.connect = function () {
    connectionAttempts++;
    throw new Error('DB access forbidden during image smoke');
  };
  let server;
  const listen = http.Server.prototype.listen;
  http.Server.prototype.listen = function (...args) {
    server = this;
    return listen.apply(this, args);
  };
  try {
    require(path.resolve('server.js'));
  } finally {
    http.Server.prototype.listen = listen;
  }
  assert(server, 'server did not start');
  if (!server.listening) await once(server, 'listening');
  const response = await new Promise((resolve, reject) => {
    const request = http.get({ host: '127.0.0.1', port: server.address().port, path: '/api/health' }, result => {
      let body = '';
      result.setEncoding('utf8');
      result.on('data', chunk => { body += chunk; });
      result.on('end', () => resolve({ status: result.statusCode, body }));
      result.on('error', reject);
    });
    request.on('error', reject);
    request.setTimeout(3000, () => request.destroy(new Error('health check timeout')));
  });
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.body).status, 'ok');
  assert.equal(connectionAttempts, 0, 'startup attempted a DB connection');
  console.log(JSON.stringify({ imageSmoke: true, nonRoot: true, sharedRuntime: true, health: 200, databaseConnectionAttempts: 0 }));
}

const deadline = setTimeout(() => { console.error('image smoke deadline exceeded'); process.exit(1); }, 10000);
main().then(() => { clearTimeout(deadline); process.exit(0); }, error => {
  console.error(error.message);
  process.exit(1);
});
