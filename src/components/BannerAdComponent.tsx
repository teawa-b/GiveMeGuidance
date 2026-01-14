PS C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance> npx expo run:android
env: load .env
env: export EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY EXPO_PUBLIC_OPENROUTER_API_KEY
› Port 8081 is being used by another process
√ Use port 8082 instead? ... no
› Skipping dev server
› Building app...
Downloading https://services.gradle.org/distributions/gradle-8.14.3-bin.zip
.............10%.............20%.............30%.............40%.............50%.............60%.............70%.............80%.............90%..............100%

Welcome to Gradle 8.14.3!

Here are the highlights of this release:
 - Java 24 support
 - GraalVM Native Image toolchain selection
 - Enhancements to test reporting
 - Build Authoring improvements

For more details see https://docs.gradle.org/8.14.3/release-notes.html

Starting a Gradle Daemon (subsequent builds will be faster)
Configuration on demand is an incubating feature.

[Incubating] Problems report is available at: file:///C:/Users/ttsup/Desktop/Mini%20App%20Projects%20SIDE%20PROJECTS/GiveMeGuidance/android/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* Where:
Settings file 'C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\android\settings.gradle' line: 21

* What went wrong:
Error resolving plugin [id: 'com.facebook.react.settings']
> org.gradle.api.internal.catalog.GeneratedClassCompilationException: No Java compiler found, please ensure you are running Gradle with a JDK

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.14.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD FAILED in 1m 14s
Error: C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\android\gradlew.bat app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a,armeabi-v7a exited with non-zero code: 1
Error: C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\android\gradlew.bat app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a,armeabi-v7a exited with non-zero code: 1
    at ChildProcess.completionListener (C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\node_modules\@expo\spawn-async\src\spawnAsync.ts:67:13)
    at Object.onceWrapper (node:events:622:26)
    at ChildProcess.emit (node:events:507:28)
    at ChildProcess.cp.emit (C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\node_modules\cross-spawn\lib\enoent.js:34:29)
    at maybeClose (node:internal/child_process:1101:16)
    at Process.ChildProcess._handle.onexit (node:internal/child_process:305:5)
    ...
    at spawnAsync (C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\node_modules\@expo\spawn-async\src\spawnAsync.ts:28:21)
    at spawnGradleAsync (C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\node_modules\expo\node_modules\@expo\cli\src\start\platforms\android\gradle.ts:134:28)
    at assembleAsync (C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\node_modules\expo\node_modules\@expo\cli\src\start\platforms\android\gradle.ts:83:16)
    at runAndroidAsync (C:\Users\ttsup\Desktop\Mini App Projects SIDE PROJECTS\GiveMeGuidance\node_modules\expo\node_modules\@expo\cli\src\run\android\runAndroidAsync.ts:62:24)import React, { useState } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

interface BannerAdComponentProps {
  style?: object;
}

export function BannerAdComponent({ style }: BannerAdComponentProps) {
  const { shouldShowAds, bannerAdUnitId, isAdsInitialized } = useAds();
  const { isPremium } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't render anything if premium or on web
  if (isPremium || Platform.OS === "web") {
    return null;
  }

  // Don't show if ads shouldn't be displayed
  if (!shouldShowAds) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {isAdsInitialized && !adError ? (
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log("[AdMob] Banner ad loaded");
            setAdLoaded(true);
          }}
          onAdFailedToLoad={(error) => {
            console.log("[AdMob] Banner ad failed to load:", error);
            setAdError(true);
          }}
        />
      ) : adError ? null : (
        // Show placeholder while initializing
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Loading ad...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  placeholder: {
    width: 320,
    height: 50,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 11,
    color: "#d1d5db",
  },
});
