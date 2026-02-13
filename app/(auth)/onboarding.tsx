import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/lib/AuthContext";
import {
  useOnboarding,
  SpiritualGoal,
  TimeOfDay,
  GuidanceStyle,
  goalDisplayNames,
  styleDisplayNames,
} from "../../src/lib/OnboardingContext";
import { getGuidance } from "../../src/services/guidance";
import { generateDailyWalkApi } from "../../src/services/api";
import {
  cancelAllReminderNotifications,
  requestAndScheduleDailyAndStreakReminders,
} from "../../src/services/notifications";
import { supabase } from "../../src/lib/supabase";
import {
  GoalSelectionScreen,
  TimeSelectionScreen,
  StyleSelectionScreen,
  DailyWalkScreen,
  SaveJourneyScreen,
  NotificationsScreen,
  ProgressScreen,
  LoginScreen,
  DailyWalkData,
  WarmBackground,
} from "../../src/components/onboarding";
import { EmailAuthForm } from "../../src/components/EmailAuthForm";
import { NativeAdLoading } from "../../src/components/NativeAdLoading";
import { SafeAreaView } from "react-native";

type OnboardingStep =
  | "goals"
  | "time"
  | "style"
  | "loading"
  | "daily_walk"
  | "save_journey"
  | "save_journey_email"
  | "notifications"
  | "progress";

