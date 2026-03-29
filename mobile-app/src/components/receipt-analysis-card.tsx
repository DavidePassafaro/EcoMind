import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ReceiptAnalysisResult } from '@/types/receipt';

export function ReceiptAnalysisCard({
  analysis,
  compact = false,
}: {
  analysis: ReceiptAnalysisResult;
  compact?: boolean;
}) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.card,
        compact && styles.compactCard,
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
      ]}>
      <View style={styles.previewRow}>
        <Image source={{ uri: analysis.imageUri }} style={styles.preview} contentFit="cover" />
        <View style={styles.previewMeta}>
          <ThemedText type="smallBold">Scontrino analizzato</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.metaText}>
            {analysis.extraction.store_name ?? 'Negozio non rilevato'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.metaText}>
            {analysis.normalizedItems.length} prodotti riconosciuti
          </ThemedText>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">CO₂ stimata</ThemedText>
          <ThemedText style={styles.metricValue}>
            {analysis.impactSummary.estimatedCo2Kg.toFixed(1)} kg
          </ThemedText>
        </View>
        <View style={[styles.metricCard, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Acqua stimata</ThemedText>
          <ThemedText style={styles.metricValue}>
            {analysis.impactSummary.estimatedWaterLiters} L
          </ThemedText>
        </View>
      </View>

      {analysis.impactSummary.topImpactItems.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="smallBold">Elementi piu impattanti</ThemedText>
          {analysis.impactSummary.topImpactItems.map((item) => (
            <View key={`${item.label}-${item.category}`} style={styles.listRow}>
              <ThemedText style={styles.listTitle}>{item.label}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.listMeta}>
                {item.co2Kg.toFixed(1)} kg CO₂ · {item.waterLiters} L acqua
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      {analysis.impactSummary.alternatives.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="smallBold">Alternative immediate</ThemedText>
          {analysis.impactSummary.alternatives.slice(0, 2).map((alternative) => (
            <View
              key={`${alternative.title}-${alternative.reason}`}
              style={[styles.alternativeCard, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.listTitle}>{alternative.title}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.listMeta}>
                {alternative.reason}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.listMeta}>
                {alternative.priceDeltaLabel} · {alternative.co2DeltaLabel} · {alternative.waterDeltaLabel}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    maxWidth: MaxContentWidth,
  },
  compactCard: {
    width: '100%',
  },
  previewRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  preview: {
    width: 76,
    height: 76,
    borderRadius: 18,
  },
  previewMeta: {
    flex: 1,
    gap: Spacing.one,
  },
  metaText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  section: {
    gap: Spacing.two,
  },
  listRow: {
    gap: Spacing.half,
  },
  listTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  listMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  alternativeCard: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
