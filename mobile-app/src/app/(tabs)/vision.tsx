import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding } from '@/providers/onboarding-context';
import { analyzeImageWithVisionModel, type VisionLogEntry } from '@/services/vision-ai';

type VisionStatus = 'idle' | 'working' | 'done' | 'error';

export default function VisionScreen() {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { completed, isReady } = useOnboarding();
  const [status, setStatus] = useState<VisionStatus>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [logs, setLogs] = useState<VisionLogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!completed) {
    return <LoadingScreen label="Completa prima l'onboarding per attivare la modalita vision." />;
  }

  async function captureAndAnalyze() {
    if (Platform.OS === 'web') {
      setStatus('error');
      setErrorMessage('La modalita vision e disponibile solo su build native.');
      return;
    }

    if (Constants.appOwnership === 'expo') {
      setStatus('error');
      setErrorMessage('Il visual mode richiede una development build nativa.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setStatus('error');
      setErrorMessage('Serve l’accesso alla fotocamera per testare il visual mode.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      mediaTypes: ['images'],
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const nextImageUri = result.assets[0].uri;
    setImageUri(nextImageUri);
    setAnalysis('');
    setLogs([]);
    setErrorMessage(null);
    setStatus('working');

    try {
      const response = await analyzeImageWithVisionModel({
        imageUri: nextImageUri,
        onLog: (entry) => {
          setLogs((current) => [...current, entry]);
        },
      });

      setAnalysis(response.text);
      setStatus('done');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Errore durante l’analisi visuale.'
      );
    }
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
              <ThemedText type="title" style={styles.title}>
                Vision Lab
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Scatta una foto, passa l’immagine al modello visuale e osserva output e log del processo.
              </ThemedText>
            </View>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                Stato
              </ThemedText>
              <ThemedText style={styles.statusValue}>
                {status === 'idle'
                  ? 'Pronto'
                  : status === 'working'
                    ? 'Analisi in corso'
                    : status === 'done'
                      ? 'Completata'
                      : 'Errore'}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statusHint}>
                {status === 'working'
                  ? 'Sto inizializzando il VLM, passando la foto e raccogliendo i log.'
                  : 'Questa view serve solo per testare il visual mode e capire cosa vede il modello.'}
              </ThemedText>
              <Pressable
                onPress={() => {
                  void captureAndAnalyze();
                }}
                disabled={status === 'working'}
                style={({ pressed }) => [styles.primaryPressable, pressed && styles.pressed]}>
                <View style={[styles.primaryButton, { backgroundColor: theme.darkSurface }]}>
                  <ThemedText type="smallBold" style={{ color: theme.darkTextOnBrand }}>
                    {status === 'working' ? 'Analizzo...' : 'Scatta foto'}
                  </ThemedText>
                </View>
              </Pressable>
              {errorMessage ? (
                <ThemedText style={{ color: '#B5432F' }}>{errorMessage}</ThemedText>
              ) : null}
            </ThemedView>

            {imageUri ? (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                  Ultima immagine
                </ThemedText>
                <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
              </ThemedView>
            ) : null}

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                Output modello
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.outputText}>
                {analysis || 'Nessun output ancora disponibile.'}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                Log
              </ThemedText>
              <View style={styles.logList}>
                {logs.length > 0 ? (
                  logs.map((entry) => (
                    <ThemedText
                      key={entry.id}
                      style={[styles.logLine, entry.level === 'error' && styles.logLineError]}>
                      {entry.message}
                    </ThemedText>
                  ))
                ) : (
                  <ThemedText themeColor="textSecondary" style={styles.outputText}>
                    I log compariranno qui durante l’analisi.
                  </ThemedText>
                )}
              </View>
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
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  statusValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  statusHint: {
    fontSize: 15,
    lineHeight: 22,
  },
  primaryPressable: {
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
  },
  outputText: {
    fontSize: 15,
    lineHeight: 22,
  },
  logList: {
    gap: Spacing.one,
  },
  logLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  logLineError: {
    color: '#B5432F',
  },
  pressed: {
    opacity: 0.86,
  },
});
