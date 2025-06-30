import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head />
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}