import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AdSenseScript, StickyBannerAd } from "@/components/ads";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "GiveMeGuidance - Biblical Wisdom for Life's Questions",
  description: "Share what's on your heart and receive wisdom from Scripture.",
  appleWebApp: {
    title: "Guidance",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`}>
          <AdSenseScript />
          <Navbar />
          <div className="pb-20">{/* Add padding for sticky banner */}
            {children}
          </div>
          <StickyBannerAd adSlot="YOUR_BANNER_AD_SLOT_ID" />
        </body>
      </html>
    </ClerkProvider>
  );
}
