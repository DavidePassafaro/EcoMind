import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Challenge } from '@/types/challenge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type ChallengeCarouselProps = {
  challenges: Challenge[];
  isLoading: boolean;
  errorMessage: string | null;
  acceptingChallengeId?: string | null;
  onAcceptChallenge: (challengeId: string) => void;
  onRetry: () => void;
};

function formatDurationLabel(days: number | null) {
  if (!days) {
    return 'Flessibile';
  }

  return days === 1 ? '1 giorno' : `${days} giorni`;
}

export function ChallengeCarousel({
  challenges,
  isLoading,
  errorMessage,
  acceptingChallengeId,
  onAcceptChallenge,
  onRetry,
}: ChallengeCarouselProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = useMemo(() => Math.min(width - 72, 340), [width]);
  const snapInterval = cardWidth + Spacing.three;

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={styles.section}>
        <ThemedText type="code" style={[styles.eyebrow, { color: theme.tint }]}>
          CHALLENGES
        </ThemedText>
        <ThemedText type="subtitle" style={styles.title}>
          Sto recuperando le sfide disponibili
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.description}>
          Un attimo: preparo le challenge dal server EcoMind.
        </ThemedText>
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView type="backgroundElement" style={styles.section}>
        <ThemedText type="code" style={[styles.eyebrow, { color: theme.tint }]}>
          CHALLENGES
        </ThemedText>
        <ThemedText type="subtitle" style={styles.title}>
          Challenge non disponibili
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.description}>
          {errorMessage}
        </ThemedText>
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryPressable, pressed && styles.pressed]}>
          <ThemedView type="backgroundSelected" style={styles.retryButton}>
            <ThemedText type="smallBold">Riprova</ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
    );
  }

  if (!challenges.length) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={{ gap: Spacing.one }}>
          <ThemedText type="code" style={[styles.eyebrow, { color: theme.tint }]}>
            CHALLENGES
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            Sfide attive per te
          </ThemedText>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.headerCopy}>
          Scorri le card e scegli la prossima micro-azione da attivare.
        </ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
          setActiveIndex(Math.max(0, Math.min(nextIndex, challenges.length - 1)));
        }}>
        {challenges.map((challenge) => (
          <ThemedView
            key={challenge.id}
            type="backgroundElement"
            style={[
              styles.card,
              {
                width: cardWidth,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.cardTopRow}>
              <View style={[styles.categoryPill, { backgroundColor: theme.positiveSurface }]}>
                <ThemedText type="smallBold" style={{ color: theme.positiveText }}>
                  {challenge.category}
                </ThemedText>
              </View>
              {challenge.points ? (
                <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                  +{challenge.points} pt
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.cardBody}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                {challenge.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.cardDescription}>
                {challenge.description}
              </ThemedText>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">{challenge.difficulty}</ThemedText>
              </View>
              <View style={[styles.metaChip, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">{formatDurationLabel(challenge.durationDays)}</ThemedText>
              </View>
            </View>

            <Pressable
              disabled={challenge.isAccepted || acceptingChallengeId === challenge.id}
              onPress={() => onAcceptChallenge(challenge.id)}
              style={({ pressed }) => [styles.acceptPressable, pressed && styles.pressed]}>
              <View
                style={[
                  styles.acceptButton,
                  {
                    backgroundColor: challenge.isAccepted ? theme.positiveSurface : theme.darkSurface,
                  },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{
                    color: challenge.isAccepted ? theme.positiveText : theme.darkTextOnBrand,
                  }}>
                  {challenge.isAccepted
                    ? 'Challenge attivata'
                    : acceptingChallengeId === challenge.id
                      ? 'Attivazione...'
                      : 'Accetta challenge'}
                </ThemedText>
              </View>
            </Pressable>
          </ThemedView>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {challenges.map((challenge, index) => (
          <View
            key={`dot-${challenge.id}`}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex ? theme.tint : theme.chartTrack,
                width: index === activeIndex ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  section: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.two,
  },
  eyebrow: {
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  headerCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  scrollContent: {
    paddingRight: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cardBody: {
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  retryPressable: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  acceptPressable: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  retryButton: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  acceptButton: {
    minHeight: 48,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.86,
  },
});
