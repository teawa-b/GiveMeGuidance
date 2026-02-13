// Polyfills for React Native
// This import must be first and should be safe as it's designed to work during early initialization
try {
  require("react-native-get-random-values");
} catch (error) {
  console.warn("[Polyfills] react-native-get-random-values failed to load:", error);
}

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

