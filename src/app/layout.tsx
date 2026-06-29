import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../styles/sigghas.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIGGHAS — Sistema de Gestión de Horarios Académicos",
  description: "Sistema Inteligente de Generación y Gestión de Horarios Académicos · PUCE Carrera de Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full`}
      style={{
        fontFamily: "var(--font-poppins), system-ui, sans-serif",
      }}
    >
      <body
        className="min-h-full"
        style={{
          fontFamily: "var(--font-poppins), system-ui, sans-serif",
          background: "#F5F1E8",
          color: "#0E1116",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
      </body>
    </html>
  );
}