export default function OnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, signIn, signUp } = useAuth();
  const { data, updateData, saveOnboarding } = useOnboarding();

  const [step, setStep] = useState<OnboardingStep>("goals");
  const [isGenerating, setIsGenerating] = useState(false);
  const [dailyWalkData, setDailyWalkData] = useState<DailyWalkData | null>(null);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [journeySaved, setJourneySaved] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const streakReminderTime = { hour: 23, minute: 30 };

  // Handle goal toggle
  const handleGoalToggle = (goal: SpiritualGoal) => {
    const currentGoals = data.goalCategories;
    if (currentGoals.includes(goal)) {
      updateData({ goalCategories: currentGoals.filter((g) => g !== goal) });
    } else if (currentGoals.length < 2) {
      updateData({ goalCategories: [...currentGoals, goal] });
    }
  };

  // Handle time selection
  const handleTimeSelect = (time: TimeOfDay, customTime?: string) => {
    updateData({ preferredTimeOfDay: time, customTime });
  };

  // Handle style selection
  const handleStyleSelect = (style: GuidanceStyle) => {
    updateData({ preferredStyle: style });
  };

  // Save preferences to Supabase
  const savePreferencesToSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            goal_categories: data.goalCategories,
            preferred_time_of_day: data.preferredTimeOfDay,
            custom_time: data.customTime || null,
            preferred_style: data.preferredStyle,
            prayer_prompt_enabled: data.prayerPromptEnabled,
            notification_enabled: data.notificationEnabled,
            activation_completed: false,
            onboarding_completed: false,
          }, { onConflict: "user_id" });
      }
    } catch (error) {
      console.error("[Onboarding] Failed to save preferences:", error);
    }
  };

  // Build personalized query based on user preferences
  const buildPersonalizedQuery = (): string => {
    const goals = data.goalCategories;
    const style = data.preferredStyle;
    
    // Build goal context
    const goalDescriptions = goals.map(g => goalDisplayNames[g]).join(" and ");
    
    // Build style context
    let styleContext = "";
    if (style === "gentle") {
      styleContext = "Please provide warm, supportive, and encouraging guidance.";
    } else if (style === "direct") {
      styleContext = "Please be clear, focused, and actionable.";
    } else if (style === "deep") {
      styleContext = "Please provide rich biblical context and scripture study.";
    }

    return `I'm seeking guidance today. My spiritual focus is on: ${goalDescriptions}. ${styleContext}`;
  };

  // Generate daily walk using real API
  const handleGenerateGuidance = async () => {
    // Show loading screen immediately
    setStep("loading");
    setIsGenerating(true);

    try {
      // Save preferences to Supabase first
      await savePreferencesToSupabase();
      
      // Build personalized query
      const query = buildPersonalizedQuery();
      const goals = data.goalCategories;
      const goalDescriptions = goals.map(g => goalDisplayNames[g]).join(" and ");
      
      // Get style description
      let styleDesc = "warm and encouraging";
      if (data.preferredStyle === "direct") {
        styleDesc = "clear and actionable";
      } else if (data.preferredStyle === "deep") {
        styleDesc = "rich with biblical context";
      }
      
      // Get verse from API
      const verseData = await getGuidance(query);
      
      // Get daily walk content (reflection, short step, prayer) from API
      const dailyWalk = await generateDailyWalkApi({
        verseText: verseData.text,
        verseReference: verseData.reference.passage,
        userGoals: goalDescriptions,
        style: styleDesc,
      });
      
      // Transform to DailyWalkData format
      setDailyWalkData({
        verse: verseData.text,
        reference: verseData.reference.passage,
        reflection: dailyWalk.reflection,
        step: dailyWalk.step,
        prayerPrompt: dailyWalk.prayer,
      });
      
      setStep("daily_walk");
    } catch (error) {
      console.error("[Onboarding] Failed to generate guidance:", error);
      // Go back to style screen on error
      setStep("style");
      Alert.alert(
        "Something went wrong",
        "We couldn't generate your guidance. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle step completion
  const handleMarkDone = () => {
    setStepCompleted(true);
    updateData({ activationCompleted: true });

    // If not authenticated, show save journey screen
    if (!isAuthenticated) {
      setStep("save_journey");
    } else {
      // Already authenticated, go to progress
      setJourneySaved(true);
      setStep("progress");
    }
  };

  // Handle save journey authentication
  const handleSaveJourneyAuth = () => {
    setJourneySaved(true);
    setStep("progress");
  };

  // Handle skip save journey
  const handleSkipSaveJourney = () => {
    setStep("progress");
  };

  // Resolve preferred reminder time in 24-hour format
  const getPreferredReminderTime = () => {
    if (data.preferredTimeOfDay === "custom" && data.customTime) {
      const [hours, minutes] = data.customTime.split(":").map(Number);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        return { hour: hours, minute: minutes };
      }
    }

    switch (data.preferredTimeOfDay) {
      case "afternoon":
        return { hour: 12, minute: 0 };
      case "evening":
        return { hour: 18, minute: 0 };
      case "morning":
      default:
        return { hour: 8, minute: 0 };
    }
  };

  // Handle notifications enable
  const handleNotificationsEnable = async (): Promise<boolean> => {
    try {
      const { hour, minute } = getPreferredReminderTime();
      const enabled = await requestAndScheduleDailyAndStreakReminders(
        { hour, minute },
        { streakTime: streakReminderTime }
      );
      setNotificationsEnabled(enabled);
      updateData({ notificationEnabled: enabled });
      return enabled;
    } catch (error) {
      console.error("[Onboarding] Failed to enable reminders:", error);
      setNotificationsEnabled(false);
      updateData({ notificationEnabled: false });
      return false;
    }
  };

  const handleNotificationsContinue = async () => {
    await saveOnboarding({
      onboardingCompleted: true,
      notificationEnabled: notificationsEnabled,
    });
    router.replace("/(tabs)");
  };

  // Handle notifications skip
  const handleNotificationsSkip = async () => {
    try {
      await cancelAllReminderNotifications();
    } catch (error) {
      console.error("[Onboarding] Failed to cancel reminders:", error);
    }

    setNotificationsEnabled(false);
    updateData({ notificationEnabled: false });
    await saveOnboarding({
      onboardingCompleted: true,
      notificationEnabled: false,
    });
    router.replace("/(tabs)");
  };

  // Handle continue to home
  const handleContinueToHome = () => {
    setStep("notifications");
  };

  // Get display time based on preference
  const getDisplayTime = () => {
    if (data.preferredTimeOfDay === "custom" && data.customTime) {
      const [hours, minutes] = data.customTime.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    }
    switch (data.preferredTimeOfDay) {
      case "morning":
        return "8:00 AM";
      case "afternoon":
        return "12:00 PM";
      case "evening":
        return "6:00 PM";
      default:
        return "8:00 AM";
    }
  };

  // Get next scheduled time display
  const getNextScheduledTime = () => {
    const timeLabel = data.preferredTimeOfDay === "custom" ? getDisplayTime() : data.preferredTimeOfDay;
    return `Tomorrow ${timeLabel}`;
  };

  // Email auth handlers
  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      setEmailLoading(true);
      setEmailError(null);
      const result = await signIn(email, password);
      if (result.error) {
        setEmailError(result.error);
        throw new Error(result.error);
      }
      handleSaveJourneyAuth();
    } catch (e: any) {
      if (!emailError) {
        setEmailError(e.message || "Invalid email or password");
      }
      throw e;
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    try {
      setEmailLoading(true);
      setEmailError(null);
      const result = await signUp(email, password);
      if (result.error) {
        setEmailError(result.error);
        throw new Error(result.error);
      }
      if (result.needsConfirmation) {
        setJourneySaved(true);
        const verificationMessage =
          "We've sent a verification link to your email. Please verify your email to finish setting up your account.";

        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(verificationMessage);
        } else {
          Alert.alert("Check your email", verificationMessage, [{ text: "Continue" }]);
        }

        setStep("progress");
        return;
      }

      handleSaveJourneyAuth();
    } catch (e: any) {
      if (!emailError) {
        setEmailError(e.message || "Could not create account");
      }
      throw e;
    } finally {
      setEmailLoading(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (step) {
      case "goals":
        return (
          <GoalSelectionScreen
            selectedGoals={data.goalCategories}
            onGoalToggle={handleGoalToggle}
            onContinue={() => setStep("time")}
            onBack={() => router.back()}
          />
        );

      case "time":
        return (
          <TimeSelectionScreen
            selectedTime={data.preferredTimeOfDay}
            customTime={data.customTime}
            onTimeSelect={handleTimeSelect}
            onContinue={() => setStep("style")}
            onBack={() => setStep("goals")}
          />
        );

      case "style":
        return (
          <StyleSelectionScreen
            selectedStyle={data.preferredStyle}
            onStyleSelect={handleStyleSelect}
            onContinue={handleGenerateGuidance}
            onBack={() => setStep("time")}
          />
        );

      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <WarmBackground />
            <NativeAdLoading
              isVisible={true}
              loadingMessage="Finding the perfect verse for you..."
              hideAds={true}
            />
          </View>
        );

      case "daily_walk":
        return dailyWalkData ? (
          <DailyWalkScreen
            data={dailyWalkData}
            onMarkDone={handleMarkDone}
            showPrayerPrompt={data.prayerPromptEnabled}
          />
        ) : null;

      case "save_journey":
        return (
          <SaveJourneyScreen
            onAuthenticated={handleSaveJourneyAuth}
            onSkip={handleSkipSaveJourney}
            onEmailPress={() => setStep("save_journey_email")}
          />
        );

      case "save_journey_email":
        return (
          <View style={styles.container}>
            <WarmBackground />
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.content}>
                <EmailAuthForm
                  onSignIn={handleEmailSignIn}
                  onSignUp={handleEmailSignUp}
                  onBack={() => {
                    setStep("save_journey");
                    setEmailError(null);
                  }}
                  loading={emailLoading}
                  error={emailError}
                />
              </View>
            </SafeAreaView>
          </View>
        );

      case "notifications":
        return (
          <NotificationsScreen
            preferredTime={getDisplayTime()}
            onEnable={handleNotificationsEnable}
            onContinue={handleNotificationsContinue}
            onSkip={handleNotificationsSkip}
          />
        );

      case "progress":
        return (
          <ProgressScreen
            streakDays={1}
            nextScheduledTime={getNextScheduledTime()}
            savedCount={1}
            reminderSet={notificationsEnabled}
            journeySaved={journeySaved || isAuthenticated}
            onViewSavedGuidance={() => router.push("/(tabs)/bookmarks")}
            onExploreTopics={() => router.push("/(tabs)/new")}
            onContinueToHome={handleContinueToHome}
          />
        );

      default:
        return null;
    }
  };

  return renderStep();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
  },
});


