import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { EcoDataProvider } from '@/providers/eco-data-context';
import { OnboardingProvider } from '@/providers/onboarding-context';
import { ThemePreferenceProvider, useThemePreference } from '@/providers/theme-preference-context';

function AppRoot() {
  const { resolvedTheme } = useThemePreference();
  const palette = Colors[resolvedTheme];

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OnboardingProvider>
        <EcoDataProvider>
          <StatusBar
            style={resolvedTheme === 'dark' ? 'light' : 'dark'}
            backgroundColor={palette.background}
          />
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" />
            <Stack.Screen name="onboarding/profile" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </EcoDataProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <AppRoot />
    </ThemePreferenceProvider>
  );
}
