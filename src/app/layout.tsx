import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
<<<<<<< HEAD
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
=======
import { AdSenseScript, StickyBannerAd } from "@/components/ads";
>>>>>>> 8d1fb4a (Add Clerk authentication and Google AdSense integration)

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
<<<<<<< HEAD
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>
          <Navbar />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
=======
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
>>>>>>> 8d1fb4a (Add Clerk authentication and Google AdSense integration)
  );
}
