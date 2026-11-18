import type { Metadata } from 'next';
import './globals.css';
import { LMSProvider } from '@/context/LMSContext';
import { WhiteLabelTopBar } from '@/components/WhiteLabelTopBar';

export const metadata: Metadata = {
  title: 'Plataforma Educativa Central — Sistema Multi-Academia',
  description:
    'Campus virtual con diseño ergonómico de alta legibilidad, subdominios temáticos y lecciones prácticas paso a paso.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-slate-200 selection:text-slate-900">
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
