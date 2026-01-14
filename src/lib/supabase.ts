import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter for React Native
// Web: use localStorage
// Native: use SecureStore for tokens, AsyncStorage for other data
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    // Use SecureStore for auth tokens on native
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fall back to AsyncStorage if SecureStore fails
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore errors
      }
      return;
    }
    // Use SecureStore for auth tokens on native
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Fall back to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

// Database types
export interface Bookmark {
  id: string;
  user_id: string;
  verse_text: string;
  verse_reference: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
