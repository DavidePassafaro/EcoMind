export type ReceiptExtractionItem = {
  raw_label: string;
  quantity_text: string | null;
  unit_price: number | null;
  total_price: number | null;
};

export type ReceiptExtractionResult = {
  store_name: string | null;
  date: string | null;
  currency: string | null;
  items: ReceiptExtractionItem[];
};

export type ReceiptCategory =
  | 'beef'
  | 'chicken'
  | 'pork'
  | 'fish'
  | 'dairy'
  | 'eggs'
  | 'legumes'
  | 'grains'
  | 'vegetables'
  | 'fruit'
  | 'plant_milk'
  | 'snacks'
  | 'beverages'
  | 'household'
  | 'unknown';

export type NormalizedReceiptItem = {
  raw_label: string;
  canonical_name: string | null;
  category: ReceiptCategory;
  confidence: number;
  notes: string | null;
  quantity_text: string | null;
  unit_price: number | null;
  total_price: number | null;
};

export type ReceiptAlternative = {
  title: string;
  reason: string;
  priceDeltaLabel: string;
  co2DeltaLabel: string;
  waterDeltaLabel: string;
};

export type ReceiptImpactItem = {
  label: string;
  category: ReceiptCategory;
  co2Kg: number;
  waterLiters: number;
  totalPrice: number | null;
  alternative: ReceiptAlternative | null;
};

export type ReceiptImpactSummary = {
  estimatedCo2Kg: number;
  estimatedWaterLiters: number;
  topImpactItems: ReceiptImpactItem[];
  alternatives: ReceiptAlternative[];
};

export type ReceiptAnalysisResult = {
  extraction: ReceiptExtractionResult;
  normalizedItems: NormalizedReceiptItem[];
  impactSummary: ReceiptImpactSummary;
  assistantSummary: string;
  imageUri: string;
};
