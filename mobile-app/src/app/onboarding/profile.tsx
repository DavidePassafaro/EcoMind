import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { focusAreas, goals, profiles } from '@/constants/onboarding';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/providers/onboarding-context';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const {
    focus: selectedFocus,
    profile: selectedProfile,
    goal: selectedGoal,
    setFocus: setSelectedFocus,
    setProfile: setSelectedProfile,
    setGoal: setSelectedGoal,
    completeOnboarding,
    completed,
    isReady,
  } = useOnboarding();

  const activeFocus = focusAreas.find((item) => item.id === selectedFocus) ?? focusAreas[0];
  const activeProfile = profiles.find((item) => item.id === selectedProfile) ?? profiles[0];

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
            <View style={styles.header}>
              <View style={styles.stepBadge}>
                <ThemedText type="smallBold" style={styles.stepBadgeText}>
                  Step 2 of 2
                </ThemedText>
              </View>
              <ThemedText type="title" style={styles.title}>
                Impostiamo il tuo percorso iniziale.
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Scegli da dove partire. EcoMind usera queste preferenze per costruire suggerimenti
                piu rilevanti fin dal primo giorno.
              </ThemedText>
            </View>

            <ThemedView style={styles.summaryBanner}>
              <View style={styles.summaryColumn}>
                <ThemedText type="smallBold" style={styles.summaryLabel}>
                  Focus attuale
                </ThemedText>
                <ThemedText style={styles.summaryValue}>{activeFocus.title}</ThemedText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryColumn}>
                <ThemedText type="smallBold" style={styles.summaryLabel}>
                  Profilo
                </ThemedText>
                <ThemedText style={styles.summaryValue}>{activeProfile.title}</ThemedText>
              </View>
            </ThemedView>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                1. Dove vuoi vedere il primo cambiamento?
              </ThemedText>
              <View style={styles.optionStack}>
                {focusAreas.map((item) => {
                  const selected = item.id === selectedFocus;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedFocus(item.id)}
                      style={({ pressed }) => [styles.optionPressable, pressed && styles.pressed]}>
                      <ThemedView
                        type="backgroundElement"
                        style={[
                          styles.optionCard,
                          selected && {
                            backgroundColor: theme.backgroundSelected,
                            borderColor: '#2F6A50',
                          },
                        ]}>
                        <View style={styles.optionHeader}>
                          <ThemedText type="smallBold">{item.title}</ThemedText>
                          <View
                            style={[
                              styles.radio,
                              selected && styles.radioSelected,
                              selected && { borderColor: '#2F6A50' },
                            ]}>
                            {selected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                        <ThemedText themeColor="textSecondary" style={styles.optionDescription}>
                          {item.description}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                2. Come ti descrivi oggi?
              </ThemedText>
              <View style={styles.profileGrid}>
                {profiles.map((item) => {
                  const selected = item.id === selectedProfile;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedProfile(item.id)}
                      style={({ pressed }) => [styles.profilePressable, pressed && styles.pressed]}>
                      <ThemedView
                        type="backgroundElement"
                        style={[
                          styles.profileCard,
                          selected && {
                            backgroundColor: '#102E22',
                            borderColor: '#58C27D',
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={[styles.profileTitle, selected && styles.profileTitleSelected]}>
                          {item.title}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.profileDescription,
                            selected && styles.profileDescriptionSelected,
                          ]}>
                          {item.description}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                3. Qual e il tuo obiettivo principale?
              </ThemedText>
              <View style={styles.goalRow}>
                {goals.map((goal) => {
                  const selected = goal === selectedGoal;
                  return (
                    <Pressable
                      key={goal}
                      onPress={() => setSelectedGoal(goal)}
                      style={({ pressed }) => [styles.goalPressable, pressed && styles.pressed]}>
                      <ThemedView
                        type="backgroundElement"
                        style={[
                          styles.goalChip,
                          selected && {
                            backgroundColor: '#D7F2E0',
                            borderColor: '#2F6A50',
                          },
                        ]}>
                        <ThemedText type="smallBold" style={selected && styles.goalChipSelected}>
                          {goal}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ThemedView type="backgroundElement" style={styles.recapCard}>
              <ThemedText type="smallBold" style={styles.recapLabel}>
                Anteprima del tuo piano
              </ThemedText>
              <ThemedText type="subtitle" style={styles.recapTitle}>
                Primo sprint EcoMind
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.recapBody}>
                Inizieremo da <ThemedText type="smallBold">{activeFocus.title}</ThemedText> con un
                tono pensato per chi si definisce{' '}
                <ThemedText type="smallBold">{activeProfile.title}</ThemedText>. Il primo obiettivo
                sara <ThemedText type="smallBold">{selectedGoal.toLowerCase()}</ThemedText>.
              </ThemedText>

              <View style={styles.recapList}>
                <View style={styles.recapListItem}>
                  <View style={styles.recapBullet} />
                  <ThemedText type="small">3 azioni rapide da completare entro questa settimana</ThemedText>
                </View>
                <View style={styles.recapListItem}>
                  <View style={styles.recapBullet} />
                  <ThemedText type="small">Un check-in giornaliero leggero, senza attrito</ThemedText>
                </View>
                <View style={styles.recapListItem}>
                  <View style={styles.recapBullet} />
                  <ThemedText type="small">Una metrica chiara per vedere se stai migliorando</ThemedText>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  completeOnboarding();
                  router.replace('/(tabs)');
                }}
                style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.finishButtonText}>
                  Entra in EcoMind
                </ThemedText>
              </Pressable>
            </ThemedView>
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
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    backgroundColor: '#D7F2E0',
  },
  stepBadgeText: {
    color: '#1E5D43',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  summaryBanner: {
    borderRadius: 28,
    padding: Spacing.four,
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  summaryColumn: {
    flex: 1,
    gap: Spacing.one,
  },
  summaryLabel: {
    color: '#2F6A50',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryValue: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: 700,
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(47,106,80,0.18)',
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  optionStack: {
    gap: Spacing.two,
  },
  optionPressable: {
    borderRadius: 24,
  },
  optionCard: {
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  optionDescription: {
    fontSize: 15,
    lineHeight: 23,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  radioSelected: {
    backgroundColor: '#E7F6EC',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2F6A50',
  },
  profileGrid: {
    gap: Spacing.two,
  },
  profilePressable: {
    borderRadius: 24,
  },
  profileCard: {
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profileTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  profileTitleSelected: {
    color: '#F4FFF5',
  },
  profileDescription: {
    color: '#5D625E',
    fontSize: 15,
    lineHeight: 22,
  },
  profileDescriptionSelected: {
    color: '#C6DCCF',
  },
  goalRow: {
    gap: Spacing.two,
  },
  goalPressable: {
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  goalChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalChipSelected: {
    color: '#1E5D43',
  },
  recapCard: {
    borderRadius: 32,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  recapLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#2F6A50',
  },
  recapTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  recapBody: {
    fontSize: 16,
    lineHeight: 24,
  },
  recapList: {
    gap: Spacing.two,
  },
  recapListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  recapBullet: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#58C27D',
  },
  finishButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: '#0F2B20',
    marginTop: Spacing.one,
  },
  finishButtonText: {
    color: '#F6FFF7',
  },
  pressed: {
    opacity: 0.85,
  },
});
