import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jungle Wolf Chase Animation',
  description:
    'A stylized animated scene of a boy running through a jungle while chased by wolves.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
