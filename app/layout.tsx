import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Roboto, Fira_Code, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const roboto = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-roboto" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

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
      <body className={`antialiased bg-ms-bg text-ms-text min-h-screen font-sans ${inter.variable} ${jetbrainsMono.variable} ${roboto.variable} ${firaCode.variable} ${jakarta.variable}`}>
        {children}
      </body>
    </html>
  );
}
