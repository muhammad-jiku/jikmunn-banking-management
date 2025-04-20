export const dynamic = 'force-dynamic';

import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { IBM_Plex_Serif, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-serif',
});

export const metadata: Metadata = {
  title: 'Skyline',
  description: 'Skyline is a modern banking platform for everyone.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          `min-h-screen ${inter.variable} ${ibmPlexSerif.variable}`
        )}
      >
        {children}
      </body>
    </html>
  );
}
