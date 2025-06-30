const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <body>
        <h1>Servidor de Teste Puro</h1>
        <p>Se você vê isso, o problema é com Next.js</p>
        <p>Horário: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

server.listen(3006, () => {
  console.log('Servidor de teste rodando em http://localhost:3006');
});