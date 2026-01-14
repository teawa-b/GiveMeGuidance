import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../../src/lib/AuthContext";
import { AuthScreen } from "../../src/components";

export default function AuthIndex() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Auto-redirect when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, router]);

  const handleAuthenticated = () => {
    // The useEffect above will handle the redirect when isAuthenticated becomes true
    // This is a backup in case the state updates slowly
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 500);
  };

  return <AuthScreen onAuthenticated={handleAuthenticated} />;
}
