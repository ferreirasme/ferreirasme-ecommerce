export default function TestePage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Teste - Ferreiras Me</h1>
      <p>Se você está vendo esta página, o servidor está funcionando!</p>
      <hr />
      <h2>Links para testar:</h2>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/produtos">Produtos</a></li>
        <li><a href="/login">Login</a></li>
        <li><a href="/api/test">API Test (JSON)</a></li>
      </ul>
    </div>
  )
}