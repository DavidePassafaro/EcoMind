import * as FileSystemLegacy from 'expo-file-system/legacy';
import { extractTextFromImage, isSupported as isReceiptOcrSupported } from 'expo-text-extractor';
import { type LlamaContext, type RNLlamaOAICompatibleMessage } from 'llama.rn';

import { RECEIPT_ANALYSIS_PROMPT } from '@/config/receipt';
import { LOCAL_LLM_CONFIG } from '@/config/llm';

type ReceiptProgressStage =
  | 'checking-files'
  | 'extracting-receipt'
  | 'summarizing';

type ProgressCallback = (stage: ReceiptProgressStage) => void;
type SummaryTokenCallback = (text: string) => void;

export type ReceiptAnalysisResult = {
  assistantSummary: string;
  imageUri: string;
  ocrLines: string[];
};

function receiptDebug(label: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`[receipt] ${label}`);
    return;
  }

  try {
    console.log(`[receipt] ${label}`, payload);
  } catch {
    console.log(`[receipt] ${label}`);
  }
}

function logReceiptCompletionMetrics(
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
  receiptDebug('completion metrics', {
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

function stripThinkingTags(value: string) {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim();
}

function buildReceiptSystemPrompt() {
  return `/no_think

Sei EcoMind.
Analizza solo il contenuto di uno scontrino OCR.
Rispondi sempre in italiano.
Sii breve, chiaro e pratico.
Non mostrare reasoning interno.
Non usare tag <think>.
Se alcune righe sono ambigue, dillo brevemente invece di inventare dettagli.`;
}

async function ensureFileExists(path: string) {
  const info = await FileSystemLegacy.getInfoAsync(path);
  if (!info.exists) {
    throw new Error(`File richiesto non trovato: ${path}`);
  }
}

function buildReceiptAnalysisUserPrompt(ocrLines: string[]) {
  const compactLines = ocrLines
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 24)
    .join('\n');

  return `${RECEIPT_ANALYSIS_PROMPT}

RIGHE OCR:
${compactLines}`;
}

async function extractReceiptLines(imageUri: string, onProgress?: ProgressCallback) {
  onProgress?.('checking-files');
  receiptDebug('checking image file');
  await ensureFileExists(imageUri);

  if (!isReceiptOcrSupported) {
    throw new Error('OCR non supportato su questo dispositivo.');
  }

  onProgress?.('extracting-receipt');
  receiptDebug('starting ocr extraction', { imageUri });
  const ocrLines = await extractTextFromImage(imageUri);
  receiptDebug('raw ocr lines', ocrLines);
  return ocrLines;
}

export async function analyzeReceiptWithLocalModels({
  assistantContext,
  imageUri,
  onProgress,
  onSummaryToken,
}: {
  assistantContext: LlamaContext;
  imageUri: string;
  thinkingEnabled: boolean;
  onProgress?: ProgressCallback;
  onSummaryToken?: SummaryTokenCallback;
}): Promise<ReceiptAnalysisResult> {
  receiptDebug('analysis start');
  const ocrLines = await extractReceiptLines(imageUri, onProgress);

  onProgress?.('summarizing');
  receiptDebug('starting assistant receipt summary');

  const payload: RNLlamaOAICompatibleMessage[] = [
    { role: 'system', content: buildReceiptSystemPrompt() },
    { role: 'user', content: buildReceiptAnalysisUserPrompt(ocrLines) },
  ];
  const startedAt = Date.now();

  const result = await assistantContext.completion(
    {
      messages: payload,
      n_predict: 700,
      temperature: 0.4,
      stop: [...LOCAL_LLM_CONFIG.stop],
    },
    (data) => {
      const nextText = stripThinkingTags(data.accumulated_text ?? data.content ?? '');
      if (nextText) {
        onSummaryToken?.(nextText);
      }
    }
  );

  const assistantSummary = stripThinkingTags(result.text.trim());
  receiptDebug('assistant summary', assistantSummary);
  logReceiptCompletionMetrics(result, Date.now() - startedAt);

  return {
    assistantSummary,
    imageUri,
    ocrLines,
  };
}
