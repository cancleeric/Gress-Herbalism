'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deploy, validateConfiguration } = require('./deploy-local-docker.cjs');
const tail = args => args.slice(5);
test('reject production targets and owner-as-app before Docker invocation', () => {
  const owner = { DATABASE_URL: 'postgres://herbalism_owner:fixture@db/herbalism_db' };
  const app = { DATABASE_URL: 'postgres://herbalism_app:fixture@db/herbalism_db', FIREBASE_PROJECT_ID: 'fixture-project' };
  validateConfiguration(owner, app);
  for (const value of ['postgres://herbalism_owner:fixture@db/herbalism_db',
    'postgres://herbalism_app:fixture@prod/herbalism_db']) {
    assert.throws(() => validateConfiguration(owner, { ...app, DATABASE_URL: value }));
  }
});
test('every deployment reruns migration before starting either app service', () => {
  const calls = [];
  const run = args => { calls.push(tail(args)); return { status: 0 }; };
  deploy(run); deploy(run);
  assert.equal(calls.length, 14);
  for (const offset of [0, 7]) {
    assert.deepEqual(calls[offset + 4], ['run', '--no-deps', '-T', 'migration']);
    assert.equal(calls[offset + 5].at(-1), 'backend');
    assert.equal(calls[offset + 6].at(-1), 'frontend');
  }
  assert.ok(!calls.flat().some(x => ['--rm', 'down', 'prune', 'rm'].includes(x)));
});
for (let failure = 0; failure < 7; failure++) {
  test(`phase ${failure} failure stops all later phases`, () => {
    let count = 0;
    assert.throws(() => deploy(() => ({ status: count++ === failure ? 1 : 0 })));
    assert.equal(count, failure + 1);
  });
}
