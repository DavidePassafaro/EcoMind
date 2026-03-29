import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { onboardingPoints } from '@/constants/onboarding';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/providers/onboarding-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { completed, isReady } = useOnboarding();

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (completed) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.shell}>
            <View style={[styles.heroFrame, { backgroundColor: theme.heroBackground }]}>
              <View style={[styles.ambientOrb, styles.orbLeft, { backgroundColor: theme.heroAccent }]} />
              <View
                style={[
                  styles.ambientOrb,
                  styles.orbRight,
                  { backgroundColor: theme.heroAccentSecondary },
                ]}
              />

              <ThemedView style={styles.heroCard}>
                <View style={[styles.pill, { backgroundColor: theme.heroOverlay }]}>
                  <ThemedText type="smallBold" style={[styles.pillText, { color: theme.heroText }]}>
                    Welcome to EcoMind
                  </ThemedText>
                </View>

                <View style={styles.heroCopy}>
                  <ThemedText type="title" style={[styles.title, { color: theme.heroText }]}>
                    Rendi sostenibili le scelte di ogni giorno.
                  </ThemedText>
                  <ThemedText style={[styles.subtitle, { color: theme.heroSubtext }]}>
                    Un onboarding breve per capire dove sei, cosa puoi migliorare e come iniziare
                    senza complicarti la giornata.
                  </ThemedText>
                </View>

                <ThemedView style={[styles.highlightCard, { backgroundColor: theme.heroSurface }]}>
                  <ThemedText type="smallBold" style={[styles.highlightLabel, { color: theme.brandText }]}>
                    Primo passo
                  </ThemedText>
                  <ThemedText style={[styles.highlightTitle, { color: theme.brandTextStrong }]}>
                    Crea il tuo profilo eco in meno di 2 minuti.
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Ti guideremo tra abitudini, obiettivi e priorita iniziali.
                  </ThemedText>
                </ThemedView>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => router.push('/onboarding/profile')}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { backgroundColor: theme.heroSurface },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" style={[styles.primaryButtonText, { color: theme.brandTextStrong }]}>
                      Inizia onboarding
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/onboarding/profile')}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      { borderColor: theme.border, backgroundColor: theme.heroOverlay },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                      Scopri l'app
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, styles.statusDotActive, { backgroundColor: theme.heroText }]} />
                  <View style={[styles.statusDot, { backgroundColor: theme.heroOverlay }]} />
                  <ThemedText type="small" style={{ color: theme.heroSubtext }}>
                    onboarding step 1 of 2
                  </ThemedText>
                </View>
              </ThemedView>
            </View>

            <View style={styles.pointsSection}>
              {onboardingPoints.map((point) => (
                <ThemedView key={point.title} type="backgroundElement" style={styles.pointCard}>
                  <ThemedText type="code" style={styles.pointEyebrow}>
                    {point.eyebrow}
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.pointTitle}>
                    {point.title}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.pointBody}>
                    {point.body}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
  },
  shell: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  heroFrame: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 32,
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.9,
  },
  orbLeft: {
    width: 220,
    height: 220,
    left: -60,
    top: -20,
  },
  orbRight: {
    width: 240,
    height: 240,
    right: -90,
    top: 70,
  },
  heroCard: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
    backgroundColor: 'transparent',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pillText: {
    letterSpacing: 0.4,
  },
  heroCopy: {
    gap: Spacing.three,
  },
  title: {
    fontSize: 42,
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 620,
  },
  highlightCard: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  highlightLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  highlightTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  actions: {
    gap: Spacing.two,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  primaryButtonText: {},
  secondaryButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusDotActive: {
    width: 28,
  },
  pointsSection: {
    gap: Spacing.three,
  },
  pointCard: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  pointEyebrow: {
    letterSpacing: 1.2,
  },
  pointTitle: {
    fontSize: 27,
    lineHeight: 34,
  },
  pointBody: {
    fontSize: 16,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.84,
  },
});
