export default function TestMinimalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-PT">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}