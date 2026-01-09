import { ConvexReactClient } from "convex/react";

// Auth client configuration
export const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

// OAuth redirect URIs
export const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/api/auth/callback/google`;
export const APPLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/api/auth/callback/apple`;

// App scheme for deep linking
export const APP_SCHEME = "givemeguidance";
