"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const PUBLISHER_ID = "ca-pub-7517928309502563";

interface BannerAdProps {
  adSlot: string;
  className?: string;
}

export function BannerAd({ adSlot, className = "" }: BannerAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isAdLoaded.current) return;
    if (process.env.NODE_ENV !== "production") return;

    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isAdLoaded.current = true;
      } catch (error) {
        console.error("AdSense banner error:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't render in development
  if (process.env.NODE_ENV !== "production") {
    return (
      <div className={`bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-sm text-muted-foreground ${className}`}>
        [Banner Ad Placeholder - Visible in Production]
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Sticky bottom banner wrapper
export function StickyBannerAd({ adSlot }: { adSlot: string }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <BannerAd adSlot={adSlot} />
      </div>
    </div>
  );
}
