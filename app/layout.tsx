import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('theme');
    const shouldDark = stored ? stored === 'dark' : true;
    document.documentElement.classList.toggle('dark', shouldDark);
  } catch {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Support Ticket System",
  description: "Plataforma de soporte técnico con IA",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} min-h-dvh w-full max-w-full overflow-x-hidden antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
