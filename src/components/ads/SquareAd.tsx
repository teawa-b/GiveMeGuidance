"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const PUBLISHER_ID = "ca-pub-7517928309502563";

interface SquareAdProps {
  adSlot: string;
  className?: string;
}

export function SquareAd({ adSlot, className = "" }: SquareAdProps) {
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
        console.error("AdSense square ad error:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't render in development
  if (process.env.NODE_ENV !== "production") {
    return (
      <div className={`bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-sm text-muted-foreground aspect-square max-w-[300px] flex items-center justify-center ${className}`}>
        [Square Ad Placeholder]
        <br />
        300x250
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "inline-block", width: "300px", height: "250px" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={adSlot}
      />
    </div>
  );
}
