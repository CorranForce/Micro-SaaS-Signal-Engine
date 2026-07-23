import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Only the default sans (Inter) and monospace (JetBrains Mono) are loaded up
// front. These are the two options offered by the font switcher in Settings;
// loading five more families on every page just to power an operator-only
// preference wasn't worth the bytes.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

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
      <body className={`antialiased bg-ms-bg text-ms-text min-h-screen font-sans ${inter.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
