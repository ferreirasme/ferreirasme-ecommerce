const express = require('express');
const app = express();

app.get('*', (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  res.send(`
    <html>
      <body>
        <h1>Express Server</h1>
        <p>Se você vê isso, o problema é específico do Next.js</p>
        <p>URL: ${req.url}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

app.listen(3007, () => {
  console.log('Express server rodando em http://localhost:3007');
});