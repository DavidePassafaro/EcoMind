import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import type { Challenge } from '@/types/challenge';

type CheckInMood = 'great' | 'ok' | 'hard';

type CheckInEntry = {
  date: string;
  mood: CheckInMood;
};

type WeeklyTrendPoint = {
  date: string;
  label: string;
  score: number;
  hasCheckIn: boolean;
  actionCompleted: boolean;
};

type WeeklyComparison = {
  currentWeekAverageScore: number;
  previousWeekAverageScore: number;
  scoreDelta: number;
  currentWeekCompletionRate: number;
  previousWeekCompletionRate: number;
  completionDelta: number;
  currentWeekActionCount: number;
  previousWeekActionCount: number;
  actionDelta: number;
  currentWeekCheckInCount: number;
  previousWeekCheckInCount: number;
};

type EcoDataState = {
  checkIns: CheckInEntry[];
  completedActionDates: string[];
  acceptedChallenges: Challenge[];
};

type EcoDataContextValue = EcoDataState & {
  isReady: boolean;
  todaysCheckIn?: CheckInEntry;
  currentStreak: number;
  completedActionsCount: number;
  weeklyTrend: WeeklyTrendPoint[];
  weeklyCompletionRate: number;
  previousWeeklyTrend: WeeklyTrendPoint[];
  weeklyComparison: WeeklyComparison;
  completeTodayAction: () => void;
  undoTodayAction: () => void;
  submitCheckIn: (mood: CheckInMood) => void;
  saveAcceptedChallenge: (challenge: Challenge) => void;
  resetEcoData: () => void;
};

const defaultState: EcoDataState = {
  checkIns: [],
  completedActionDates: [],
  acceptedChallenges: [],
};

const STORAGE_KEY = 'ecomind.eco-data.v1';
const EcoDataContext = createContext<EcoDataContextValue | null>(null);

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isValidState(value: unknown): value is EcoDataState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EcoDataState>;

  return (
    Array.isArray(candidate.checkIns) &&
    candidate.checkIns.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof entry.date === 'string' &&
        ['great', 'ok', 'hard'].includes(entry.mood as string)
    ) &&
    Array.isArray(candidate.completedActionDates) &&
    candidate.completedActionDates.every((value) => typeof value === 'string') &&
    Array.isArray(candidate.acceptedChallenges)
  );
}

