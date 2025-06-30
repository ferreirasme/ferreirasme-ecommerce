export default function TestSimpleForm() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Simple Form</h1>
      <form>
        <input type="text" placeholder="Test input" />
        <button type="button" onClick={() => alert('Clicked!')}>
          Test Button
        </button>
      </form>
    </div>
  )
}