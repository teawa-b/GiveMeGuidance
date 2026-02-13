import React, { useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { mediumHaptic } from "../../src/lib/haptics";
import { playClickSound } from "../../src/lib/sounds";
import { NewGuidanceModal } from "../../src/components/NewGuidanceModal";

export default function TabLayout() {
  const [newGuidanceModalVisible, setNewGuidanceModalVisible] = useState(false);
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const CenterButton = () => {
    return (
      <Pressable
        style={styles.centerButton}
        onPress={() => {
          playClickSound();
          mediumHaptic();
          setNewGuidanceModalVisible(true);
        }}
      >
        <View style={styles.centerButtonInner}>
          <Ionicons name="add" size={26} color="#ffffff" />
        </View>
      </Pressable>
    );
  };

  // Auth is handled by root layout, so we can just render tabs
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#10b981",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            borderTopWidth: 1,
            borderTopColor: "rgba(226, 232, 240, 0.2)",
            paddingTop: 12,
            paddingBottom: 28,
            height: isIOS ? 85 : 80,
            ...(isIOS
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 8,
                }
              : isWeb
                ? ({ backdropFilter: "blur(24px)" } as any)
                : {
                    elevation: 0,
                  }),
          },
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: 4,
          },
          tabBarShowLabel: true,
          headerShown: false,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            playClickSound();
          },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "chatbubbles" : "chatbubbles-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            playClickSound();
          },
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: "New",
          tabBarButton: () => <CenterButton />,
        }}
        listeners={{
          tabPress: (e) => {
            playClickSound();
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bookmark" : "bookmark-outline"}
              size={24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            playClickSound();
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            playClickSound();
          },
        }}
      />
    </Tabs>

    {/* New Guidance Modal */}
    <NewGuidanceModal
      visible={newGuidanceModalVisible}
      onClose={() => setNewGuidanceModalVisible(false)}
    />
  </>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginTop: -8,
  },
  centerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#10b981",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
        }
      : Platform.OS === "web"
        ? ({ boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)" } as any)
        : {
            elevation: 8,
          }),
  },
});


