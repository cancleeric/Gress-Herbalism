// Keep local multiplayer on one origin: phones must never connect to their
// own localhost. The backend remains on the existing assigned local port.
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.HERBALISM_BACKEND_URL || 'http://127.0.0.1:18321';
  // Mount at the root so the first page request registers the upgrade handler.
  // A path-mounted WS proxy otherwise needs a polling request before a fresh
  // server can accept websocket-only clients.
  app.use(createProxyMiddleware(['/herbalism-api', '/herbalism/socket.io'], {
    target, changeOrigin: true, ws: true,
    pathRewrite: { '^/herbalism-api': '' },
  }));
};
