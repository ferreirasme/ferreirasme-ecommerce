export default function HealthPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Health Check</h1>
      <p>If you can see this, the app is running!</p>
      <hr />
      <h2>Environment Check:</h2>
      <ul>
        <li>NODE_ENV: {process.env.NODE_ENV || 'not set'}</li>
        <li>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</li>
        <li>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</li>
      </ul>
    </div>
  );
}