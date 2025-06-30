export default function TestStaticPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Página Estática de Teste</h1>
      <p>Se você consegue ver isso, o problema não é no roteamento.</p>
      
      <div className="mt-4 space-y-2">
        <p>Teste 1: Página estática funciona ✓</p>
        <p>Teste 2: Sem JavaScript do lado cliente ✓</p>
        <p>Teste 3: Sem redirecionamentos ✓</p>
      </div>
      
      <div className="mt-8">
        <a href="/admin/test-auth" className="text-blue-600 underline">
          Ir para teste com JavaScript (cuidado, pode travar)
        </a>
      </div>
    </div>
  )
}