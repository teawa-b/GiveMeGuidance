import React from "react";
import { View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";

// This is a placeholder screen for the center tab button.
// The center button redirects to the home screen, so this won't be displayed.
export default function NewScreen() {
  return <Redirect href="/" />;
}
