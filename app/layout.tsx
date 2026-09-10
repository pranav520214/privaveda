import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AVANTA / PRIVANTRIX — A Clearer Trust Decision for Every Software Change',
  description:
    'Avanta is an engineering-intelligence and software-assurance platform that connects code change, context, reasoning, repair, verification, and human approval in one coherent assurance loop.',
  keywords: [
    'AVANTA',
    'PRIVANTRIX',
    'Software Assurance',
    'Engineering Intelligence',
    'Rudra Reasoning Core',
    'Deterministic Verification',
    'Provenance-Based Security',
    'Automated Repair',
    'Human-in-the-Loop',
    'USENIX Security',
  ],
  authors: [
    { name: 'Pranav Kumar Mishra', url: 'https://privantrix.com' },
    { name: 'Aryan Kashyap' },
  ],
  creator: 'Privantrix Engineering',
  openGraph: {
    title: 'AVANTA / PRIVANTRIX — A Clearer Trust Decision for Every Software Change',
    description:
      'A model proposes. Checks establish evidence. A human decides. Make the reason for trust inspectable.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AVANTA / PRIVANTRIX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVANTA — Engineering Intelligence & Software Assurance',
    description:
      'Connecting code change, context, reasoning, repair, verification, and human approval in one assurance loop.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050505',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#050505] text-[#F3F3F0]">
      <body className="min-h-screen bg-[#050505] text-[#F3F3F0] selection:bg-[#E2E4E9] selection:text-[#050505] overflow-x-hidden font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
