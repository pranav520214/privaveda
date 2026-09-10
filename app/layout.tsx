import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PRIVAVEDA — Patient-Specific Simulation for Clinical Review',
  description:
    'An interactive exploration of patient-specific pharmacokinetic simulation, uncertainty, Bayesian updating, and clinician-led review. The model simulates. The clinician decides.',
  keywords: [
    'PRIVAVEDA',
    'Pharmacokinetics',
    'Precision Dosing',
    'Bayesian Dosing',
    'Therapeutic Drug Monitoring',
    'Clinical Simulation',
    'Computational Biology',
    'Clinical Decision Support',
  ],
  authors: [{ name: 'Pranav Kumar Mishra', url: 'https://privaveda.org' }],
  creator: 'Pranav Kumar Mishra',
  openGraph: {
    title: 'PRIVAVEDA — Patient-Specific Simulation for Clinical Review',
    description:
      'Grounded in the principle: The model simulates. The clinician decides. Mechanistic ODE solvers, Bayesian parameter updates, and explicit credible uncertainty envelopes.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PRIVAVEDA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRIVAVEDA — Patient-Specific Simulation for Clinical Review',
    description:
      'Patient-specific pharmacokinetic simulation and clinician-led review platform.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF8F5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#FAF8F5] text-charcoal-900 min-h-screen selection:bg-teal selection:text-white">
        {children}
      </body>
    </html>
  );
}
