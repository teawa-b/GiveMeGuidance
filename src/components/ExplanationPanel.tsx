"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, RefreshCw } from "lucide-react"

interface ExplanationPanelProps {
  userQuestion: string
  explanation: string
  onAskFollowUp: () => void
  onGetAnotherVerse: () => void
}

export function ExplanationPanel({
  userQuestion,
  explanation,
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
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-card-foreground">Understanding This Verse</h3>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="leading-relaxed whitespace-pre-line">{explanation}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onAskFollowUp}
            className="flex-1 gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Ask a follow-up question
          </Button>
          <Button
            variant="outline"
            onClick={onGetAnotherVerse}
            className="flex-1 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Give me another verse
          </Button>
        </div>
      </div>
    </div>
  )
}
