const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3005',
      changeOrigin: true,
    })
  );

  // WebSocket proxy
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'ws://localhost:3005',
      ws: true,
      changeOrigin: true,
    })
  );
};