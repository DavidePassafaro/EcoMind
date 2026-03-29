import type { Challenge } from '@/types/challenge';
import { getApiBaseUrl, getOrRefreshApiToken } from '@/services/api-auth';

function challengesDebug(label: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`[challenges] ${label}`);
    return;
  }

  try {
    console.log(`[challenges] ${label}`, payload);
  } catch {
    console.log(`[challenges] ${label}`);
  }
}

type RawChallenge = {
  id?: number | string;
  challengeId?: number | string;
  title?: string;
  name?: string;
  description?: string;
  details?: string;
  category?: string;
  type?: string;
  difficulty?: string;
  level?: string;
  points?: number;
  rewardPoints?: number;
  durationDays?: number;
  duration_days?: number;
};

function normalizeChallenge(raw: RawChallenge, index: number): Challenge {
  return {
    id: String(raw.id ?? raw.challengeId ?? `challenge-${index}`),
    title: raw.title?.trim() || raw.name?.trim() || 'Challenge EcoMind',
    description:
      raw.description?.trim() ||
      raw.details?.trim() ||
      'Una micro-azione pratica per migliorare le tue abitudini sostenibili.',
    category: raw.category?.trim() || raw.type?.trim() || 'Sostenibilita quotidiana',
    difficulty: raw.difficulty?.trim() || raw.level?.trim() || 'Starter',
    points:
      typeof raw.points === 'number'
        ? raw.points
        : typeof raw.rewardPoints === 'number'
          ? raw.rewardPoints
          : null,
    durationDays:
      typeof raw.durationDays === 'number'
        ? raw.durationDays
        : typeof raw.duration_days === 'number'
          ? raw.duration_days
          : null,
  };
}

function extractChallengeList(payload: unknown): RawChallenge[] {
  if (Array.isArray(payload)) {
    return payload as RawChallenge[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const candidate = payload as {
    challenges?: unknown;
    data?: unknown;
    items?: unknown;
  };

  if (Array.isArray(candidate.challenges)) {
    return candidate.challenges as RawChallenge[];
  }

  if (Array.isArray(candidate.data)) {
    return candidate.data as RawChallenge[];
  }

  if (Array.isArray(candidate.items)) {
    return candidate.items as RawChallenge[];
  }

  return [];
}

export async function getAvailableChallenges(): Promise<Challenge[]> {
  const baseUrl = getApiBaseUrl();
  challengesDebug('fetch available start', { baseUrl });

  async function requestChallenges(forceRefreshToken = false) {
    const token = await getOrRefreshApiToken(forceRefreshToken);
    challengesDebug('request available', {
      forceRefreshToken,
      hasToken: Boolean(token),
    });

    return fetch(`${baseUrl}/challenges`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  }

  let response = await requestChallenges(false);
  challengesDebug('available response', { status: response.status, ok: response.ok });

  if (response.status === 401) {
    challengesDebug('available got 401, retrying with fresh token');
    response = await requestChallenges(true);
    challengesDebug('available retry response', { status: response.status, ok: response.ok });
  }

  if (!response.ok) {
    throw new Error(`Impossibile recuperare le challenge (${response.status}).`);
  }

  const payload: unknown = await response.json();
  challengesDebug('available raw payload', payload);
  const challenges = extractChallengeList(payload).map(normalizeChallenge);
  challengesDebug('available normalized', {
    count: challenges.length,
    ids: challenges.map((challenge) => challenge.id),
  });

  if (!challenges.length) {
    throw new Error('Nessuna challenge disponibile al momento.');
  }

  return challenges;
}

export async function acceptChallenge(challengeId: string) {
  const baseUrl = getApiBaseUrl();
  challengesDebug('accept start', { challengeId, baseUrl });

  async function requestAccept(forceRefreshToken = false) {
    const token = await getOrRefreshApiToken(forceRefreshToken);
    challengesDebug('request accept', {
      challengeId,
      forceRefreshToken,
      hasToken: Boolean(token),
    });

    return fetch(`${baseUrl}/challenges/accept`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        challengeId: Number(challengeId),
      }),
    });
  }

  let response = await requestAccept(false);
  challengesDebug('accept response', { challengeId, status: response.status, ok: response.ok });

  if (response.status === 401) {
    challengesDebug('accept got 401, retrying with fresh token', { challengeId });
    response = await requestAccept(true);
    challengesDebug('accept retry response', { challengeId, status: response.status, ok: response.ok });
  }

  if (!response.ok) {
    throw new Error(`Impossibile accettare la challenge (${response.status}).`);
  }

  return response;
}

export async function acceptCustomChallenge({
  title,
  description,
  points = 15,
}: {
  title: string;
  description: string;
  points?: number;
}) {
  const baseUrl = getApiBaseUrl();
  challengesDebug('accept custom start', { title, points, baseUrl });

  async function requestAccept(forceRefreshToken = false) {
    const token = await getOrRefreshApiToken(forceRefreshToken);
    challengesDebug('request accept custom', {
      forceRefreshToken,
      hasToken: Boolean(token),
      title,
    });

    return fetch(`${baseUrl}/challenges/accept`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        points,
      }),
    });
  }

  let response = await requestAccept(false);
  challengesDebug('accept custom response', { title, status: response.status, ok: response.ok });

  if (response.status === 401) {
    challengesDebug('accept custom got 401, retrying with fresh token', { title });
    response = await requestAccept(true);
    challengesDebug('accept custom retry response', { title, status: response.status, ok: response.ok });
  }

  if (!response.ok) {
    throw new Error(`Impossibile accettare la challenge personalizzata (${response.status}).`);
  }

  return response;
}
