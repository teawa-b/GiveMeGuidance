import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter for React Native
// Uses AsyncStorage for all platforms to avoid SecureStore initialization issues
// SecureStore can fail during early app startup before native modules are ready
const SafeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn("[Supabase] Storage getItem error:", error);
      return null;
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
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn("[Supabase] Storage setItem error:", error);
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
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn("[Supabase] Storage removeItem error:", error);
    }
  },
};

// Lazy initialization of Supabase client to avoid crashes during early app startup
let _supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: SafeStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    });
  }
  return _supabaseClient;
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
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
