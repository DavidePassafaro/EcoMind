export const onboardingPoints = [
  {
    eyebrow: '01',
    title: 'Capisci il tuo impatto',
    body: 'Trasforma abitudini quotidiane in segnali semplici, leggibili e utili da seguire nel tempo.',
  },
  {
    eyebrow: '02',
    title: 'Ricevi micro-azioni concrete',
    body: 'EcoMind ti propone passi piccoli ma realistici, pensati per entrare davvero nella tua routine.',
  },
  {
    eyebrow: '03',
    title: 'Costruisci costanza',
    body: 'Puntiamo a progressi misurabili settimana dopo settimana, non a una perfezione impossibile.',
  },
] as const;

export const focusAreas = [
  {
    id: 'food',
    title: 'Alimentazione',
    description: 'Riduci sprechi, migliora la spesa e scegli abitudini piu sostenibili.',
  },
  {
    id: 'mobility',
    title: 'Mobilita',
    description: 'Monitora spostamenti, alternative leggere e impatto dei tragitti abituali.',
  },
  {
    id: 'home',
    title: 'Casa',
    description: 'Parti da energia, acqua e piccoli consumi che pesano piu di quanto sembra.',
  },
] as const;

export const profiles = [
  {
    id: 'starter',
    title: 'Parto da zero',
    description: 'Voglio capire le basi e ricevere consigli semplici.',
  },
  {
    id: 'aware',
    title: 'Gia sensibile al tema',
    description: 'Ho gia qualche buona abitudine, mi serve piu costanza.',
  },
  {
    id: 'builder',
    title: 'Voglio misurare tutto',
    description: 'Cerco progressi, obiettivi e feedback piu puntuali.',
  },
] as const;

export const goals = [
  'Tagliare gli sprechi settimanali',
  'Abbassare il mio impatto personale',
  'Creare una routine piu green',
] as const;

export const dashboardCopy = {
  food: {
    title: 'Settimana alimentazione consapevole',
    metric: '12 pasti tracciati',
    action: 'Pianifica due cene anti-spreco prima di domenica.',
  },
  mobility: {
    title: 'Settimana mobilita intelligente',
    metric: '4 tragitti ottimizzati',
    action: 'Sostituisci un tragitto breve con una soluzione piu leggera.',
  },
  home: {
    title: 'Settimana casa efficiente',
    metric: '3 consumi sotto osservazione',
    action: "Controlla un'abitudine domestica che puoi ridurre gia oggi.",
  },
} as const;

export const profileCopy = {
  starter: 'Hai scelto un profilo introduttivo: pochi step, molta chiarezza.',
  aware: 'Hai gia una base buona: il lavoro ora e consolidare le abitudini giuste.',
  builder: 'Vuoi misurare i progressi: ti mostreremo segnali e metriche piu concrete.',
} as const;

export const focusPlans = {
  food: {
    scoreLabel: 'Eco score cibo',
    score: 72,
    actionLabel: 'Meal planning completato',
    milestones: [
      'Pianifica 2 cene anti-spreco',
      'Registra 1 spesa piu consapevole',
      'Chiudi la settimana con zero sprechi visibili',
    ],
  },
  mobility: {
    scoreLabel: 'Eco score mobilita',
    score: 68,
    actionLabel: 'Alternativa leggera provata',
    milestones: [
      'Sostituisci 1 tragitto breve',
      'Monitora 3 spostamenti abituali',
      'Riduci almeno un viaggio non necessario',
    ],
  },
  home: {
    scoreLabel: 'Eco score casa',
    score: 75,
    actionLabel: 'Azione domestica completata',
    milestones: [
      'Controlla 1 abitudine energetica',
      'Riduci 1 consumo ripetuto',
      'Conferma la routine migliore entro domenica',
    ],
  },
} as const;

export const curatedChallenges = [
  {
    title: 'Settimana senza bottiglie usa e getta',
    objective: 'Usa solo borraccia o contenitori riutilizzabili per 7 giorni.',
  },
  {
    title: 'Cena vegetale per tre sere',
    objective: 'Sostituisci per tre sere un pasto con un’alternativa vegetale semplice e bilanciata.',
  },
  {
    title: 'Zero sprechi in cucina per 5 giorni',
    objective: 'Organizza pasti e avanzi in modo da non buttare cibo per cinque giorni consecutivi.',
  },
  {
    title: 'Mobilita leggera per 3 giorni',
    objective: 'Scegli per tre giorni un’alternativa piu sostenibile all’auto, come camminare, bici o mezzi pubblici.',
  },
  {
    title: 'Spesa senza sprechi per una settimana',
    objective: 'Pianifica acquisti e pasti per 7 giorni evitando doppioni, eccessi e cibo destinato a scadere.',
  },
] as const;

export type FocusArea = (typeof focusAreas)[number]['id'];
export type ProfileType = (typeof profiles)[number]['id'];
export type GoalType = (typeof goals)[number];
