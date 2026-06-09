import React from 'react';

export const metadata = {
  title: 'Investments Explorer',
  description: 'AI-Powered Alternative Investments Financial Reporting',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}