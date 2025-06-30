console.log('=== DEBUG NEXT.JS ===');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = true;
const hostname = '0.0.0.0';
const port = 3005;

console.log('Criando app Next.js...');
const app = next({ dev, hostname, port });

console.log('Preparando app...');
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('App preparado, criando servidor...');
  
  createServer(async (req, res) => {
    try {
      console.log(`Request: ${req.method} ${req.url}`);
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      console.error('Erro ao iniciar servidor:', err);
      throw err;
    }
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Also try: http://172.18.59.172:${port}`);
  });
}).catch((err) => {
  console.error('Erro ao preparar Next.js:', err);
  process.exit(1);
});