function computeStreak(checkIns: CheckInEntry[]) {
  const completedDays = new Set(checkIns.map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const dateKey = cursor.toISOString().slice(0, 10);
    if (!completedDays.has(dateKey)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getShortDayLabel(date: Date) {
  return date
    .toLocaleDateString('en-US', { weekday: 'short' })
    .slice(0, 2)
    .toUpperCase();
}

function getMoodScore(mood?: CheckInMood) {
  if (mood === 'great') {
    return 32;
  }
  if (mood === 'ok') {
    return 22;
  }
  if (mood === 'hard') {
    return 12;
  }

  return 0;
}

function buildWeeklyTrend(checkIns: CheckInEntry[], completedActionDates: string[]) {
  return buildRelativeWeeklyTrend(checkIns, completedActionDates, 0);
}

function buildRelativeWeeklyTrend(
  checkIns: CheckInEntry[],
  completedActionDates: string[],
  weekOffset: number
) {
  const checkInMap = new Map(checkIns.map((entry) => [entry.date, entry]));
  const actionSet = new Set(completedActionDates);
  const points: WeeklyTrendPoint[] = [];
  const dayOffsetBase = weekOffset * 7;

  for (let offset = 6; offset >= 0; offset -= 1) {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - offset - dayOffsetBase);
    const dateKey = cursor.toISOString().slice(0, 10);
    const checkIn = checkInMap.get(dateKey);
    const actionCompleted = actionSet.has(dateKey);
    const score = Math.min(getMoodScore(checkIn?.mood) + (actionCompleted ? 48 : 0), 100);

    points.push({
      date: dateKey,
      label: getShortDayLabel(cursor),
      score,
      hasCheckIn: Boolean(checkIn),
      actionCompleted,
    });
  }

  return points;
}

function computeWeeklyCompletionRate(points: WeeklyTrendPoint[]) {
  const completedDays = points.filter((point) => point.hasCheckIn || point.actionCompleted).length;
  return Math.round((completedDays / points.length) * 100);
}

function computeAverageScore(points: WeeklyTrendPoint[]) {
  const total = points.reduce((sum, point) => sum + point.score, 0);
  return Math.round(total / points.length);
}

function computeWeeklyComparison(
  currentWeek: WeeklyTrendPoint[],
  previousWeek: WeeklyTrendPoint[]
): WeeklyComparison {
  const currentWeekAverageScore = computeAverageScore(currentWeek);
  const previousWeekAverageScore = computeAverageScore(previousWeek);
  const currentWeekCompletionRate = computeWeeklyCompletionRate(currentWeek);
  const previousWeekCompletionRate = computeWeeklyCompletionRate(previousWeek);
  const currentWeekActionCount = currentWeek.filter((point) => point.actionCompleted).length;
  const previousWeekActionCount = previousWeek.filter((point) => point.actionCompleted).length;
  const currentWeekCheckInCount = currentWeek.filter((point) => point.hasCheckIn).length;
  const previousWeekCheckInCount = previousWeek.filter((point) => point.hasCheckIn).length;

  return {
    currentWeekAverageScore,
    previousWeekAverageScore,
    scoreDelta: currentWeekAverageScore - previousWeekAverageScore,
    currentWeekCompletionRate,
    previousWeekCompletionRate,
    completionDelta: currentWeekCompletionRate - previousWeekCompletionRate,
    currentWeekActionCount,
    previousWeekActionCount,
    actionDelta: currentWeekActionCount - previousWeekActionCount,
    currentWeekCheckInCount,
    previousWeekCheckInCount,
  };
}

export function EcoDataProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<EcoDataState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateEcoData() {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
          return;
        }

        const parsedValue: unknown = JSON.parse(storedValue);

        if (isMounted && isValidState(parsedValue)) {
          setState(parsedValue);
        }
      } catch {
        if (isMounted) {
          setState(defaultState);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    hydrateEcoData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Storage failures should not block app usage.
    });
  }, [isReady, state]);

  const todayKey = getTodayKey();
  const todaysCheckIn = state.checkIns.find((entry) => entry.date === todayKey);
  const currentStreak = useMemo(() => computeStreak(state.checkIns), [state.checkIns]);
  const completedActionsCount = state.completedActionDates.length;
  const weeklyTrend = useMemo(
    () => buildWeeklyTrend(state.checkIns, state.completedActionDates),
    [state.checkIns, state.completedActionDates]
  );
  const previousWeeklyTrend = useMemo(
    () => buildRelativeWeeklyTrend(state.checkIns, state.completedActionDates, 1),
    [state.checkIns, state.completedActionDates]
  );
  const weeklyCompletionRate = useMemo(() => computeWeeklyCompletionRate(weeklyTrend), [weeklyTrend]);
  const weeklyComparison = useMemo(
    () => computeWeeklyComparison(weeklyTrend, previousWeeklyTrend),
    [weeklyTrend, previousWeeklyTrend]
  );

  return (
    <EcoDataContext.Provider
      value={{
        ...state,
        isReady,
        todaysCheckIn,
        currentStreak,
        completedActionsCount,
        weeklyTrend,
        weeklyCompletionRate,
        previousWeeklyTrend,
        weeklyComparison,
        completeTodayAction: () =>
          setState((current) =>
            current.completedActionDates.includes(todayKey)
              ? current
              : {
                  ...current,
                  completedActionDates: [todayKey, ...current.completedActionDates].slice(0, 30),
                }
          ),
        undoTodayAction: () =>
          setState((current) => ({
            ...current,
            completedActionDates: current.completedActionDates.filter((date) => date !== todayKey),
          })),
        submitCheckIn: (mood) =>
          setState((current) => {
            const nextCheckIns = current.checkIns.filter((entry) => entry.date !== todayKey);
            nextCheckIns.unshift({ date: todayKey, mood });

            return {
              ...current,
              checkIns: nextCheckIns.slice(0, 30),
            };
          }),
        saveAcceptedChallenge: (challenge) =>
          setState((current) => {
            const alreadyExists = current.acceptedChallenges.some((item) => item.id === challenge.id);

            if (alreadyExists) {
              return current;
            }

            return {
              ...current,
              acceptedChallenges: [{ ...challenge, isAccepted: true }, ...current.acceptedChallenges].slice(0, 12),
            };
          }),
        resetEcoData: () => setState(defaultState),
      }}>
      {children}
    </EcoDataContext.Provider>
  );
}

export function useEcoData() {
  const context = useContext(EcoDataContext);

  if (!context) {
    throw new Error('useEcoData must be used within an EcoDataProvider');
  }

  return context;
}
