import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display, Roboto, Open_Sans, Lato, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const roboto = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-roboto" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });
const lato = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-lato" });
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });

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
      <body className={`antialiased bg-ms-bg text-ms-text min-h-screen font-sans ${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${poppins.variable}`}>
        {children}
      </body>
    </html>
  );
}
