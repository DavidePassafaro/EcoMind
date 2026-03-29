export type Challenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number | null;
  durationDays: number | null;
  isAccepted?: boolean;
};
