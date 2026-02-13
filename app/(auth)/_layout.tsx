import { Stack } from "expo-router";

export default function AuthLayout() {
  // Auth redirection is handled by root layout
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
    </Stack>
  );
}


