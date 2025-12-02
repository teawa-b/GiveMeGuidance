"use client";

import Script from "next/script";

const PUBLISHER_ID = "ca-pub-7517928309502563";

export function AdSenseScript() {
  // Only load in production to avoid policy violations
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onError={(e) => {
        console.error("AdSense script failed to load", e);
      }}
    />
  );
}
