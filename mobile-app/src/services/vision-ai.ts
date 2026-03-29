import * as FileSystemLegacy from 'expo-file-system/legacy';
import {
  addNativeLogListener,
  initLlama,
  type NativeCompletionResult,
} from 'llama.rn';

import { LOCAL_LLM_CONFIG } from '@/config/llm';
import { VISION_LLM_CONFIG } from '@/config/vision';

type VisionLogLevel = 'info' | 'error';

export type VisionLogEntry = {
  id: string;
  level: VisionLogLevel;
  message: string;
};

function createLogEmitter(onLog?: (entry: VisionLogEntry) => void) {
  return (message: string, level: VisionLogLevel = 'info') => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      message,
    } satisfies VisionLogEntry;

    console.log(`[vision] ${message}`);
    onLog?.(entry);
  };
}

async function assertFileExists(uri: string, label: string) {
  const info = await FileSystemLegacy.getInfoAsync(uri);

  if (!info.exists) {
    throw new Error(`${label} non trovato: ${uri}`);
  }
}

function logTimings(result: NativeCompletionResult, emit: (message: string, level?: VisionLogLevel) => void) {
  emit(
    `Prompt ${result.tokens_evaluated} tok in ${Math.round(result.timings.prompt_ms)} ms (${result.timings.prompt_per_second.toFixed(2)} tok/s)`
  );
  emit(
    `Generazione ${result.tokens_predicted} tok in ${Math.round(result.timings.predicted_ms)} ms (${result.timings.predicted_per_second.toFixed(2)} tok/s)`
  );
}

export async function analyzeImageWithVisionModel({
  imageUri,
  onLog,
}: {
  imageUri: string;
  onLog?: (entry: VisionLogEntry) => void;
}) {
  const emit = createLogEmitter(onLog);
  const nativeLogs: string[] = [];

  emit('Verifico file immagine e modelli locali');
  await assertFileExists(imageUri, 'Immagine');
  await assertFileExists(VISION_LLM_CONFIG.modelUri, 'Modello VLM');
  await assertFileExists(VISION_LLM_CONFIG.mmprojUri, 'File mmproj');

  emit(`Modello: ${VISION_LLM_CONFIG.modelLabel}`);
  emit('Inizializzo il contesto multimodale');

  const listener = addNativeLogListener((level, text) => {
    const line = `[native:${level}] ${text}`;
    nativeLogs.push(line);
    onLog?.({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level: level === 'error' ? 'error' : 'info',
      message: line,
    });
  });

  let context: Awaited<ReturnType<typeof initLlama>> | null = null;

  try {
    context = await initLlama({
      model: VISION_LLM_CONFIG.modelUri,
      n_ctx: VISION_LLM_CONFIG.nCtx,
      n_batch: VISION_LLM_CONFIG.nBatch,
      n_threads: VISION_LLM_CONFIG.nThreads,
      use_mmap: false,
      ctx_shift: false,
    });

    emit('Contesto VLM inizializzato');

    const multimodalReady = await context.initMultimodal({
      path: VISION_LLM_CONFIG.mmprojUri,
      use_gpu: false,
    });

    emit(`Multimodal attivo: ${multimodalReady ? 'si' : 'no'}`);

    if (!multimodalReady) {
      throw new Error('Init multimodale fallita.');
    }

    const support = await context.getMultimodalSupport();
    emit(`Supporto vision: ${support.vision ? 'si' : 'no'}`);

    emit('Avvio analisi dell’immagine');
    const result = await context.completion({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: VISION_LLM_CONFIG.prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUri,
              },
            },
          ],
        },
      ],
      n_predict: VISION_LLM_CONFIG.nPredict,
      temperature: VISION_LLM_CONFIG.temperature,
      stop: [...LOCAL_LLM_CONFIG.stop],
    });

    logTimings(result, emit);
    emit('Analisi completata');

    return {
      text: result.text.trim(),
      nativeLogs,
    };
  } finally {
    try {
      if (context) {
        emit('Rilascio contesto multimodale');
        await context.releaseMultimodal();
        await context.release();
      }
    } catch (error) {
      emit(
        error instanceof Error ? `Errore in fase di release: ${error.message}` : 'Errore in fase di release',
        'error'
      );
    } finally {
      listener.remove();
    }
  }
}
