import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investments Explorer Terminal",
  description: "AI Ledger Architecture Core",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#fafafa" }}>
        {children}
      </body>
    </html>
  );
}