import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider"; // Certifique-se que o caminho está correto

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
  display: "swap",
});

export const metadata: Metadata = {
  title: "RepairFlow | Gestão Premium para Assistências",
  description: "Sistema profissional para assistências técnicas de celulares.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} dark`}>
      <body className="antialiased bg-background text-foreground">
        {/* O Provider entra aqui, envolvendo o conteúdo */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
