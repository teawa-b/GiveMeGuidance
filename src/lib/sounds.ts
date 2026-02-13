import { useAudioPlayer, AudioPlayer } from "expo-audio";

// Sound instances for reuse
let appOpenedPlayer: AudioPlayer | null = null;
let guidanceLoadedPlayer: AudioPlayer | null = null;
let clickPlayer: AudioPlayer | null = null;

// Play click sound for tab navigation
export const playClickSound = async () => {
  try {
    const { createAudioPlayer } = await import("expo-audio");
    
    // Clean up previous player if exists
    if (clickPlayer) {
      clickPlayer.release();
      clickPlayer = null;
    }
    
    // Use haptics instead if no click sound file exists
    // You can add a click.mp3 file to assets/HomeScreenAssets/ if desired
    try {
      clickPlayer = createAudioPlayer(
        require("../../assets/HomeScreenAssets/Click.mp3")
      );
      clickPlayer.volume = 0.3;
      clickPlayer.play();
    } catch {
      // No click sound file - silently ignore
      console.log("[Sounds] No click sound file found");
    }
  } catch (error) {
    console.error("Error playing click sound:", error);
  }
};

// Play app opened sound
export const playAppOpenedSound = async () => {
  try {
    // Create a new audio player for the sound
    const { createAudioPlayer } = await import("expo-audio");
    
    // Clean up previous player if exists
    if (appOpenedPlayer) {
      appOpenedPlayer.release();
      appOpenedPlayer = null;
    }
    
    appOpenedPlayer = createAudioPlayer(
      require("../../assets/HomeScreenAssets/AppOpened.mp3")
    );
    
    appOpenedPlayer.volume = 0.5;
    appOpenedPlayer.play();
  } catch (error) {
    console.error("Error playing app opened sound:", error);
  }
};

// Play guidance loaded sound
export const playGuidanceLoadedSound = async () => {
  try {
    const { createAudioPlayer } = await import("expo-audio");
    
    // Clean up previous player if exists
    if (guidanceLoadedPlayer) {
      guidanceLoadedPlayer.release();
      guidanceLoadedPlayer = null;
    }
    
    guidanceLoadedPlayer = createAudioPlayer(
      require("../../assets/HomeScreenAssets/AskedForGuidance.mp3")
    );
    
    guidanceLoadedPlayer.volume = 0.5;
    guidanceLoadedPlayer.play();
  } catch (error) {
    console.error("Error playing guidance loaded sound:", error);
  }
};

// Cleanup function to release all audio players
export const unloadAllSounds = async () => {
  try {
    if (appOpenedPlayer) {
      appOpenedPlayer.release();
      appOpenedPlayer = null;
    }
    if (guidanceLoadedPlayer) {
      guidanceLoadedPlayer.release();
      guidanceLoadedPlayer = null;
    }
    if (clickPlayer) {
      clickPlayer.release();
      clickPlayer = null;
    }
  } catch (error) {
    console.error("Error unloading sounds:", error);
  }
};

