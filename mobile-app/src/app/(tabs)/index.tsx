import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChallengeCarousel } from '@/components/challenge-carousel';
import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeeklyTrendChart } from '@/components/weekly-trend-chart';
import { dashboardCopy, focusPlans, profileCopy } from '@/constants/onboarding';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useEcoData } from '@/providers/eco-data-context';
import { useOnboarding } from '@/providers/onboarding-context';
import { acceptChallenge, getAvailableChallenges } from '@/services/challenges';
import type { Challenge } from '@/types/challenge';

export default function DashboardScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const { completed, focus, profile, goal, isReady } = useOnboarding();
  const {
    isReady: isEcoDataReady,
    todaysCheckIn,
    currentStreak,
    completedActionDates,
    completedActionsCount,
    acceptedChallenges,
    weeklyTrend,
    weeklyCompletionRate,
    weeklyComparison,
    completeTodayAction,
    undoTodayAction,
    saveAcceptedChallenge,
    submitCheckIn,
  } = useEcoData();
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [isChallengesLoading, setIsChallengesLoading] = useState(false);
  const [challengesError, setChallengesError] = useState<string | null>(null);
  const [acceptingChallengeId, setAcceptingChallengeId] = useState<string | null>(null);

  async function loadChallenges() {
    setIsChallengesLoading(true);
    setChallengesError(null);

    try {
      const nextChallenges = await getAvailableChallenges();
      setAvailableChallenges(nextChallenges);
    } catch (error) {
      setAvailableChallenges([]);
      setChallengesError(
        error instanceof Error
          ? error.message
          : 'Non sono riuscito a recuperare le challenge dal server.'
      );
    } finally {
      setIsChallengesLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady || !isEcoDataReady || !completed) {
      return;
    }

    let isMounted = true;

    void loadChallenges().catch(() => {
      // Errors are already handled inside loadChallenges.
    });

    return () => {
      isMounted = false;
    };
  }, [completed, isEcoDataReady, isReady]);

  async function handleAcceptChallenge(challengeId: string) {
    setAcceptingChallengeId(challengeId);
    setChallengesError(null);

    try {
      await acceptChallenge(challengeId);
      setAvailableChallenges((current) => {
        const acceptedChallenge = current.find((challenge) => challenge.id === challengeId);

        if (acceptedChallenge) {
          saveAcceptedChallenge({ ...acceptedChallenge, isAccepted: true });
        }

        return current.map((challenge) =>
          challenge.id === challengeId ? { ...challenge, isAccepted: true } : challenge
        );
      });
    } catch (error) {
      setChallengesError(
        error instanceof Error
          ? error.message
          : 'Non sono riuscito ad attivare la challenge selezionata.'
      );
    } finally {
      setAcceptingChallengeId(null);
    }
  }

  if (!isReady || !isEcoDataReady) {
    return <LoadingScreen />;
  }

  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  const currentDashboard = dashboardCopy[focus];
  const currentPlan = focusPlans[focus];
  const actionDoneToday = completedActionDates.includes(new Date().toISOString().slice(0, 10));
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
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <View style={styles.pill}>
                  <ThemedText type="smallBold" style={styles.pillText}>
                    Dashboard
                  </ThemedText>
                </View>
                <ThemedText type="title" style={styles.title}>
                  {currentDashboard.title}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                  {profileCopy[profile]}
                </ThemedText>
              </View>

              <ThemedView type="backgroundElement" style={styles.metricCard}>
                <ThemedText type="smallBold" style={styles.metricLabel}>
                  {currentPlan.scoreLabel}
                </ThemedText>
                <ThemedText style={styles.metricValue}>{currentPlan.score}/100</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Streak attuale: {currentStreak} giorni consecutivi
                </ThemedText>
              </ThemedView>
            </View>

            <View style={styles.cards}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="code" style={styles.cardEyebrow}>
                  TODAY
                </ThemedText>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Azione consigliata
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.cardBody}>
                  {currentDashboard.action}
                </ThemedText>
                <Pressable
                  onPress={actionDoneToday ? undoTodayAction : completeTodayAction}
                  style={({ pressed }) => [styles.inlineActionPressable, pressed && styles.pressed]}>
                  <ThemedView
                    type="backgroundSelected"
                    style={[styles.inlineAction, actionDoneToday && styles.inlineActionDone]}>
                    <ThemedText type="smallBold" style={actionDoneToday && styles.inlineActionTextDone}>
                      {actionDoneToday ? 'Segnata come completata' : currentPlan.actionLabel}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="code" style={styles.cardEyebrow}>
                  CHECK-IN
                </ThemedText>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Routine di oggi
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.cardBody}>
                  {todaysCheckIn
                    ? `Hai gia registrato oggi: ${moodLabels[todaysCheckIn.mood]}. Puoi aggiornarlo se necessario.`
                    : 'Dedica 60 secondi a registrare come e andata oggi. Questo rendera i suggerimenti di domani piu precisi.'}
                </ThemedText>
                <View style={styles.moodRow}>
                  <Pressable
                    onPress={() => submitCheckIn('great')}
                    style={({ pressed }) => [styles.moodPressable, pressed && styles.pressed]}>
                    <ThemedView
                      type="backgroundSelected"
                      style={[
                        styles.moodChip,
                        todaysCheckIn?.mood === 'great' && styles.moodChipActive,
                      ]}>
                      <ThemedText type="smallBold">Benissimo</ThemedText>
                    </ThemedView>
                  </Pressable>
                  <Pressable
                    onPress={() => submitCheckIn('ok')}
                    style={({ pressed }) => [styles.moodPressable, pressed && styles.pressed]}>
                    <ThemedView
                      type="backgroundSelected"
                      style={[styles.moodChip, todaysCheckIn?.mood === 'ok' && styles.moodChipActive]}>
                      <ThemedText type="smallBold">Normale</ThemedText>
                    </ThemedView>
                  </Pressable>
                  <Pressable
                    onPress={() => submitCheckIn('hard')}
                    style={({ pressed }) => [styles.moodPressable, pressed && styles.pressed]}>
                    <ThemedView
                      type="backgroundSelected"
                      style={[
                        styles.moodChip,
                        todaysCheckIn?.mood === 'hard' && styles.moodChipActive,
                      ]}>
                      <ThemedText type="smallBold">Difficile</ThemedText>
                    </ThemedView>
                  </Pressable>
                </View>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="code" style={styles.cardEyebrow}>
                  PROGRESS
                </ThemedText>
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Segnali utili
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.cardBody}>
                  Azioni completate: {completedActionsCount}. Obiettivo attivo: {goal.toLowerCase()}.
                </ThemedText>
              </ThemedView>

              <ChallengeCarousel
                challenges={availableChallenges}
                isLoading={isChallengesLoading}
                errorMessage={challengesError}
                acceptingChallengeId={acceptingChallengeId}
                onAcceptChallenge={(challengeId) => {
                  void handleAcceptChallenge(challengeId);
                }}
                onRetry={() => {
                  void loadChallenges();
                }}
              />

              {acceptedChallenges.length > 0 ? (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="code" style={styles.cardEyebrow}>
                    ACTIVE CHALLENGES
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    Challenge attive
                  </ThemedText>
                  <View style={styles.acceptedChallengesList}>
                    {acceptedChallenges.map((challenge) => (
                      <View key={challenge.id} style={styles.acceptedChallengeRow}>
                        <View style={styles.acceptedChallengeCopy}>
                          <ThemedText type="smallBold">{challenge.title}</ThemedText>
                          <ThemedText themeColor="textSecondary" style={styles.acceptedChallengeMeta}>
                            {challenge.category} · {challenge.difficulty}
                          </ThemedText>
                        </View>
                        {challenge.points ? (
                          <ThemedText type="smallBold" style={styles.acceptedChallengePoints}>
                            +{challenge.points}
                          </ThemedText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </ThemedView>
              ) : null}

              <WeeklyTrendChart
                title="Ultimi 7 giorni"
                subtitle={`Copertura settimanale ${weeklyCompletionRate}%. Confronto automatico con i 7 giorni precedenti.`}
                points={weeklyTrend}
                comparison={weeklyComparison}
              />

              <Pressable
                onPress={() => router.push('/(tabs)/plan')}
                style={({ pressed }) => [styles.actionPressable, pressed && styles.pressed]}>
                <View style={styles.primaryAction}>
                  <ThemedText type="smallBold" style={styles.primaryActionText}>
                    Apri il tuo piano
                  </ThemedText>
                </View>
              </Pressable>
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
  hero: {
    gap: Spacing.three,
  },
  heroCopy: {
    gap: Spacing.three,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#D7F2E0',
  },
  pillText: {
    color: '#17553D',
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  metricCard: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  metricLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#2F6A50',
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  cards: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  inlineActionPressable: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: Spacing.one,
  },
  inlineAction: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  inlineActionDone: {
    backgroundColor: '#D7F2E0',
  },
  inlineActionTextDone: {
    color: '#17553D',
  },
  cardEyebrow: {
    color: '#2F6A50',
    letterSpacing: 1.1,
  },
  cardTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  cardBody: {
    fontSize: 16,
    lineHeight: 24,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  moodPressable: {
    borderRadius: 999,
  },
  moodChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  moodChipActive: {
    backgroundColor: '#D7F2E0',
  },
  acceptedChallengesList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  acceptedChallengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  acceptedChallengeCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  acceptedChallengeMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  acceptedChallengePoints: {
    color: '#17553D',
  },
  actionPressable: {
    borderRadius: 999,
  },
  primaryAction: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: '#0F2B20',
  },
  primaryActionText: {
    color: '#F6FFF7',
  },
  pressed: {
    opacity: 0.86,
  },
});
