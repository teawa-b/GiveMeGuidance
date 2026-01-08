import { convexAuth } from "@convex-dev/auth/server"
import { Password } from "@convex-dev/auth/providers/Password"

// Start with just Password auth
// Google and Apple will be added once you configure credentials
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
})
