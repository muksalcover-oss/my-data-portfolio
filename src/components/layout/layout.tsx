import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ardi Analis | UMKM Dashboard',
  description: 'Platform analisis data ekonomi mikro',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}