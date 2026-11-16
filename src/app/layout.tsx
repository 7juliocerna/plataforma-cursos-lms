import type { Metadata } from 'next';
import './globals.css';
import { LMSProvider } from '@/context/LMSContext';
import { WhiteLabelTopBar } from '@/components/WhiteLabelTopBar';

export const metadata: Metadata = {
  title: 'LMS Marca Blanca & Multitenant — Plataforma SaaS B2B',
  description:
    'Plataforma LMS Marca Blanca y Multitenant para venta directa de cursos pregrabados, resellers con control de licencias y seguridad anti-compartir cuenta.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <LMSProvider>
          <div className="flex min-h-screen flex-col">
            <WhiteLabelTopBar />
            <main className="flex-1">{children}</main>
          </div>
        </LMSProvider>
      </body>
    </html>
  );
}
