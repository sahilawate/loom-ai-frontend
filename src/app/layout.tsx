// frontend/src/app/layout.tsx
import './globals.css'; 
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loom AI',
  description: 'Unified Retail Assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}