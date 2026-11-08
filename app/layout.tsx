import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MLBB Draft Analyzer",
  description: "Analisis draft MLBB dari screenshot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
