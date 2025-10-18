import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WiFi Tea-Room - Portail Captif',
  description: 'Connectez-vous au WiFi gratuit de notre Tea-Room',
  keywords: ['wifi', 'tea-room', 'gratuit', 'connexion'],
  authors: [{ name: 'Tea-Room' }],
  robots: 'noindex, nofollow', // Ne pas indexer le portail captif
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}