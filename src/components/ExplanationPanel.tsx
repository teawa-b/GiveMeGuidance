"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, RefreshCw, Loader2 } from "lucide-react"

interface ExplanationData {
  verse_explanation: string
  connection_to_user_need: string
  guidance_application: string
}

interface ExplanationPanelProps {
  userQuestion: string
  explanationData: ExplanationData | null
  isLoadingExplanation: boolean
  onAskFollowUp: () => void
  onGetAnotherVerse: () => void
}

export function ExplanationPanel({
  userQuestion,
  explanationData,
  isLoadingExplanation,
  onAskFollowUp,
  onGetAnotherVerse,
}: ExplanationPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-6">
        {/* User's original question */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Your question</p>
          <p className="text-base text-card-foreground">{userQuestion}</p>
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* AI Explanation */}
        {isLoadingExplanation ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Preparing your guidance...</p>
            </div>
          </div>
        ) : explanationData ? (
          <div className="space-y-6">
            {/* Verse Explanation */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-card-foreground">Understanding This Verse</h3>
              <p className="text-muted-foreground leading-relaxed">{explanationData.verse_explanation}</p>
            </div>

            {/* Connection to User's Need */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-card-foreground">How This Speaks to You</h3>
              <p className="text-muted-foreground leading-relaxed">{explanationData.connection_to_user_need}</p>
            </div>

            {/* Guidance/Application */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-card-foreground">Living It Out</h3>
              <p className="text-muted-foreground leading-relaxed">{explanationData.guidance_application}</p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Unable to load explanation. Please try again.</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onAskFollowUp}
            className="flex-1 gap-2"
            disabled={isLoadingExplanation}
          >
            <MessageCircle className="h-4 w-4" />
            Ask a follow-up question
          </Button>
          <Button
            variant="outline"
            onClick={onGetAnotherVerse}
            className="flex-1 gap-2"
            disabled={isLoadingExplanation}
          >
            <RefreshCw className="h-4 w-4" />
            Give me another verse
          </Button>
        </div>
      </div>
    </div>
  )
}
