import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Papyrus - AI-Powered Journaling for Developers',
  description:
    'Journal like you code. Capture your thoughts right in your terminal.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
