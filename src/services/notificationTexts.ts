import type { TonePreference } from "./notificationSettings";

// ── A  Daily habit builder ──────────────────────────────────────────

export function dailyReminderText(tone: TonePreference) {
  return {
    title: "Give Me Guidance",
    body:
      tone === "gentle"
        ? "Start your morning with peace."
        : "Take a moment with God before the day runs away.",
  };
}

export function middayNudgeText(tone: TonePreference) {
  return {
    title: "Give Me Guidance",
    body:
      tone === "gentle"
        ? "Take 60 seconds with God."
        : "Pause. Reset. You have time for today's guidance.",
  };
}

export function eveningReflectionText(tone: TonePreference) {
  return {
    title: "Give Me Guidance",
    body:
      tone === "gentle"
        ? "Before you sleep, reflect for a moment."
        : "End today with God, not your worries.",
  };
}

// ── B  Streak protection ────────────────────────────────────────────

export function streakWarn4hText(tone: TonePreference) {
  return {
    title: "Keep your streak alive",
    body:
      tone === "gentle"
        ? "Don't let today slip away."
        : "You're close to losing your streak. Finish today's guidance.",
  };
}

export function streakWarn1hText(tone: TonePreference) {
  return {
    title: "Keep your streak alive",
    body:
      tone === "gentle"
        ? "Your connection is waiting."
        : "One hour left. Keep your streak alive.",
  };
}

export function streakFinalText(tone: TonePreference, streakCount: number) {
  return {
    title: "Keep your streak alive",
    body:
      tone === "gentle"
        ? `You've built this for ${streakCount} days. Don't stop now.`
        : `${streakCount} days strong. Don't break it today.`,
  };
}

// ── C  Celebrations ─────────────────────────────────────────────────

export function milestoneText(streakCount: number) {
  return {
    title: "Give Me Guidance",
    body: `${streakCount} days strong. Keep going.`,
  };
}

// ── D  Re-engagement ────────────────────────────────────────────────

export function reengage2dText(tone: TonePreference) {
  return {
    title: "Give Me Guidance",
    body:
      tone === "gentle"
        ? "It's okay. Come back today."
        : "You've got this. Start again today.",
  };
}

export function reengage5dText(tone: TonePreference) {
  return {
    title: "Give Me Guidance",
    body:
      tone === "gentle"
        ? "God hasn't moved. You can always return."
        : "Come back. Your routine is still here for you.",
  };
}

export function reengageWeeklyText(tone: TonePreference) {
  return {
    title: "Give Me Guidance",
    body:
      tone === "gentle"
        ? "We saved today's message for you."
        : "Let's get back into it today.",
  };
}
