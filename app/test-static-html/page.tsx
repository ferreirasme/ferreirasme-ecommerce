export default function TestStaticHTML() {
  return (
    <div>
      <h1>Test Static HTML</h1>
      <p>Se você vê isso, a rota funciona!</p>
      <ul>
        <li><a href="/hello">Hello</a></li>
        <li><a href="/admin-login-static">Admin Login Static</a></li>
        <li><a href="/test-supabase-init">Test Supabase Init</a></li>
        <li><a href="/admin-login-debug">Admin Login Debug</a></li>
      </ul>
    </div>
  )
}