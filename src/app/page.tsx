import { SearchBar } from "@/components/SearchBar"
import { VineDecoration, VineCorner } from "@/components/VineDecoration"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24">
      {/* Multi-layer background */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-emerald-50/50 via-background to-background" />
      
      {/* Animated gradient orbs */}
      <div className="absolute left-1/4 top-1/4 -z-10 h-[400px] w-[400px] animate-float rounded-full bg-gradient-to-br from-primary/20 to-emerald-300/20 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 -z-10 h-[350px] w-[350px] animate-float-delayed rounded-full bg-gradient-to-br from-emerald-300/20 to-teal-300/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Vine decorations - corners */}
      <VineCorner className="absolute left-0 top-0 h-36 w-36 text-primary/80 sm:h-44 sm:w-44 md:h-56 md:w-56" />
      <VineCorner className="absolute right-0 top-0 h-36 w-36 -scale-x-100 text-primary/80 sm:h-44 sm:w-44 md:h-56 md:w-56" />
      <VineCorner className="absolute bottom-0 left-0 h-36 w-36 -scale-y-100 text-primary/80 sm:h-44 sm:w-44 md:h-56 md:w-56" />
      <VineCorner className="absolute bottom-0 right-0 h-36 w-36 -scale-x-100 -scale-y-100 text-primary/80 sm:h-44 sm:w-44 md:h-56 md:w-56" />

      {/* Side vines - hidden on mobile */}
      <VineDecoration className="absolute -left-4 top-1/2 hidden h-[500px] w-28 -translate-y-1/2 text-primary/60 lg:block" />
      <VineDecoration className="absolute -right-4 top-1/2 hidden h-[500px] w-28 -translate-y-1/2 -scale-x-100 text-primary/60 lg:block" />

      <div className="relative z-10 w-full max-w-2xl space-y-10 text-center">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            Powered by Scripture
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-5">
          <h1 className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
            What do you need{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent">guidance</span>
            {" "}on today?
          </h1>
          <p className="mx-auto max-w-lg text-muted-foreground text-base sm:text-lg md:text-xl">
            Share what's on your heart, and receive personalized wisdom from Scripture.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex justify-center pt-2">
          <SearchBar />
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Biblical wisdom</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Personalized guidance</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Private & secure</span>
          </div>
        </div>
      </div>
    </main>
  )
}
