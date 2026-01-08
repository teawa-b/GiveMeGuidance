// Polyfills for React Native to support Convex
import "react-native-get-random-values";

// Polyfill for window.addEventListener (needed by Convex WebSocket)
if (typeof window !== "undefined" && !window.addEventListener) {
  // @ts-ignore
  window.addEventListener = () => {};
  // @ts-ignore
  window.removeEventListener = () => {};
}

// Polyfill for navigator.onLine (needed by Convex)
if (typeof navigator !== "undefined" && navigator.onLine === undefined) {
  // @ts-ignore
  Object.defineProperty(navigator, "onLine", {
    get: () => true,
    configurable: true,
  });
}
