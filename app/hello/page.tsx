export default function HelloPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Hello World!</h1>
      <p>If you see this, the basic routing works.</p>
      <p>Last updated: {new Date().toLocaleString('pt-BR')}</p>
      <hr />
      <h2>Links de Teste:</h2>
      <ul>
        <li><a href="/admin-login-static">Admin Login Static (funciona)</a></li>
        <li><a href="/test-supabase-init">Test Supabase Init</a></li>
        <li><a href="/admin-login-debug">Admin Login Debug</a></li>
        <li><a href="/api/test-deploy">API Test Deploy</a></li>
      </ul>
    </div>
  );
}