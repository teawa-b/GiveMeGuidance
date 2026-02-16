import type { TonePreference } from "./notificationSettings";

interface NotificationCopy {
  title: string;
  body: string;
}

type ToneBodyBuckets = Record<TonePreference, readonly string[]>;
type ToneTemplateBuckets = Record<TonePreference, readonly ((streakCount: number) => string)[]>;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickToneBody(tone: TonePreference, buckets: ToneBodyBuckets, seed: string): string {
  const options = buckets[tone] ?? buckets.gentle;
  return options[hashSeed(seed) % options.length];
}

function pickToneTemplate(
  tone: TonePreference,
  buckets: ToneTemplateBuckets,
  seed: string,
): (streakCount: number) => string {
  const options = buckets[tone] ?? buckets.gentle;
  return options[hashSeed(seed) % options.length];
}

function buildCopy(
  title: string,
  tone: TonePreference,
  buckets: ToneBodyBuckets,
  seed: string,
): NotificationCopy {
  return {
    title,
    body: pickToneBody(tone, buckets, seed),
  };
}

const DAILY_REMINDER_BODIES: ToneBodyBuckets = {
  gentle: [
    "Start your day with a quiet moment and today's guidance.",
    "God is with you this morning. Open your daily guidance.",
    "Take two peaceful minutes for today's walk.",
    "A calm start can change the whole day. Read your guidance.",
    "Breathe, pray, and begin with today's guidance.",
  ],
  direct: [
    "Start now: open today's guidance before your day gets busy.",
    "Two minutes. One clear step. Read today's guidance.",
    "Stay consistent. Complete your guidance for today.",
    "Pause scrolling and do today's guidance.",
    "Lock in your day with today's guidance.",
  ],
  deep: [
    "Begin with Scripture depth: your daily guidance is ready.",
    "Start today by studying what God may be teaching you.",
    "Open today's guidance for context, reflection, and prayer.",
    "Your deeper Bible walk for today is waiting.",
    "Anchor your morning in the Word with today's guidance.",
  ],
};

const MIDDAY_NUDGE_BODIES: ToneBodyBuckets = {
  gentle: [
    "Take 60 seconds for a peaceful reset with guidance.",
    "Pause for a breath and a short moment with God.",
    "Midday is a good time to reconnect.",
    "A quick check-in can steady your heart.",
    "Give yourself a gentle pause with today's guidance.",
  ],
  direct: [
    "Midday check-in: complete today's guidance now.",
    "Pause and reset. Do your guidance before the afternoon gets away.",
    "Quick action: open today's guidance.",
    "Take two minutes now and stay on track.",
    "Stop and focus. Finish today's guidance.",
  ],
  deep: [
    "Take a midday Scripture pause; your guidance is ready.",
    "Use this break for a deeper reflection.",
    "Reconnect with the Word before the day moves on.",
    "A short Bible-focused reset can refocus your afternoon.",
    "Midday study moment: open today's guidance.",
  ],
};

const EVENING_REFLECTION_BODIES: ToneBodyBuckets = {
  gentle: [
    "Before rest, take a peaceful moment with today's guidance.",
    "Close the day with grace and reflection.",
    "End tonight with a quiet check-in with God.",
    "A short evening reflection can settle your heart.",
    "Finish your day gently with today's guidance.",
  ],
  direct: [
    "End the day right: complete today's guidance tonight.",
    "Before sleep, finish your daily check-in.",
    "Close your day with purpose. Open guidance now.",
    "One step tonight keeps your momentum.",
    "Do today's reflection before the day ends.",
  ],
  deep: [
    "Close tonight in Scripture and prayer.",
    "End your day with a deeper reflection on the Word.",
    "Take an evening study moment before rest.",
    "Let today's final minutes be rooted in Scripture.",
    "Finish the day with thoughtful biblical reflection.",
  ],
};

const STREAK_WARN_4H_BODIES: ToneBodyBuckets = {
  gentle: [
    "You still have time today. Keep your streak going gently.",
    "Your streak can stay strong with one short check-in.",
    "A small moment now protects the rhythm you've built.",
    "Come back for today's guidance and keep your streak alive.",
    "Your daily connection is waiting; your streak can continue.",
  ],
  direct: [
    "4 hours left. Complete today's guidance to keep the streak.",
    "Do it now so your streak does not expire tonight.",
    "You're close to losing progress. Finish today's guidance.",
    "Protect your streak: one session before the deadline.",
    "Act now. Keep the streak alive.",
  ],
  deep: [
    "Four hours remain to stay rooted in your Scripture rhythm.",
    "Return to the Word today so your streak stays unbroken.",
    "Keep your study streak alive with today's guidance.",
    "Stay faithful to your rhythm before today's window closes.",
    "Preserve your Bible habit: complete today's guidance.",
  ],
};

