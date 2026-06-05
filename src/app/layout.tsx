import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lux Aeterna Call Center AI",
  description: "AI console for call center operations, agent assist, routing, and platform adapters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
