"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { VerseCard } from "@/components/VerseCard"
import { ExplanationPanel } from "@/components/ExplanationPanel"
import { ChatBox } from "@/components/ChatBox"
import { SquareAd } from "@/components/ads"

interface VerseData {
  reference: {
    book: string
    chapter: number
    verse: number
    passage: string
  }
  text: string
  translation: string
}

interface ExplanationData {
  verse_explanation: string
  connection_to_user_need: string
  guidance_application: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

function GuidanceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [verseData, setVerseData] = useState<VerseData | null>(null)
  const [explanationData, setExplanationData] = useState<ExplanationData | null>(null)
  const [isLoadingVerse, setIsLoadingVerse] = useState(true)
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExplanation = useCallback(async (
    userQuestion: string,
    verseText: string,
    verseReference: string,
    translation: string
  ) => {
    setIsLoadingExplanation(true)

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userQuestion,
          verseText,
          verseReference,
          translation,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to get explanation:", errorData)
        return
      }

      const data: ExplanationData = await response.json()
      setExplanationData(data)
    } catch (err) {
      console.error("Error fetching explanation:", err)
    } finally {
      setIsLoadingExplanation(false)
    }
  }, [])

  const fetchGuidance = useCallback(async (searchQuery: string) => {
    setIsLoadingVerse(true)
    setError(null)
    setExplanationData(null)

    try {
      const response = await fetch("/api/guidance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get guidance")
      }

      const data: VerseData = await response.json()
      setVerseData(data)
      
      // Fetch explanation after getting the verse
      fetchExplanation(searchQuery, data.text, data.reference.passage, data.translation)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoadingVerse(false)
    }
  }, [fetchExplanation])

  useEffect(() => {
    if (!query) {
      router.push("/")
      return
    }
    fetchGuidance(query)
  }, [query, router, fetchGuidance])

  const handleAskFollowUp = () => {
    setShowChat(true)
  }

  const handleGetAnotherVerse = () => {
    // Fetch a new verse with the same query
    fetchGuidance(query)
  }

  const handleSendMessage = (message: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "That's a great question. Based on the verse and your situation, I would encourage you to take time each day to pray and reflect on God's guidance. Sometimes clarity comes through patience and continued trust. Is there a specific area where you're seeking more direction?",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  if (!query) {
    return null
  }

  if (isLoadingVerse) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-24 sm:pt-28">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-lg text-muted-foreground">Finding the perfect verse for you...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-24 sm:pt-28">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-lg text-destructive">Something went wrong</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchGuidance(query)}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    )
  }

  if (!verseData) {
    return null
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        {/* Two column layout on desktop, stacked on mobile */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left column - Verse Card */}
          <div className="space-y-6">
            <VerseCard verseText={verseData.text} verseReference={verseData.reference.passage} />
            
            {/* Square Ad - Below verse card on mobile, visible on all screens */}
            <div className="flex justify-center lg:hidden">
              <SquareAd adSlot="YOUR_SQUARE_AD_SLOT_ID" />
            </div>
          </div>

          {/* Right column - Explanation Panel */}
          <div className="space-y-6">
            <ExplanationPanel
              userQuestion={query}
              explanationData={explanationData}
              isLoadingExplanation={isLoadingExplanation}
              onAskFollowUp={handleAskFollowUp}
              onGetAnotherVerse={handleGetAnotherVerse}
            />

            {/* Chat Box - appears when user clicks "Ask a follow-up" */}
            {showChat && (
              <ChatBox
                initialMessages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            )}

            {/* Square Ad - After chat/explanation on desktop */}
            <div className="hidden lg:flex justify-center">
              <SquareAd adSlot="YOUR_SQUARE_AD_SLOT_ID" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function GuidancePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <GuidanceContent />
    </Suspense>
  )
}
