import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Micro-SaaS Signal Engine',
  description: 'Discover highly profitable, boring B2B micro-SaaS opportunities in legacy industries. Generate complete launch kits, ROI estimates, validation checklists, and find local business leads with this AI-powered research tool.',
  keywords: ['micro-saas', 'b2b saas', 'saas ideas', 'startup ideas', 'boring businesses', 'lovable.dev', 'ai business generator', 'saas launch kit'],
  openGraph: {
    title: 'Micro-SaaS Signal Engine',
    description: 'Discover highly profitable, boring B2B micro-SaaS opportunities in legacy industries. Generate complete launch kits, ROI estimates, validation checklists, and find local business leads with this AI-powered research tool.',
    url: 'https://ais-dev-mx5mhhnxcthim44gk36eql-6744066599.us-east5.run.app',
    siteName: 'Micro-SaaS Signal Engine',
    images: [
      {
        url: 'https://picsum.photos/seed/microsaas/1200/630',
        width: 1200,
        height: 630,
        alt: 'Micro-SaaS Signal Engine Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Micro-SaaS Signal Engine',
    description: 'Discover highly profitable, boring B2B micro-SaaS opportunities in legacy industries. Generate complete launch kits, ROI estimates, validation checklists, and find local business leads with this AI-powered research tool.',
    images: ['https://picsum.photos/seed/microsaas/1200/630'],
  },
};

import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GlobalErrorHandler />
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" toastOptions={{
              style: {
                background: '#111',
                color: '#fff',
                border: '1px solid #333',
                fontSize: '12px',
                fontFamily: 'monospace',
                borderRadius: '0'
              },
              success: {
                iconTheme: { primary: '#50e6a0', secondary: '#111' }
              },
              error: {
                iconTheme: { primary: '#ff4d4d', secondary: '#111' }
              }
            }} />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
