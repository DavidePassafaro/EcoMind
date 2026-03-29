import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeeklyTrendChart } from '@/components/weekly-trend-chart';
import { dashboardCopy, focusAreas, focusPlans, profiles } from '@/constants/onboarding';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useEcoData } from '@/providers/eco-data-context';
import { useOnboarding } from '@/providers/onboarding-context';
import { useThemePreference } from '@/providers/theme-preference-context';

export default function PlanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { mode, setMode } = useThemePreference();
  const { completed, focus, profile, goal, resetOnboarding, isReady } = useOnboarding();
  const {
    isReady: isEcoDataReady,
    checkIns,
    completedActionsCount,
    weeklyTrend,
    weeklyCompletionRate,
    previousWeeklyTrend,
    weeklyComparison,
    resetEcoData,
  } = useEcoData();

  if (!isReady || !isEcoDataReady) {
    return <LoadingScreen />;
  }

  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  const activeFocus = focusAreas.find((item) => item.id === focus) ?? focusAreas[0];
  const activeProfile = profiles.find((item) => item.id === profile) ?? profiles[0];
  const currentDashboard = dashboardCopy[focus];
  const currentPlan = focusPlans[focus];
  const recentCheckIns = checkIns.slice(0, 5);
  const moodLabels = {
    great: 'Benissimo',
    ok: 'Normale',
    hard: 'Difficile',
  } as const;

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
              <View style={[styles.pill, { backgroundColor: theme.positiveSurface }]}>
                <ThemedText type="smallBold" style={[styles.pillText, { color: theme.positiveText }]}>
                  Piano personale
                </ThemedText>
              </View>
              <ThemedText type="title" style={styles.title}>
                Il tuo setup iniziale
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Qui puoi vedere il profilo generato dall'onboarding e rivederlo in ogni momento.
              </ThemedText>
            </View>

            <ThemedView type="backgroundElement" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryBlock}>
                  <ThemedText type="smallBold" style={[styles.summaryLabel, { color: theme.brandText }]}>
                    Focus
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>{activeFocus.title}</ThemedText>
                </View>
                <View style={styles.summaryBlock}>
                  <ThemedText type="smallBold" style={[styles.summaryLabel, { color: theme.brandText }]}>
                    Profilo
                  </ThemedText>
                  <ThemedText style={styles.summaryValue}>{activeProfile.title}</ThemedText>
                </View>
              </View>
              <View style={styles.summaryBlock}>
                <ThemedText type="smallBold" style={[styles.summaryLabel, { color: theme.brandText }]}>
                  Obiettivo
                </ThemedText>
                <ThemedText style={styles.summaryValue}>{goal}</ThemedText>
              </View>
              <View style={styles.summaryBlock}>
                <ThemedText type="smallBold" style={[styles.summaryLabel, { color: theme.brandText }]}>
                  Azioni chiuse
                </ThemedText>
                <ThemedText style={styles.summaryValue}>{completedActionsCount}</ThemedText>
              </View>
            </ThemedView>

            <View style={styles.list}>
              <ThemedView type="backgroundElement" style={styles.listCard}>
                <ThemedText type="code" style={[styles.listEyebrow, { color: theme.brandText }]}>
                  WEEK 1
                </ThemedText>
                <ThemedText type="subtitle" style={styles.listTitle}>
                  Cosa sblocchi adesso
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.listBody}>
                  EcoMind iniziera da questa azione: {currentDashboard.action}
                </ThemedText>
                <View style={styles.milestones}>
                  {currentPlan.milestones.map((milestone) => (
                    <View key={milestone} style={styles.milestoneRow}>
                      <View style={[styles.milestoneBullet, { backgroundColor: theme.success }]} />
                      <ThemedText type="small">{milestone}</ThemedText>
                    </View>
                  ))}
                </View>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.listCard}>
                <ThemedText type="code" style={[styles.listEyebrow, { color: theme.brandText }]}>
                  HISTORY
                </ThemedText>
                <ThemedText type="subtitle" style={styles.listTitle}>
                  Ultimi check-in
                </ThemedText>
                {recentCheckIns.length > 0 ? (
                  <View style={styles.historyList}>
                    {recentCheckIns.map((entry) => (
                      <View key={entry.date} style={styles.historyRow}>
                        <ThemedText type="smallBold">{entry.date}</ThemedText>
                        <ThemedText themeColor="textSecondary">{moodLabels[entry.mood]}</ThemedText>
                      </View>
                    ))}
                  </View>
                ) : (
                  <ThemedText themeColor="textSecondary" style={styles.listBody}>
                    Nessun check-in ancora registrato. Inizia dalla dashboard per creare il primo segnale.
                  </ThemedText>
                )}
              </ThemedView>

              <WeeklyTrendChart
                title="Trend settimanale"
                subtitle={`Vista rapida dei segnali raccolti questa settimana. Copertura ${weeklyCompletionRate}%.`}
                points={weeklyTrend}
                comparison={weeklyComparison}
              />

              <ThemedView type="backgroundElement" style={styles.listCard}>
                <ThemedText type="code" style={[styles.listEyebrow, { color: theme.brandText }]}>
                  APPEARANCE
                </ThemedText>
                <ThemedText type="subtitle" style={styles.listTitle}>
                  Tema dell'app
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.listBody}>
                  Light e il tema consigliato per EcoMind. Se preferisci, puoi forzare dark o seguire il sistema.
                </ThemedText>
                <View style={styles.themeModeRow}>
                  {(['system', 'light', 'dark'] as const).map((option) => {
                    const selected = mode === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setMode(option)}
                        style={({ pressed }) => [styles.themeModePressable, pressed && styles.pressed]}>
                        <ThemedView
                          type="backgroundSelected"
                          style={[
                            styles.themeModeChip,
                            selected && {
                              backgroundColor: theme.positiveSurface,
                              borderColor: theme.tint,
                            },
                          ]}>
                          <ThemedText
                            type="smallBold"
                            style={selected ? { color: theme.positiveText } : undefined}>
                            {option === 'system'
                              ? 'System'
                              : option === 'light'
                                ? 'Light'
                                : 'Dark'}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    );
                  })}
                </View>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.listCard}>
                <ThemedText type="code" style={[styles.listEyebrow, { color: theme.brandText }]}>
                  COMPARE
                </ThemedText>
                <ThemedText type="subtitle" style={styles.listTitle}>
                  Settimana corrente vs precedente
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.listBody}>
                  Score medio {weeklyComparison.currentWeekAverageScore} contro{' '}
                  {weeklyComparison.previousWeekAverageScore}. Check-in registrati{' '}
                  {weeklyComparison.currentWeekCheckInCount} contro{' '}
                  {weeklyComparison.previousWeekCheckInCount}.
                </ThemedText>
                <View style={styles.compareGrid}>
                  <View style={[styles.compareStat, { backgroundColor: theme.positiveSurface }]}>
                    <ThemedText type="smallBold" style={[styles.compareValue, { color: theme.positiveText }]}>
                      {weeklyComparison.scoreDelta >= 0 ? '+' : ''}
                      {weeklyComparison.scoreDelta}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      delta score medio
                    </ThemedText>
                  </View>
                  <View style={[styles.compareStat, { backgroundColor: theme.positiveSurface }]}>
                    <ThemedText type="smallBold" style={[styles.compareValue, { color: theme.positiveText }]}>
                      {weeklyComparison.completionDelta >= 0 ? '+' : ''}
                      {weeklyComparison.completionDelta}%
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      delta copertura
                    </ThemedText>
                  </View>
                  <View style={[styles.compareStat, { backgroundColor: theme.positiveSurface }]}>
                    <ThemedText type="smallBold" style={[styles.compareValue, { color: theme.positiveText }]}>
                      {weeklyComparison.actionDelta >= 0 ? '+' : ''}
                      {weeklyComparison.actionDelta}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      delta azioni
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.previousWeekRow}>
                  {previousWeeklyTrend.map((point) => (
                    <View key={point.date} style={[styles.previousWeekItem, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="smallBold">{point.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {point.score}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.listCard}>
                <ThemedText type="code" style={[styles.listEyebrow, { color: theme.brandText }]}>
                  EDIT
                </ThemedText>
                <ThemedText type="subtitle" style={styles.listTitle}>
                  Vuoi cambiare qualcosa?
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.listBody}>
                  Puoi riaprire il setup iniziale e affinare focus, obiettivi e intensita del piano.
                </ThemedText>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => router.push('/onboarding/profile')}
                    style={({ pressed }) => [styles.secondaryPressable, pressed && styles.pressed]}>
                    <View style={[styles.secondaryAction, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="smallBold">Modifica preferenze</ThemedText>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      resetOnboarding();
                      resetEcoData();
                      router.replace('/onboarding');
                    }}
                    style={({ pressed }) => [styles.primaryPressable, pressed && styles.pressed]}>
                    <View style={[styles.primaryAction, { backgroundColor: theme.darkSurface }]}>
                      <ThemedText type="smallBold" style={styles.primaryActionText}>
                        Rifai onboarding
                      </ThemedText>
                    </View>
                  </Pressable>
                </View>
              </ThemedView>
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
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.three,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pillText: {},
  title: {
    fontSize: 38,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  summaryCard: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  summaryBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  summaryLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
  },
  list: {
    gap: Spacing.three,
  },
  listCard: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  listEyebrow: {
    letterSpacing: 1.1,
  },
  listTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  listBody: {
    fontSize: 16,
    lineHeight: 24,
  },
  milestones: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  milestoneBullet: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  historyList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  compareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  compareStat: {
    minWidth: 100,
    flex: 1,
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  compareValue: {
    fontSize: 22,
    lineHeight: 26,
  },
  previousWeekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  previousWeekItem: {
    minWidth: 48,
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  themeModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  themeModePressable: {
    borderRadius: 999,
  },
  themeModeChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  secondaryPressable: {
    borderRadius: 999,
  },
  secondaryAction: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  primaryPressable: {
    borderRadius: 999,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  primaryActionText: {
    color: '#F6FFF7',
  },
  pressed: {
    opacity: 0.86,
  },
});
