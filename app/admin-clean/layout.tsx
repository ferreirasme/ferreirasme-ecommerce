import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin - Ferreira's Me",
  description: "Área administrativa",
};

export default function AdminCleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body className={`${inter.className} antialiased`}>
        {/* Layout limpo sem AuthProvider */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}