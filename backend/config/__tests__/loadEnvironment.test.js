const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const loader = path.resolve(__dirname, '..', 'loadEnvironment.js');
let dir;
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'herbalism-config-')); });
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

function run(envFile, extraEnv = {}) {
  return spawnSync(process.execPath, ['-e', `
    require(${JSON.stringify(loader)})(${JSON.stringify(envFile)});
    process.stdout.write(process.env.HERBALISM_CONFIG_TEST || 'absent');
  `], { cwd: dir, env: { PATH: process.env.PATH, ...extraEnv }, encoding: 'utf8' });
}

test('loads a file from an unrelated current working directory', () => {
  const file = path.join(dir, 'test.env');
  fs.writeFileSync(file, 'HERBALISM_CONFIG_TEST=fixture-value\n');
  const result = run(file);
  expect(result.status).toBe(0);
  expect(result.stdout).toBe('fixture-value');
});

test('does not replace externally injected values', () => {
  const file = path.join(dir, 'test.env');
  fs.writeFileSync(file, 'HERBALISM_CONFIG_TEST=file-value\n');
  const result = run(file, { HERBALISM_CONFIG_TEST: 'injected-value' });
  expect(result.status).toBe(0);
  expect(result.stdout).toBe('injected-value');
});

test('permits environment-only startup with no local file', () => {
  const result = run(path.join(dir, 'missing.env'), { HERBALISM_CONFIG_TEST: 'injected-value' });
  expect(result.status).toBe(0);
  expect(result.stdout).toBe('injected-value');
});

test('does not fabricate missing configuration', () => {
  const result = run(path.join(dir, 'missing.env'));
  expect(result.status).toBe(0);
  expect(result.stdout).toBe('absent');
});

test('surfaces unexpected env-file I/O errors', () => {
  const result = run(path.join(dir, 'bad.env'));
  // ENOTDIR is distinct from an absent file, and must not be swallowed.
  const file = path.join(dir, 'regular-file');
  fs.writeFileSync(file, 'fixture');
  const failed = run(path.join(file, 'child.env'));
  expect(result.status).toBe(0);
  expect(failed.status).not.toBe(0);
  expect(failed.stderr).toContain('ENOTDIR');
});

test('default path is anchored to the backend directory, not process.cwd()', () => {
  const dotenv = require('dotenv');
  const config = jest.spyOn(dotenv, 'config').mockReturnValue({ parsed: {} });
  try {
    require(loader)();
    expect(config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '..', '..', '.env'), override: false, quiet: true,
    });
  } finally { config.mockRestore(); }
});
