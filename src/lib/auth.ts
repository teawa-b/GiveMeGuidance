// Re-export auth utilities from supabase and AuthContext
export { supabase } from "./supabase";
export { AuthProvider, useAuth } from "./AuthContext";

// App scheme for deep linking
export const APP_SCHEME = "givemeguidance";

