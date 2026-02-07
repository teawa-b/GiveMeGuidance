import { Redirect } from "expo-router";
import { useAuth } from "../src/lib/AuthContext";
import { View, ActivityIndicator, StyleSheet, Image } from "react-native";

// Bird icon for loading screen
const appLogo = require("../assets/mascot/bird-reading.png");

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Image source={appLogo} style={styles.loadingLogo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#10b981" style={styles.loadingSpinner} />
      </View>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
  },
  loadingLogo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 24,
  },
  loadingSpinner: {
    marginTop: 8,
  },
});
