"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Bookmark, Menu, X, Sparkles } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs"

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bookmarks", label: "Saved", icon: Bookmark },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-6">
      {/* Floating glass navbar */}
      <nav className="w-full max-w-2xl">
        <div className="relative rounded-2xl border border-white/20 bg-white/60 px-2 py-2 shadow-lg shadow-black/5 backdrop-blur-xl sm:rounded-full sm:px-3">
          {/* Gradient border effect */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-50 blur-xl sm:rounded-full" />
          
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-black/5 sm:rounded-full">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-emerald-400 opacity-20 blur-sm transition-opacity group-hover:opacity-40" />
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <span className="hidden text-base font-semibold text-foreground sm:block">GiveMeGuidance</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-emerald-500/10 shadow-inner" />
                    )}
                    <Icon className={cn("relative h-4 w-4", isActive && "text-primary")} />
                    <span className="relative">{link.label}</span>
                  </Link>
                )
              })}
            </div>

<<<<<<< HEAD
            {/* CTA Button / Auth - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Sign in
                </button>
              )}
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-100"
              >
                <Sparkles className="h-4 w-4" />
                Get Guidance
              </Link>
=======
            {/* CTA Button - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-100">
                    <Sparkles className="h-4 w-4" />
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
>>>>>>> 8d1fb4a (Add Clerk authentication and Google AdSense integration)
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Menu</span>
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-2 shadow-lg backdrop-blur-xl">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary/10 to-emerald-500/10 text-foreground"
                        : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                    {link.label}
                  </Link>
                )
              })}
              <div className="pt-2 space-y-2">
<<<<<<< HEAD
                {isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium text-muted-foreground hover:bg-black/5"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true)
                      setMobileMenuOpen(false)
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium text-muted-foreground hover:bg-black/5"
                  >
                    <User className="h-5 w-5" />
                    Sign in
                  </button>
                )}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-500 px-4 py-3 text-base font-semibold text-white shadow-md"
                >
                  <Sparkles className="h-5 w-5" />
                  Get Guidance
                </Link>
=======
                <SignedOut>
                  <SignInButton mode="modal">
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-3 text-base font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-500 px-4 py-3 text-base font-semibold text-white shadow-md"
                    >
                      <Sparkles className="h-5 w-5" />
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex justify-center py-2">
                    <UserButton />
                  </div>
                </SignedIn>
>>>>>>> 8d1fb4a (Add Clerk authentication and Google AdSense integration)
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </header>
  )
}
