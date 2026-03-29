import Constants from 'expo-constants';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addNativeLogListener,
  initLlama,
  loadLlamaModelInfo,
  type LlamaContext,
  type RNLlamaOAICompatibleMessage,
} from 'llama.rn';

import { ChatMarkdown } from '@/components/chat-markdown';
import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { buildLocalSystemPrompt, hasConfiguredLocalModel, LOCAL_LLM_CONFIG } from '@/config/llm';
import { curatedChallenges } from '@/constants/onboarding';
import { acceptCustomChallenge } from '@/services/challenges';
import { analyzeReceiptWithLocalModels } from '@/services/receipt-ai';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useEcoData } from '@/providers/eco-data-context';
import { useOnboarding } from '@/providers/onboarding-context';
import type { ReceiptAnalysisResult } from '@/services/receipt-ai';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string | null;
};

type ChatStatus = 'setup' | 'loading' | 'ready' | 'generating' | 'error';
type ReceiptProgressStage =
  | 'checking-files'
  | 'extracting-receipt'
  | 'summarizing'
  | null;

function chatDebug(label: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`[chat] ${label}`);
    return;
  }

  try {
    console.log(`[chat] ${label}`, payload);
  } catch {
    console.log(`[chat] ${label}`);
  }
}

function sanitizeAssistantText(content: string, thinkingEnabled: boolean) {
  if (thinkingEnabled) {
    return content;
  }

  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function logCompletionMetrics(
  label: string,
  result: {
    tokens_evaluated: number;
    tokens_predicted: number;
    context_full: boolean;
    timings: {
      prompt_ms: number;
      prompt_per_second: number;
      predicted_ms: number;
      predicted_per_second: number;
    };
  },
  elapsedMs: number
) {
  console.log(`[llm] ${label}`, {
    elapsed_ms: Math.round(elapsedMs),
    prompt_tokens: result.tokens_evaluated,
    generated_tokens: result.tokens_predicted,
    context_full: result.context_full,
    prompt_ms: Math.round(result.timings.prompt_ms),
    prompt_tok_s: Number(result.timings.prompt_per_second.toFixed(2)),
    generation_ms: Math.round(result.timings.predicted_ms),
    generation_tok_s: Number(result.timings.predicted_per_second.toFixed(2)),
  });
}

function getAssistantStatusLabel(status: ChatStatus, _progress: number) {
  if (status === 'loading') {
    return 'Sto preparando l’assistente';
  }

  if (status === 'ready') {
    return 'Pronto a rispondere';
  }

  if (status === 'generating') {
    return 'Sto preparando la risposta';
  }

  if (status === 'error') {
    return 'Non disponibile';
  }

  return 'Da attivare';
}

function getReceiptStageLabel(stage: ReceiptProgressStage) {
  if (stage === 'checking-files') {
    return 'Verifico i modelli locali';
  }

  if (stage === 'extracting-receipt') {
    return 'Leggo lo scontrino';
  }

  if (stage === 'summarizing') {
    return 'Preparo l’analisi della spesa';
  }

  return null;
}

function getFriendlyErrorMessage(errorMessage: string | null) {
  if (!errorMessage) {
    return null;
  }

  if (
    errorMessage.includes('Expo Go') ||
    errorMessage.includes('build native') ||
    errorMessage.includes('llama.rn')
  ) {
    return 'Questa funzione richiede la versione completa dell’app installata sul dispositivo.';
  }

  if (errorMessage.includes('Modello non trovato')) {
    return 'Assistente non disponibile su questo dispositivo. Completa prima la configurazione locale.';
  }

  return 'L’assistente non e disponibile in questo momento. Riprova tra poco.';
}

function TypingIndicator({ color }: { color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => {
      loop.stop();
      progress.stopAnimation();
    };
  }, [progress]);

  return (
    <View style={styles.typingRow}>
      {[0, 1, 2].map((index) => {
        const opacity = progress.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange:
            index === 0
              ? [0.35, 1, 0.35, 0.35, 0.35, 0.35]
              : index === 1
                ? [0.35, 0.35, 1, 0.35, 0.35, 0.35]
                : [0.35, 0.35, 0.35, 1, 0.35, 0.35],
        });

        const translateY = progress.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange:
            index === 0
              ? [0, -3, 0, 0, 0, 0]
              : index === 1
                ? [0, 0, -3, 0, 0, 0]
                : [0, 0, 0, -3, 0, 0],
        });

        return (
          <Animated.View
            key={`typing-dot-${index}`}
            style={[
              styles.typingDot,
              {
                backgroundColor: color,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function LoadingIndicator({ color }: { color: string }) {
  return (
    <View style={styles.loadingIndicatorWrap}>
      <TypingIndicator color={color} />
    </View>
  );
}

function AssistantBubbleBody({
  content,
  isGenerating,
  color,
}: {
  content: string;
  isGenerating: boolean;
  color: string;
}) {
  const textOpacity = useRef(new Animated.Value(content ? 1 : 0)).current;
  const indicatorOpacity = useRef(new Animated.Value(content ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: content ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(indicatorOpacity, {
        toValue: isGenerating && !content ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [content, indicatorOpacity, isGenerating, textOpacity]);

  return (
    <View style={styles.assistantBody}>
      <Animated.View
        pointerEvents="none"
        style={[styles.typingOverlay, { opacity: indicatorOpacity }]}>
        <TypingIndicator color={color} />
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity }}>
        <ChatMarkdown content={content || '...'} />
      </Animated.View>
    </View>
  );
}

export default function ChatScreen() {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { completed, focus, profile, goal, isReady } = useOnboarding();
  const { todaysCheckIn, currentStreak, completedActionsCount, saveAcceptedChallenge } = useEcoData();
  const contextRef = useRef<LlamaContext | null>(null);
  const [status, setStatus] = useState<ChatStatus>('setup');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [input, setInput] = useState('');
  const [thinkingEnabled, setThinkingEnabled] = useState(true);
  const [modelExists, setModelExists] = useState<boolean | null>(null);
  const [modelDiagnostics, setModelDiagnostics] = useState<string | null>(null);
  const [receiptStage, setReceiptStage] = useState<ReceiptProgressStage>(null);
  const [challengeSuggestion, setChallengeSuggestion] = useState<string | null>(null);
  const [isChallengeSuggestionLoading, setIsChallengeSuggestionLoading] = useState(false);
  const [isChallengeSuggestionAccepted, setIsChallengeSuggestionAccepted] = useState(false);
  const [isAcceptingChallengeSuggestion, setIsAcceptingChallengeSuggestion] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content:
        'Quando l’assistente e pronto, puoi chiedere consigli pratici oppure allegare uno scontrino per una stima rapida di CO₂, acqua e alternative immediate.',
    },
  ]);

  useEffect(() => {
    let isMounted = true;

    async function setupModel(autoLoad = true) {
      if (Platform.OS === 'web') {
        setStatus('error');
        setErrorMessage('La chat locale con llama.rn e pensata per build native, non per il web.');
        return;
      }

      if (Constants.appOwnership === 'expo') {
        setStatus('error');
        setErrorMessage('llama.rn non funziona in Expo Go. Serve una development build nativa.');
        return;
      }

      if (!hasConfiguredLocalModel()) {
        setModelExists(false);
        setStatus('setup');
        return;
      }

      try {
        const fileInfo = await FileSystemLegacy.getInfoAsync(LOCAL_LLM_CONFIG.modelUri);

        if (!fileInfo.exists) {
          setModelExists(false);
          setStatus('setup');
          setErrorMessage(`Modello non trovato in ${LOCAL_LLM_CONFIG.modelUri}`);
          setModelDiagnostics(null);
          return;
        }

        setModelExists(true);
        setModelDiagnostics(
          `File rilevato. URI: ${fileInfo.uri ?? LOCAL_LLM_CONFIG.modelUri}${typeof fileInfo.size === 'number' ? ` | size: ${fileInfo.size} bytes` : ''}`
        );
        if (!autoLoad) {
          setStatus('setup');
          setErrorMessage(null);
          return;
        }

        setStatus('loading');
        setErrorMessage(null);
        setProgress(0);

        if (contextRef.current) {
          await contextRef.current.release();
          contextRef.current = null;
        }

        const context = await initLlama(
          {
            model: LOCAL_LLM_CONFIG.modelUri,
            n_ctx: LOCAL_LLM_CONFIG.nCtx,
            n_batch: LOCAL_LLM_CONFIG.nBatch,
            n_threads: LOCAL_LLM_CONFIG.nThreads,
            use_mmap: false,
            use_progress_callback: true,
          },
          (nextProgress) => {
            if (isMounted) {
              setProgress(nextProgress);
            }
          }
        );

        if (!isMounted) {
          await context.release();
          return;
        }

        contextRef.current = context;
        setStatus('ready');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Errore durante il caricamento del modello.');
      }
    }

    void setupModel(false);

    return () => {
      isMounted = false;
      if (contextRef.current) {
        void contextRef.current.release();
        contextRef.current = null;
      }
    };
  }, []);

  async function loadModel() {
    await (async () => {
      if (Platform.OS === 'web') {
        return;
      }

      setErrorMessage(null);
      setStatus('setup');

      try {
        const fileInfo = await FileSystemLegacy.getInfoAsync(LOCAL_LLM_CONFIG.modelUri);

        if (!fileInfo.exists) {
          setModelExists(false);
          setStatus('error');
          setErrorMessage(`Modello non trovato in ${LOCAL_LLM_CONFIG.modelUri}`);
          setModelDiagnostics(null);
          return;
        }

        setModelExists(true);
        setModelDiagnostics(
          `File rilevato. URI: ${fileInfo.uri ?? LOCAL_LLM_CONFIG.modelUri}${typeof fileInfo.size === 'number' ? ` | size: ${fileInfo.size} bytes` : ''}`
        );
        setStatus('loading');
        setProgress(0);

        const logs: string[] = [];
        const listener = addNativeLogListener((level, text) => {
          logs.push(`[${level}] ${text}`);
        });

        try {
          if (contextRef.current) {
            await contextRef.current.release();
            contextRef.current = null;
          }

          try {
            await loadLlamaModelInfo(LOCAL_LLM_CONFIG.modelUri);
          } catch (error) {
            const reason = error instanceof Error ? error.message : 'Impossibile leggere model info';
            setStatus('error');
            setErrorMessage(`Il file esiste ma llama.rn non riesce a leggerlo. ${reason}`);
            setModelDiagnostics(logs.slice(-8).join('\n') || null);
            return;
          }

          const context = await initLlama(
            {
              model: LOCAL_LLM_CONFIG.modelUri,
              n_ctx: LOCAL_LLM_CONFIG.nCtx,
              n_batch: LOCAL_LLM_CONFIG.nBatch,
              n_threads: LOCAL_LLM_CONFIG.nThreads,
              use_mmap: false,
              use_progress_callback: true,
            },
            (nextProgress) => {
              setProgress(nextProgress);
            }
          );

          contextRef.current = context;
          setStatus('ready');
          setModelDiagnostics(
            logs.slice(-8).join('\n') || 'Model info letta correttamente e contesto inizializzato.'
          );
        } finally {
          listener.remove();
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Errore durante il caricamento del modello.'
        );
      }
    })();
  }

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!completed) {
    return <LoadingScreen label="Completa prima l'onboarding per attivare la chat." />;
  }

  const resolvedChallengeSuggestion = challengeSuggestion;
  const resolvedCuratedChallenge = findCuratedChallenge(resolvedChallengeSuggestion);
  const showChallengeSuggestionLoading =
    isChallengeSuggestionLoading && !resolvedChallengeSuggestion;

  async function sendMessage() {
    await sendPrompt(input.trim());
  }

  async function sendPrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();
    const context = contextRef.current;

    if (!prompt || !context || status !== 'ready') {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
    };
    const assistantId = `assistant-${Date.now()}`;

    const history = [...messages, userMessage];
    const payload: RNLlamaOAICompatibleMessage[] = [
      { role: 'system', content: buildLocalSystemPrompt(thinkingEnabled) },
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    setMessages((current) => [...current, userMessage, { id: assistantId, role: 'assistant', content: '' }]);
    setInput((current) => (current.trim() === prompt ? '' : current));
    setStatus('generating');
    const startedAt = Date.now();

    try {
      const result = await context.completion(
        {
          messages: payload,
          n_predict: LOCAL_LLM_CONFIG.nPredict,
          temperature: LOCAL_LLM_CONFIG.temperature,
          stop: [...LOCAL_LLM_CONFIG.stop],
        },
        (data) => {
          const nextText = sanitizeAssistantText(
            data.accumulated_text ?? data.content ?? '',
            thinkingEnabled
          );

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, content: nextText || message.content } : message
            )
          );
        }
      );

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  sanitizeAssistantText(result.text || message.content, thinkingEnabled) ||
                  message.content,
              }
            : message
        )
      );
      logCompletionMetrics('chat completion', result, Date.now() - startedAt);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Errore durante la generazione della risposta.');
    }
  }

  useEffect(() => {
    const context = contextRef.current;

    if (!context || status !== 'ready' || !completed || challengeSuggestion) {
      return;
    }

    let isMounted = true;

    async function generateChallengeSuggestion() {
      const liveContext = contextRef.current;

      if (!liveContext) {
        return;
      }

      setIsChallengeSuggestionLoading(true);

      try {
        const prompt = [
          'Scegli una sola micro challenge personalizzata per EcoMind.',
          'Puoi scegliere solo una di queste cinque opzioni, senza modificarne il testo:',
          'Restituisci solo il titolo della challenge, massimo 8 parole.',
          'Niente punti elenco, niente virgolette, niente introduzione.',
          ...curatedChallenges.map((challenge) => challenge.title),
          'Scegli quella piu coerente con il profilo utente.',
          `Focus utente: ${focus}.`,
          `Profilo utente: ${profile}.`,
          `Obiettivo attivo: ${goal}.`,
          `Streak corrente: ${currentStreak}.`,
          `Azioni completate: ${completedActionsCount}.`,
          `Check-in di oggi: ${todaysCheckIn?.mood ?? 'non registrato'}.`,
        ].join(' ');

        chatDebug('challenge suggestion start');
        const result = await liveContext.completion({
          messages: [
            {
              role: 'system',
              content: `${buildLocalSystemPrompt(false)}

Genera solo titoli brevi di challenge coerenti con EcoMind.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          n_predict: 32,
          temperature: 0.6,
          stop: [...LOCAL_LLM_CONFIG.stop],
        });

        const nextSuggestion = sanitizeAssistantText(result.text ?? result.content ?? '', false)
          .replace(/["*_\n\r]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        chatDebug('challenge suggestion ready', { suggestion: nextSuggestion });

        if (isMounted && nextSuggestion) {
          setIsChallengeSuggestionLoading(false);
          setIsChallengeSuggestionAccepted(false);
          setChallengeSuggestion(nextSuggestion);
        }
      } catch (error) {
        chatDebug('challenge suggestion failed', error instanceof Error ? error.message : error);
      } finally {
        if (isMounted) {
          setIsChallengeSuggestionLoading(false);
        }
      }
    }

    void generateChallengeSuggestion();

    return () => {
      isMounted = false;
    };
  }, [
    challengeSuggestion,
    completed,
    completedActionsCount,
    currentStreak,
    focus,
    goal,
    profile,
    status,
    todaysCheckIn?.mood,
  ]);

  async function attachReceipt() {
    const context = contextRef.current;

    if (!context || status !== 'ready') {
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setErrorMessage('Per allegare uno scontrino serve l’accesso alle foto del dispositivo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const imageUri = result.assets[0].uri;
      const userMessage: ChatMessage = {
        id: `user-receipt-${Date.now()}`,
        role: 'user',
        content: 'Ho allegato uno scontrino da analizzare.',
        imageUri,
      };
      const assistantId = `assistant-receipt-${Date.now()}`;

      setMessages((current) => [
        ...current,
        userMessage,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
        },
      ]);
      setStatus('generating');
      setReceiptStage('checking-files');
      setErrorMessage(null);

      const analysis = await analyzeReceiptWithLocalModels({
        assistantContext: context,
        imageUri,
        thinkingEnabled,
        onProgress: (stage) => {
          setReceiptStage(stage);
        },
        onSummaryToken: (nextText) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, content: nextText || message.content } : message
            )
          );
        },
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: analysis.assistantSummary,
              }
            : message
        )
      );
      setStatus('ready');
      setReceiptStage(null);
    } catch (error) {
      setStatus('error');
      setReceiptStage(null);
      setErrorMessage(
        error instanceof Error ? error.message : 'Non sono riuscito ad analizzare lo scontrino.'
      );
    }
  }

  async function handleAcceptChallengeSuggestion(title: string) {
    const curatedChallenge = findCuratedChallenge(title);
    setIsAcceptingChallengeSuggestion(true);
    setErrorMessage(null);

    try {
      await acceptCustomChallenge({
        title,
        description:
          curatedChallenge?.objective ?? `Challenge personalizzata suggerita da EcoMind: ${title}.`,
        points: 15,
      });

      saveAcceptedChallenge({
        id: `custom-${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
        title,
        description:
          curatedChallenge?.objective ?? `Challenge personalizzata suggerita da EcoMind: ${title}.`,
        category: 'AI suggestion',
        difficulty: 'Starter',
        points: 15,
        durationDays: 7,
        isAccepted: true,
      });
      setIsChallengeSuggestionAccepted(true);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-challenge-accepted-${Date.now()}`,
          role: 'assistant',
          content: `Ho attivato la challenge **${title}**. Ora puoi ritrovarla nel tuo flusso challenge e usarla come prossimo obiettivo pratico.`,
        },
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Non sono riuscito ad attivare la challenge suggerita.'
      );
    } finally {
      setIsAcceptingChallengeSuggestion(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={safeAreaInsets.top}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.shell}>
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  EcoMind Assistant
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                  Consigli pratici e personalizzati per migliorare le tue abitudini sostenibili.
                </ThemedText>
              </View>

              {status === 'ready' || showChallengeSuggestionLoading || Boolean(resolvedChallengeSuggestion) ? (
                <ThemedView
                  type="backgroundElement"
                  style={[
                    styles.challengeSpotlight,
                    {
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={styles.challengeSpotlightHeader}>
                    <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                      Challenge pensata per te
                    </ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.challengeSuggestionHint}>
                      {showChallengeSuggestionLoading
                        ? 'Sto scegliendo una micro challenge coerente con il tuo percorso.'
                        : 'Suggerita dal modello in base al tuo percorso EcoMind.'}
                    </ThemedText>
                  </View>
                  {resolvedChallengeSuggestion ? (
                    <View style={styles.challengeSuggestionContent}>
                      <ThemedText style={styles.challengeSuggestionValue}>
                        {resolvedChallengeSuggestion}
                      </ThemedText>
                      {resolvedCuratedChallenge ? (
                        <ThemedText themeColor="textSecondary" style={styles.challengeSuggestionObjective}>
                          Obiettivo: {resolvedCuratedChallenge.objective}
                        </ThemedText>
                      ) : null}
                      <Pressable
                        onPress={() => {
                          void handleAcceptChallengeSuggestion(resolvedChallengeSuggestion);
                        }}
                        style={({ pressed }) => [
                          styles.challengeChipPressable,
                          (isAcceptingChallengeSuggestion || isChallengeSuggestionAccepted) &&
                            styles.disabled,
                          pressed && styles.pressed,
                        ]}>
                        <View
                          style={[
                            styles.challengeChip,
                            {
                              backgroundColor: isChallengeSuggestionAccepted
                                ? theme.positiveSurface
                                : theme.darkSurface,
                            },
                          ]}>
                          <ThemedText
                            type="smallBold"
                            style={{
                              color: isChallengeSuggestionAccepted
                                ? theme.positiveText
                                : theme.darkTextOnBrand,
                            }}>
                            {isChallengeSuggestionAccepted
                              ? 'Challenge attivata'
                              : isAcceptingChallengeSuggestion
                                ? 'Attivazione...'
                                : 'Accetta challenge'}
                          </ThemedText>
                        </View>
                      </Pressable>
                    </View>
                  ) : showChallengeSuggestionLoading ? (
                    <LoadingIndicator color={theme.brandText} />
                  ) : null}
                </ThemedView>
              ) : null}

              <ThemedView type="backgroundElement" style={styles.statusCard}>
                <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                  Assistente
                </ThemedText>
                <ThemedText style={styles.statusValue}>
                  {status === 'generating' && receiptStage
                    ? getReceiptStageLabel(receiptStage)
                    : getAssistantStatusLabel(status, progress)}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.statusHint}>
                  {status === 'generating' && receiptStage
                    ? 'Sto trasformando lo scontrino in un riepilogo chiaro con stima ambientale e alternative.'
                    : status === 'ready'
                    ? 'Puoi chiedere suggerimenti su alimentazione, mobilita, casa e piccoli obiettivi green.'
                    : status === 'loading'
                      ? 'Sto preparando l’assistente sul tuo dispositivo.'
                      : status === 'generating'
                        ? 'Sto elaborando una risposta utile e concreta.'
                        : 'Quando e attivo, l’assistente ti aiuta a trasformare obiettivi green in azioni quotidiane.'}
                </ThemedText>
                {status === 'loading' || (status === 'generating' && receiptStage) ? (
                  <LoadingIndicator color={theme.brandText} />
                ) : null}
                {getFriendlyErrorMessage(errorMessage) ? (
                  <ThemedText style={{ color: '#B5432F' }}>
                    {getFriendlyErrorMessage(errorMessage)}
                  </ThemedText>
                ) : null}
                <View
                  style={[
                    styles.switchRow,
                    {
                      backgroundColor: theme.backgroundSelected,
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={styles.switchTextWrap}>
                    <ThemedText type="smallBold">Risposta approfondita</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.switchHint}>
                      {thinkingEnabled
                        ? 'Dedica piu attenzione al ragionamento prima di rispondere.'
                        : 'Vai piu dritto al punto con risposte brevi e immediate.'}
                    </ThemedText>
                  </View>
                  <Switch
                    value={thinkingEnabled}
                    onValueChange={setThinkingEnabled}
                    trackColor={{ false: theme.border, true: theme.tint }}
                    thumbColor={thinkingEnabled ? theme.brandText : theme.background}
                    ios_backgroundColor={theme.border}
                  />
                </View>
                <Pressable
                  onPress={() => {
                    void loadModel();
                  }}
                  disabled={status === 'loading' || status === 'generating'}
                  style={({ pressed }) => [
                    styles.loadPressable,
                    (status === 'loading' || status === 'generating') && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.loadButton, { backgroundColor: theme.darkSurface }]}>
                    <ThemedText type="smallBold" style={{ color: theme.darkTextOnBrand }}>
                      {status === 'ready' ? 'Riavvia assistente' : 'Attiva assistente'}
                    </ThemedText>
                  </View>
                </Pressable>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.messagesCard}>
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.bubble,
                      message.role === 'user'
                        ? { alignSelf: 'flex-end', backgroundColor: theme.positiveSurface }
                        : { alignSelf: 'flex-start', backgroundColor: theme.backgroundSelected },
                    ]}>
                    <ThemedText type="smallBold" style={styles.bubbleRole}>
                      {message.role === 'user' ? 'Tu' : 'EcoMind'}
                    </ThemedText>
                    {message.role === 'assistant' ? (
                      <View style={styles.assistantMessageContent}>
                        <AssistantBubbleBody
                          content={message.content}
                          isGenerating={
                            status === 'generating' && message.id === assistantIdFromMessages(messages)
                          }
                          color={theme.brandText}
                        />
                      </View>
                    ) : (
                      <View style={styles.userMessageContent}>
                        {message.imageUri ? (
                          <Image
                            source={{ uri: message.imageUri }}
                            style={styles.attachmentPreview}
                            contentFit="cover"
                          />
                        ) : null}
                        <ThemedText>{message.content || '...'}</ThemedText>
                      </View>
                    )}
                  </View>
                ))}
              </ThemedView>

              <View style={styles.composer}>
                <View style={styles.composerActions}>
                  <Pressable
                    onPress={() => {
                      void attachReceipt();
                    }}
                    disabled={status !== 'ready'}
                    style={({ pressed }) => [
                      styles.attachPressable,
                      status !== 'ready' && styles.disabled,
                      pressed && styles.pressed,
                    ]}>
                    <View
                      style={[
                        styles.attachButton,
                        {
                          backgroundColor: theme.backgroundSelected,
                          borderColor: theme.border,
                        },
                      ]}>
                      <ThemedText type="smallBold" style={{ color: theme.brandText }}>
                        Allega
                      </ThemedText>
                    </View>
                  </Pressable>
                </View>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ad esempio: come posso ridurre gli sprechi in cucina?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => {
                    void sendMessage();
                  }}
                  disabled={status !== 'ready' || input.trim().length === 0}
                  style={({ pressed }) => [
                    styles.sendPressable,
                    (status !== 'ready' || input.trim().length === 0) && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.sendButton, { backgroundColor: theme.darkSurface }]}>
                    <ThemedText type="smallBold" style={{ color: theme.darkTextOnBrand }}>
                      Invia
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function assistantIdFromMessages(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'assistant') {
      return message.id;
    }
  }

  return null;
}

function findCuratedChallenge(title: string | null) {
  if (!title) {
    return null;
  }

  return curatedChallenges.find((challenge) => challenge.title === title) ?? null;
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
    gap: Spacing.three,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  statusCard: {
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
  diagnosticsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  switchRow: {
    marginTop: Spacing.one,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  switchTextWrap: {
    flex: 1,
    gap: Spacing.one,
  },
  switchHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  challengeSpotlight: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  challengeSpotlightHeader: {
    gap: Spacing.one,
  },
  challengeSuggestionHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  challengeSuggestionContent: {
    gap: Spacing.two,
  },
  challengeSuggestionValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 600,
  },
  challengeSuggestionObjective: {
    fontSize: 15,
    lineHeight: 22,
  },
  challengeChipPressable: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  challengeChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  loadPressable: {
    borderRadius: 999,
    marginTop: Spacing.one,
  },
  loadButton: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  messagesCard: {
    borderRadius: 28,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bubble: {
    maxWidth: '92%',
    borderRadius: 22,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  userMessageContent: {
    gap: Spacing.two,
  },
  assistantMessageContent: {
    gap: Spacing.two,
  },
  attachmentPreview: {
    width: 120,
    height: 120,
    borderRadius: 18,
  },
  assistantBody: {
    minHeight: 22,
    justifyContent: 'center',
  },
  typingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 22,
    paddingVertical: Spacing.one,
  },
  loadingIndicatorWrap: {
    alignItems: 'flex-start',
    paddingTop: Spacing.one,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  bubbleRole: {
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  composer: {
    gap: Spacing.two,
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  attachPressable: {
    borderRadius: 999,
  },
  attachButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  input: {
    minHeight: 110,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
  },
  sendPressable: {
    borderRadius: 999,
  },
  sendButton: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.86,
  },
});
