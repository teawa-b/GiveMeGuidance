// Polyfills for React Native
import "react-native-get-random-values";

// Polyfill for window.addEventListener (needed for some libraries)
if (typeof window !== "undefined" && !window.addEventListener) {
  // @ts-ignore
  window.addEventListener = () => {};
  // @ts-ignore
  window.removeEventListener = () => {};
}

// Polyfill for navigator.onLine
if (typeof navigator !== "undefined" && navigator.onLine === undefined) {
  // @ts-ignore
  Object.defineProperty(navigator, "onLine", {
    get: () => true,
    configurable: true,
  });
}
