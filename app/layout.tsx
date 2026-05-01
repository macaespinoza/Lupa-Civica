import { Inter, Space_Grotesk, Playfair_Display } from 'next/font/google';
import { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { AccessibilityProvider } from '@/lib/accessibility-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Lupa Ciudadana | Fiscalización Ciudadana',
  description: 'Plataforma para interactuar y fiscalizar el Congreso Nacional de Chile.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable}`}>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        <AuthProvider>
          <AccessibilityProvider>
            {children}
          </AccessibilityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
