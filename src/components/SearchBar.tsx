"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { InterstitialAd } from "@/components/ads"

const placeholderPrompts = [
  "I'm feeling anxious about the future...",
  "I need direction in my career...",
  "I'm struggling with forgiveness...",
  "How do I find peace in hard times?",
  "I feel lost and need hope...",
  "Help me overcome my fears...",
  "I'm dealing with grief and loss...",
  "How can I strengthen my faith?",
]

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [placeholder, setPlaceholder] = useState("")
  const [promptIndex, setPromptIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [isFocused, setIsFocused] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [pendingQuery, setPendingQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Typewriter effect
  useEffect(() => {
    if (isFocused || query) return // Stop animation when focused or has input

    const currentPrompt = placeholderPrompts[promptIndex]
    let timeout: NodeJS.Timeout

    if (isTyping) {
      // Typing phase
      if (placeholder.length < currentPrompt.length) {
        timeout = setTimeout(() => {
          setPlaceholder(currentPrompt.slice(0, placeholder.length + 1))
        }, 60) // Typing speed
      } else {
        // Pause at end of typing
        timeout = setTimeout(() => {
          setIsTyping(false)
        }, 2000) // Pause before erasing
      }
    } else {
      // Erasing phase
      if (placeholder.length > 0) {
        timeout = setTimeout(() => {
          setPlaceholder(placeholder.slice(0, -1))
        }, 30) // Erasing speed (faster than typing)
      } else {
        // Move to next prompt
        setPromptIndex((prev) => (prev + 1) % placeholderPrompts.length)
        setIsTyping(true)
      }
    }

    return () => clearTimeout(timeout)
  }, [placeholder, isTyping, promptIndex, isFocused, query])

  // Reset animation when focus is lost and no query
  useEffect(() => {
    if (!isFocused && !query) {
      setPlaceholder("")
      setIsTyping(true)
    }
  }, [isFocused, query])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Show interstitial ad before navigating
      setPendingQuery(query.trim())
      setShowInterstitial(true)
    }
  }

  const handleInterstitialClose = () => {
    setShowInterstitial(false)
    if (pendingQuery) {
      router.push(`/guidance?q=${encodeURIComponent(pendingQuery)}`)
      setPendingQuery("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
      {/* Search container */}
      <div className="group relative">
        {/* Animated gradient border */}
        <div className={cn(
          "absolute -inset-[2px] rounded-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 opacity-0 blur-sm transition-all duration-500",
          isFocused ? "opacity-100" : "group-hover:opacity-60"
        )} />
        
        {/* Glow effect */}
        <div className={cn(
          "absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 via-emerald-400/20 to-teal-400/20 opacity-0 blur-2xl transition-all duration-500",
          isFocused ? "opacity-100" : "group-hover:opacity-50"
        )} />
        
        {/* Input wrapper */}
        <div className="relative overflow-hidden rounded-full bg-white shadow-xl ring-1 ring-black/5">
          {/* Subtle inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary/5" />
          
          <div className="relative flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5">
            {/* Search icon */}
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300",
              isFocused 
                ? "bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/30" 
                : "bg-primary/10 text-primary"
            )}>
              <Search className="h-5 w-5" />
            </div>
            
            {/* Input */}
            <div className="relative flex-1">
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-base text-foreground outline-none sm:text-lg"
              />
              
              {/* Animated placeholder */}
              {!query && (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <span className="text-base text-muted-foreground/70 sm:text-lg">
                    {placeholder}
                    <span className={cn(
                      "ml-0.5 inline-block h-5 w-0.5 bg-primary/50 align-middle",
                      isTyping && !isFocused ? "animate-pulse" : "opacity-0"
                    )} />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!query.trim()}
        className={cn(
          "group/btn relative w-full overflow-hidden rounded-full p-[2px] transition-all duration-300",
          query.trim() 
            ? "hover:scale-[1.02] active:scale-[0.98]" 
            : "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Animated gradient background */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-r from-primary via-emerald-500 to-teal-500 transition-all duration-300",
          query.trim() && "group-hover/btn:from-emerald-500 group-hover/btn:via-primary group-hover/btn:to-emerald-500"
        )} />
        
        {/* Button inner */}
        <div className="relative flex h-14 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary via-emerald-500 to-teal-500 px-8 text-base font-semibold text-white shadow-lg shadow-primary/25 sm:h-16 sm:text-lg">
          <Sparkles className="h-5 w-5" />
          <span>Get Guidance</span>
          <ArrowRight className={cn(
            "h-5 w-5 transition-transform duration-300",
            query.trim() && "group-hover/btn:translate-x-1"
          )} />
        </div>
      </button>

      {/* Helper text */}
      <p className="text-center text-xs text-muted-foreground/60 sm:text-sm">
        Press Enter to submit • Your questions are private
      </p>

      {/* Interstitial Ad */}
      <InterstitialAd
        adSlot="YOUR_INTERSTITIAL_AD_SLOT_ID"
        isOpen={showInterstitial}
        onClose={handleInterstitialClose}
        countdownSeconds={5}
      />
    </form>
  )
}
