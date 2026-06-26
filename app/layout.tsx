import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micro-SaaS Signal Engine",
  description: "Identify underserved B2B micro-SaaS opportunities in legacy industries, evaluate ROI, and generate complete AI developer prompts.",
  keywords: ["micro-saas", "b2b saas", "saas ideas", "startup ideas", "boring businesses", "ai business generator", "saas launch kit"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-ms-bg text-ms-text min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
