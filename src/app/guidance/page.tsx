"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { VerseCard } from "@/components/VerseCard"
import { ExplanationPanel } from "@/components/ExplanationPanel"
import { ChatBox } from "@/components/ChatBox"

// Mock data - replace with actual API calls later
const mockVerse = {
  text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
  reference: "Proverbs 3:5-6",
}

const mockExplanation = `This verse is a powerful reminder that true wisdom comes from trusting God rather than relying solely on our own limited understanding.

When you're feeling lost or uncertain about the direction of your life, this passage encourages you to:

1. **Trust completely** - Not partially, but with "all your heart." This means surrendering your worries and fears to God.

2. **Let go of self-reliance** - Our own understanding is limited. We can't see the full picture, but God can.

3. **Submit in all areas** - Not just the big decisions, but every aspect of life should be aligned with God's will.

4. **Receive His guidance** - When we do these things, God promises to direct our paths and make them clear.

This verse speaks directly to your situation. When life feels overwhelming or confusing, remember that you don't have to figure everything out on your own. Trust in God's plan, even when you can't see the next step.`

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

  useEffect(() => {
    if (!query) {
      router.push("/")
    }
  }, [query, router])

  const handleAskFollowUp = () => {
    setShowChat(true)
  }

  const handleGetAnotherVerse = () => {
    // In a real app, this would fetch a new verse
    // For now, we'll just refresh with the same query
    router.refresh()
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

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Two column layout on desktop, stacked on mobile */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left column - Verse Card */}
          <div className="space-y-6">
            <VerseCard verseText={mockVerse.text} verseReference={mockVerse.reference} />
          </div>

          {/* Right column - Explanation Panel */}
          <div className="space-y-6">
            <ExplanationPanel
              userQuestion={query}
              explanation={mockExplanation}
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
