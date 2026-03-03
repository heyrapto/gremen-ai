import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Space_Mono, Black_Ops_One, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from './components/Sidebar';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '700', '800'] });
const blockyFont = Black_Ops_One({ subsets: ['latin'], weight: "400", variable: '--font-display' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' });

export const metadata: Metadata = {
  title: 'On-Chain Guardian | Dashboard',
  description: 'AI-Powered Reactive On-Chain Guardian',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceMono.variable} ${blockyFont.variable} ${spaceGrotesk.variable} antialiased bg-[#0a0a0a] text-zinc-300 h-screen overflow-hidden flex font-sans`}>
        <Providers>
          {/* Sidebar imported from components */}
          <Sidebar />

          {/* Main Content Base */}
          <main className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden relative" style={{ backgroundImage: 'linear-gradient(#151515 1px, transparent 1px), linear-gradient(90deg, #151515 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]/80 pointer-events-none z-0"></div>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}