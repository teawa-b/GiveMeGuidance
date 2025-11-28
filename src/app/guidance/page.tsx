"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { VerseCard } from "@/components/VerseCard"
import { ExplanationPanel } from "@/components/ExplanationPanel"
import { ChatBox } from "@/components/ChatBox"
import { Loader2 } from "lucide-react"

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
  const [isLoadingVerse, setIsLoadingVerse] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuidance = useCallback(async (searchQuery: string) => {
    setIsLoadingVerse(true)
    setError(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoadingVerse(false)
    }
  }, [])

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
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
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

  // Generate a contextual explanation based on the verse and user's question
  const explanation = `This verse from ${verseData.reference.passage} (${verseData.translation}) speaks directly to your heart.

"${verseData.text}"

This passage was selected because it addresses the themes in your question. The book of ${verseData.reference.book} offers wisdom that can provide comfort and direction during times like these.

Take a moment to reflect on how these words apply to your situation. Sometimes the most profound guidance comes from sitting quietly with Scripture and allowing its meaning to unfold in your heart.`

  return (
    <main className="min-h-screen px-4 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        {/* Two column layout on desktop, stacked on mobile */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left column - Verse Card */}
          <div className="space-y-6">
            <VerseCard verseText={verseData.text} verseReference={verseData.reference.passage} />
          </div>

          {/* Right column - Explanation Panel */}
          <div className="space-y-6">
            <ExplanationPanel
              userQuestion={query}
              explanation={explanation}
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
