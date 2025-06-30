const http = require('http');

console.log('Iniciando servidor...');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor funcionando!\n');
});

server.listen(3008, '127.0.0.1', () => {
  console.log('Servidor rodando em http://127.0.0.1:3008');
  console.log('Teste acessando: http://127.0.0.1:3008');
});

server.on('error', (err) => {
  console.error('Erro no servidor:', err);
});