const STREAK_WARN_1H_BODIES: ToneBodyBuckets = {
  gentle: [
    "One hour left. Your streak can still be protected.",
    "You are close. A quick moment now keeps your rhythm.",
    "Your connection is waiting. Keep your streak alive.",
    "One short check-in can carry your streak forward.",
    "You still have time to close today well.",
  ],
  direct: [
    "One hour left. Complete today's guidance now.",
    "Final hour: act now to save your streak.",
    "Do not lose today's progress. Finish now.",
    "This is your one-hour warning. Keep the streak.",
    "Last hour before reset. Get it done.",
  ],
  deep: [
    "One hour remains to stay faithful to your Scripture rhythm.",
    "Return now and keep your study streak unbroken.",
    "A final hour to stay grounded in the Word.",
    "Do today's reflection before the day closes.",
    "One more hour to protect your Bible habit.",
  ],
};

const STREAK_FINAL_TEMPLATES: ToneTemplateBuckets = {
  gentle: [
    (streakCount) => `${streakCount} days of faithfulness are worth protecting tonight.`,
    (streakCount) => `You have nurtured this for ${streakCount} days. Keep it alive.`,
    (streakCount) => `Only minutes left and ${streakCount} days are on the line.`,
    (streakCount) => `Your ${streakCount}-day rhythm matters. Finish today with peace.`,
    (streakCount) => `One short step now keeps your ${streakCount}-day streak intact.`,
  ],
  direct: [
    (streakCount) => `${streakCount} days. Do not let it break in the final minutes.`,
    (streakCount) => `Last call: protect your ${streakCount}-day streak now.`,
    (streakCount) => `${streakCount} days strong. Finish today before time runs out.`,
    (streakCount) => `Final warning. Save your ${streakCount}-day streak.`,
    (streakCount) => `Take action now or lose ${streakCount} days of momentum.`,
  ],
  deep: [
    (streakCount) => `Guard your ${streakCount}-day Scripture rhythm before today closes.`,
    (streakCount) => `${streakCount} days in the Word. Keep that thread unbroken tonight.`,
    (streakCount) => `Final moments to preserve your ${streakCount}-day journey with God.`,
    (streakCount) => `Finish today and carry your ${streakCount}-day study streak forward.`,
    (streakCount) => `Stay faithful in this final window; protect ${streakCount} days.`,
  ],
};

const MILESTONE_TEMPLATES: ToneTemplateBuckets = {
  gentle: [
    (streakCount) => `${streakCount} days strong. God has met you each step.`,
    (streakCount) => `Beautiful consistency: ${streakCount} days of daily guidance.`,
    (streakCount) => `${streakCount} days of showing up. Keep going with grace.`,
    (streakCount) => `You are growing day by day. ${streakCount} days and counting.`,
    (streakCount) => `What a gift: ${streakCount} faithful days in a row.`,
  ],
  direct: [
    (streakCount) => `${streakCount} days complete. Keep the standard high.`,
    (streakCount) => `${streakCount}-day milestone reached. Stay locked in.`,
    (streakCount) => `Strong work: ${streakCount} days. Do not slow down now.`,
    (streakCount) => `${streakCount} days done. Next milestone starts today.`,
    (streakCount) => `Consistency wins. ${streakCount} days and building.`,
  ],
  deep: [
    (streakCount) => `${streakCount} days in Scripture. That is real spiritual depth.`,
    (streakCount) => `${streakCount} days of seeking God in the Word. Keep digging.`,
    (streakCount) => `Milestone reached: ${streakCount} days of faithful study.`,
    (streakCount) => `${streakCount} days of reflection and prayer. Keep going deeper.`,
    (streakCount) => `Your ${streakCount}-day Bible rhythm is bearing fruit.`,
  ],
};

const REENGAGE_2D_BODIES: ToneBodyBuckets = {
  gentle: [
    "It's okay to restart today. Your guidance is here.",
    "No pressure, just begin again with today's walk.",
    "You've been missed. Take a gentle step back in today.",
    "Come back for a quiet moment with God today.",
    "Grace is new today. Open your guidance when you're ready.",
  ],
  direct: [
    "Two days away. Restart your streak today.",
    "Get back in today with one guidance session.",
    "Reset now. Your next step is waiting.",
    "Do not drift longer. Return today.",
    "Open the app and complete today's guidance.",
  ],
  deep: [
    "Return to the Word today and re-center your heart.",
    "Pick up your Bible rhythm again with today's guidance.",
    "Two days away from study. Rejoin today.",
    "Step back into Scripture reflection today.",
    "Your next passage is waiting. Come back today.",
  ],
};

