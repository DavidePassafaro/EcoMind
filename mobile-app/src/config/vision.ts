export const VISION_LLM_CONFIG = {
  modelLabel: 'moondream2-text-model-f16_ct-vicuna.Q4_0',
  modelUri:
    'file:///storage/emulated/0/Android/data/com.anonymous.EcoMind/files/moondream2-text-model-f16_ct-vicuna.Q4_0.gguf',
  mmprojUri:
    'file:///storage/emulated/0/Android/data/com.anonymous.EcoMind/files/moondream2-mmproj-f16-20250414.gguf',
  prompt:
    "Descrivi in italiano cosa vedi nell'immagine. Concentrati su oggetti, cibo, ambiente, azioni e contesto generale. Rispondi in 4-6 righe chiare.",
  nCtx: 4096,
  nBatch: 256,
  nThreads: 4,
  nPredict: 160,
  temperature: 0.1,
} as const;
