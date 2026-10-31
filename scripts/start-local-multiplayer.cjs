// Local/LAN live rooms, explicitly WITHOUT persistent account history.
// Existing public Firebase settings belong in frontend/.env.local (gitignored).
const path = require('node:path');
const { spawn } = require('node:child_process');
const net = require('node:net');
const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const dotenv = require(path.join(root, 'backend/node_modules/dotenv'));
const env = { ...process.env };
dotenv.config({ path: path.join(frontend, '.env.local'), processEnv: env, quiet: true });
if (!env.REACT_APP_FIREBASE_PROJECT_ID || !env.REACT_APP_FIREBASE_API_KEY) {
  throw new Error('Supply the existing public Firebase application settings in frontend/.env.local');
}
if (env.NODE_ENV === 'production') throw new Error('Use the deployment workflow for production');
const available = port => new Promise((resolve, reject) => {
  const socket = net.createServer();
  socket.once('error', () => reject(new Error(`Port ${port} is already in use; no existing process was stopped`)));
  socket.listen(port, '0.0.0.0', () => socket.close(resolve));
});
let children = [], stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
(async () => {
  await available(18320); await available(18321);
  const backend = spawn(process.execPath, [path.join(root, 'backend/server.js')], {
    cwd: root, stdio: 'inherit', env: { ...env, PORT: '18321', REALTIME_ONLY: '1', MEMORY_REPLAY: '1', PERSISTENT_REPLAY: '0',
      FIREBASE_PROJECT_ID: env.REACT_APP_FIREBASE_PROJECT_ID, SOCKET_PATH: '/herbalism/socket.io' },
  });
  const web = spawn(process.execPath,
    [require.resolve('react-scripts/scripts/start', { paths: [frontend] })], {
      cwd: frontend, stdio: 'inherit', env: { ...env, HOST: '0.0.0.0', PORT: '18320', BROWSER: 'none',
        REACT_APP_API_URL: '/herbalism-api', REACT_APP_SOCKET_URL: '/',
        REACT_APP_SOCKET_PATH: '/herbalism/socket.io', REACT_APP_E2E: '0', REACT_APP_LIDS_ENABLED: 'false' },
    });
  children = [backend, web];
  for (const child of children) {
    child.on('error', () => { process.exitCode = 1; stop(); });
    child.on('exit', code => { if (!stopping) { process.exitCode = code || 1; stop(); } });
  }
  console.log('Local multiplayer: http://localhost:18320/herbalism — temporary history/replay in memory; restart clears it.');
})().catch(error => { console.error(error.message); process.exitCode = 1; stop(); });
