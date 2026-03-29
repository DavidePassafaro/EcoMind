import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type WeeklyTrendPoint = {
  date: string;
  label: string;
  score: number;
  hasCheckIn: boolean;
  actionCompleted: boolean;
};

export function WeeklyTrendChart({
  title,
  subtitle,
  points,
  comparison,
}: {
  title: string;
  subtitle: string;
  points: WeeklyTrendPoint[];
  comparison?: {
    scoreDelta: number;
    completionDelta: number;
    actionDelta: number;
  };
}) {
  const theme = useTheme();
  const scoreDeltaLabel =
    comparison && `${comparison.scoreDelta >= 0 ? '+' : ''}${comparison.scoreDelta} avg score`;
  const completionDeltaLabel =
    comparison && `${comparison.completionDelta >= 0 ? '+' : ''}${comparison.completionDelta}% coverage`;
  const actionDeltaLabel =
    comparison && `${comparison.actionDelta >= 0 ? '+' : ''}${comparison.actionDelta} actions`;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="code" style={styles.eyebrow}>
        WEEKLY TREND
      </ThemedText>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        {subtitle}
      </ThemedText>

      {comparison ? (
        <View style={styles.comparisonRow}>
          <View style={[styles.comparisonPill, { backgroundColor: theme.positiveSurface }]}>
            <ThemedText type="smallBold" style={[styles.comparisonText, { color: theme.positiveText }]}>
              {scoreDeltaLabel}
            </ThemedText>
          </View>
          <View style={[styles.comparisonPill, { backgroundColor: theme.positiveSurface }]}>
            <ThemedText type="smallBold" style={[styles.comparisonText, { color: theme.positiveText }]}>
              {completionDeltaLabel}
            </ThemedText>
          </View>
          <View style={[styles.comparisonPill, { backgroundColor: theme.positiveSurface }]}>
            <ThemedText type="smallBold" style={[styles.comparisonText, { color: theme.positiveText }]}>
              {actionDeltaLabel}
            </ThemedText>
          </View>
        </View>
      ) : null}

      <View style={styles.chartRow}>
        {points.map((point) => (
          <View key={point.date} style={styles.column}>
            <View style={[styles.barTrack, { backgroundColor: theme.chartTrack }]}>
              <View
                style={[
                  styles.barFill,
                  { height: `${Math.max(point.score, 8)}%`, backgroundColor: theme.tint },
                ]}
              />
            </View>
            <View style={styles.signalRow}>
              <View style={[styles.signalDot, { backgroundColor: point.hasCheckIn ? theme.tint : theme.muted }]} />
              <View
                style={[
                  styles.signalDot,
                  { backgroundColor: point.actionCompleted ? theme.success : theme.muted },
                ]}
              />
            </View>
            <ThemedText type="smallBold" style={styles.dayLabel}>
              {point.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.signalDot, { backgroundColor: theme.tint }]} />
          <ThemedText type="small" themeColor="textSecondary">
            check-in
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.signalDot, { backgroundColor: theme.success }]} />
          <ThemedText type="small" themeColor="textSecondary">
            azione
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  eyebrow: {
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
    minHeight: 150,
    marginTop: Spacing.one,
  },
  comparisonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  comparisonPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  comparisonText: {},
  column: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  barTrack: {
    width: '100%',
    maxWidth: 26,
    height: 100,
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 999,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  dayLabel: {
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
