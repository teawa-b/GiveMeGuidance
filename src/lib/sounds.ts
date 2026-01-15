import { Audio } from "expo-av";

// Sound instances for reuse
let appOpenedSound: Audio.Sound | null = null;
let guidanceLoadedSound: Audio.Sound | null = null;

// Configure audio mode for playback
const configureAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.error("Error configuring audio:", error);
  }
};

// Play app opened sound
export const playAppOpenedSound = async () => {
  try {
    await configureAudio();
    
    // Unload previous sound if exists
    if (appOpenedSound) {
      await appOpenedSound.unloadAsync();
    }
    
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/HomeScreenAssets/AppOpened.mp3"),
      { shouldPlay: true, volume: 0.5 }
    );
    
    appOpenedSound = sound;
    
    // Clean up when done playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        appOpenedSound = null;
      }
    });
  } catch (error) {
    console.error("Error playing app opened sound:", error);
  }
};

// Play guidance loaded sound
export const playGuidanceLoadedSound = async () => {
  try {
    await configureAudio();
    
    // Unload previous sound if exists
    if (guidanceLoadedSound) {
      await guidanceLoadedSound.unloadAsync();
    }
    
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/HomeScreenAssets/AskedForGuidance.mp3"),
      { shouldPlay: true, volume: 0.5 }
    );
    
    guidanceLoadedSound = sound;
    
    // Clean up when done playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        guidanceLoadedSound = null;
      }
    });
  } catch (error) {
    console.error("Error playing guidance loaded sound:", error);
  }
};

// Cleanup function to unload all sounds
export const unloadAllSounds = async () => {
  try {
    if (appOpenedSound) {
      await appOpenedSound.unloadAsync();
      appOpenedSound = null;
    }
    if (guidanceLoadedSound) {
      await guidanceLoadedSound.unloadAsync();
      guidanceLoadedSound = null;
    }
  } catch (error) {
    console.error("Error unloading sounds:", error);
  }
};