const REENGAGE_5D_BODIES: ToneBodyBuckets = {
  gentle: [
    "Your place is still here whenever you're ready.",
    "It's been a few days; come back gently today.",
    "We saved space for you. Start again with grace.",
    "A fresh start is waiting in today's guidance.",
    "Come as you are. Your daily walk can restart now.",
  ],
  direct: [
    "Five days off. Time to rebuild your routine.",
    "Return now and reclaim your momentum.",
    "You've paused long enough. Start again today.",
    "Re-enter the habit with one guidance session.",
    "Open today's guidance and get back on track.",
  ],
  deep: [
    "Five days away from Scripture. Return and go deeper today.",
    "Your Bible rhythm can restart right now.",
    "Come back to thoughtful reflection and prayer today.",
    "Step back into the Word; your guidance is ready.",
    "Reconnect with Scripture today and rebuild your cadence.",
  ],
};

const REENGAGE_WEEKLY_BODIES: ToneBodyBuckets = {
  gentle: [
    "We're still here for you. Today's message is ready.",
    "Whenever you're ready, your guidance is waiting.",
    "Take one calm step back today.",
    "A gentle restart can begin right now.",
    "Your daily walk is always open to you.",
  ],
  direct: [
    "New week, new start. Open today's guidance now.",
    "Return this week and rebuild consistency.",
    "Do not wait for perfect timing. Start today.",
    "Your routine needs a reset. Begin now.",
    "Check in today and regain momentum.",
  ],
  deep: [
    "Start this week in the Word. Your guidance is ready.",
    "Rejoin your Scripture rhythm with today's passage.",
    "Return for deeper reflection this week.",
    "Let this week begin with prayer and study.",
    "Come back to the Word and start fresh today.",
  ],
};

export function dailyReminderText(tone: TonePreference, seed = "dailyReminder"): NotificationCopy {
  return buildCopy("Give Me Guidance", tone, DAILY_REMINDER_BODIES, `dailyReminder:${seed}:${tone}`);
}

export function middayNudgeText(tone: TonePreference, seed = "middayNudge"): NotificationCopy {
  return buildCopy("Give Me Guidance", tone, MIDDAY_NUDGE_BODIES, `middayNudge:${seed}:${tone}`);
}

export function eveningReflectionText(tone: TonePreference, seed = "eveningReflection"): NotificationCopy {
  return buildCopy(
    "Give Me Guidance",
    tone,
    EVENING_REFLECTION_BODIES,
    `eveningReflection:${seed}:${tone}`,
  );
}

export function streakWarn4hText(tone: TonePreference, seed = "streakWarn4h"): NotificationCopy {
  return buildCopy("Keep your streak alive", tone, STREAK_WARN_4H_BODIES, `streakWarn4h:${seed}:${tone}`);
}

export function streakWarn1hText(tone: TonePreference, seed = "streakWarn1h"): NotificationCopy {
  return buildCopy("Keep your streak alive", tone, STREAK_WARN_1H_BODIES, `streakWarn1h:${seed}:${tone}`);
}

export function streakFinalText(
  tone: TonePreference,
  streakCount: number,
  seed = "streakFinal",
): NotificationCopy {
  return {
    title: "Keep your streak alive",
    body: pickToneTemplate(tone, STREAK_FINAL_TEMPLATES, `streakFinal:${seed}:${tone}`)(streakCount),
  };
}

export function milestoneText(
  tone: TonePreference,
  streakCount: number,
  seed = "milestone",
): NotificationCopy {
  return {
    title: "Give Me Guidance",
    body: pickToneTemplate(tone, MILESTONE_TEMPLATES, `milestone:${seed}:${tone}`)(streakCount),
  };
}

export function reengage2dText(tone: TonePreference, seed = "reengage2d"): NotificationCopy {
  return buildCopy("Give Me Guidance", tone, REENGAGE_2D_BODIES, `reengage2d:${seed}:${tone}`);
}

export function reengage5dText(tone: TonePreference, seed = "reengage5d"): NotificationCopy {
  return buildCopy("Give Me Guidance", tone, REENGAGE_5D_BODIES, `reengage5d:${seed}:${tone}`);
}

export function reengageWeeklyText(tone: TonePreference, seed = "reengageWeekly"): NotificationCopy {
  return buildCopy(
    "Give Me Guidance",
    tone,
    REENGAGE_WEEKLY_BODIES,
    `reengageWeekly:${seed}:${tone}`,
  );
}
