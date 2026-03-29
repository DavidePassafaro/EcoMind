import type {
  NormalizedReceiptItem,
  ReceiptAlternative,
  ReceiptCategory,
  ReceiptImpactItem,
  ReceiptImpactSummary,
} from '@/types/receipt';

type ImpactProfile = {
  co2Kg: number;
  waterLiters: number;
  alternative: ReceiptAlternative | null;
};

const IMPACT_BY_CATEGORY: Record<ReceiptCategory, ImpactProfile> = {
  beef: {
    co2Kg: 8.4,
    waterLiters: 2200,
    alternative: {
      title: 'Lenticchie o ceci',
      reason: 'mantieni una base proteica con un impatto molto piu basso',
      priceDeltaLabel: 'prezzo simile o piu basso',
      co2DeltaLabel: '-70% CO2 stimata',
      waterDeltaLabel: '-90% acqua stimata',
    },
  },
  chicken: {
    co2Kg: 2.7,
    waterLiters: 900,
    alternative: {
      title: 'Legumi pronti o tofu',
      reason: 'riduci l’impatto restando in una fascia accessibile',
      priceDeltaLabel: 'prezzo simile',
      co2DeltaLabel: '-45% CO2 stimata',
      waterDeltaLabel: '-65% acqua stimata',
    },
  },
  pork: {
    co2Kg: 3.8,
    waterLiters: 1200,
    alternative: {
      title: 'Pollo o legumi',
      reason: 'stesso uso in molti pasti ma costo ambientale piu contenuto',
      priceDeltaLabel: 'prezzo simile',
      co2DeltaLabel: '-35% CO2 stimata',
      waterDeltaLabel: '-50% acqua stimata',
    },
  },
  fish: {
    co2Kg: 3.1,
    waterLiters: 700,
    alternative: {
      title: 'Legumi o tonno con porzione ridotta',
      reason: 'puoi alleggerire l’impatto mantenendo praticita',
      priceDeltaLabel: 'prezzo simile',
      co2DeltaLabel: '-30% CO2 stimata',
      waterDeltaLabel: '-45% acqua stimata',
    },
  },
  dairy: {
    co2Kg: 1.9,
    waterLiters: 620,
    alternative: {
      title: 'Versione vegetale equivalente',
      reason: 'utile soprattutto per latte e yogurt',
      priceDeltaLabel: 'entro una fascia vicina',
      co2DeltaLabel: '-35% CO2 stimata',
      waterDeltaLabel: '-60% acqua stimata',
    },
  },
  eggs: {
    co2Kg: 1.4,
    waterLiters: 500,
    alternative: {
      title: 'Mix legumi e cereali',
      reason: 'ottima alternativa per pasti completi',
      priceDeltaLabel: 'prezzo simile',
      co2DeltaLabel: '-25% CO2 stimata',
      waterDeltaLabel: '-40% acqua stimata',
    },
  },
  legumes: {
    co2Kg: 0.9,
    waterLiters: 150,
    alternative: null,
  },
  grains: {
    co2Kg: 0.8,
    waterLiters: 120,
    alternative: null,
  },
  vegetables: {
    co2Kg: 0.5,
    waterLiters: 90,
    alternative: null,
  },
  fruit: {
    co2Kg: 0.6,
    waterLiters: 100,
    alternative: null,
  },
  plant_milk: {
    co2Kg: 0.7,
    waterLiters: 75,
    alternative: null,
  },
  snacks: {
    co2Kg: 1.2,
    waterLiters: 200,
    alternative: {
      title: 'Snack semplice a base vegetale',
      reason: 'meno packaging e meno ingredienti ad alto impatto',
      priceDeltaLabel: 'prezzo simile',
      co2DeltaLabel: '-20% CO2 stimata',
      waterDeltaLabel: '-25% acqua stimata',
    },
  },
  beverages: {
    co2Kg: 0.9,
    waterLiters: 180,
    alternative: {
      title: 'Acqua o bevanda meno processata',
      reason: 'riduci impatto e spesso anche il costo',
      priceDeltaLabel: 'spesso piu basso',
      co2DeltaLabel: '-15% CO2 stimata',
      waterDeltaLabel: '-20% acqua stimata',
    },
  },
  household: {
    co2Kg: 0.7,
    waterLiters: 60,
    alternative: {
      title: 'Ricarica o formato concentrato',
      reason: 'meno packaging e migliore efficienza di trasporto',
      priceDeltaLabel: 'prezzo simile nel medio periodo',
      co2DeltaLabel: '-15% CO2 stimata',
      waterDeltaLabel: '-10% acqua stimata',
    },
  },
  unknown: {
    co2Kg: 0.8,
    waterLiters: 150,
    alternative: null,
  },
};

function computeItemImpact(item: NormalizedReceiptItem): ReceiptImpactItem {
  const profile = IMPACT_BY_CATEGORY[item.category];
  const multiplier = item.total_price && item.total_price > 8 ? 1.4 : item.total_price && item.total_price > 4 ? 1.1 : 1;

  return {
    label: item.canonical_name ?? item.raw_label,
    category: item.category,
    co2Kg: Number((profile.co2Kg * multiplier).toFixed(1)),
    waterLiters: Math.round(profile.waterLiters * multiplier),
    totalPrice: item.total_price,
    alternative: profile.alternative,
  };
}

export function buildReceiptImpactSummary(
  items: NormalizedReceiptItem[]
): ReceiptImpactSummary {
  const impacts = items.map(computeItemImpact);
  const estimatedCo2Kg = Number(impacts.reduce((sum, item) => sum + item.co2Kg, 0).toFixed(1));
  const estimatedWaterLiters = Math.round(
    impacts.reduce((sum, item) => sum + item.waterLiters, 0)
  );
  const topImpactItems = [...impacts].sort((a, b) => b.co2Kg - a.co2Kg).slice(0, 3);
  const alternatives = topImpactItems
    .map((item) => item.alternative)
    .filter((alternative): alternative is ReceiptAlternative => Boolean(alternative));

  return {
    estimatedCo2Kg,
    estimatedWaterLiters,
    topImpactItems,
    alternatives,
  };
}
