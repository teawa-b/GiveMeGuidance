"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const PUBLISHER_ID = "ca-pub-7517928309502563";

interface InterstitialAdProps {
  adSlot: string;
  isOpen: boolean;
  onClose: () => void;
  countdownSeconds?: number;
}

export function InterstitialAd({
  adSlot,
  isOpen,
  onClose,
  countdownSeconds = 5,
}: InterstitialAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [canClose, setCanClose] = useState(false);

  // Reset countdown when ad opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(countdownSeconds);
      setCanClose(false);
      isAdLoaded.current = false;
    }
  }, [isOpen, countdownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || canClose) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, canClose]);

  // Load ad when opened
  useEffect(() => {
    if (!isOpen || isAdLoaded.current) return;
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;

    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isAdLoaded.current = true;
      } catch (error) {
        console.error("AdSense interstitial error:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (canClose) {
      onClose();
    }
  }, [canClose, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Click outside to close (only if can close) */}
      {canClose && (
        <div
          className="absolute inset-0"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Close button / Timer */}
      <div className="absolute top-4 right-4 z-10">
        {canClose ? (
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
            <span>Close</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white">
            <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>Skip in {countdown}s</span>
          </div>
        )}
      </div>

      {/* Ad container */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-2 bg-muted/50 text-center text-xs text-muted-foreground">
          Advertisement
        </div>
        <div className="p-4 min-h-[300px] flex items-center justify-center">
          {process.env.NODE_ENV !== "production" ? (
            <div className="bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground w-full">
              <p className="text-lg font-medium mb-2">[Interstitial Ad]</p>
              <p className="text-sm">This ad will display in production</p>
            </div>
          ) : (
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: "block", width: "100%", height: "280px" }}
              data-ad-client={PUBLISHER_ID}
              data-ad-slot={adSlot}
              data-ad-format="rectangle"
            />
          )}
        </div>
      </div>
    </div>
  );
}
