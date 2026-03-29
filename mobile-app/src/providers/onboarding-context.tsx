import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import {
  focusAreas,
  goals,
  profiles,
  type FocusArea,
  type GoalType,
  type ProfileType,
} from '@/constants/onboarding';

type OnboardingState = {
  focus: FocusArea;
  profile: ProfileType;
  goal: GoalType;
  completed: boolean;
};

type OnboardingContextValue = OnboardingState & {
  isReady: boolean;
  setFocus: (value: FocusArea) => void;
  setProfile: (value: ProfileType) => void;
  setGoal: (value: GoalType) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

const defaultState: OnboardingState = {
  focus: 'food',
  profile: 'starter',
  goal: 'Tagliare gli sprechi settimanali',
  completed: false,
};
const STORAGE_KEY = 'ecomind.onboarding.v1';

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function isValidState(value: unknown): value is OnboardingState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OnboardingState>;
  const validFocuses = focusAreas.map((item) => item.id);
  const validProfiles = profiles.map((item) => item.id);

  return (
    typeof candidate.completed === 'boolean' &&
    typeof candidate.focus === 'string' &&
    validFocuses.includes(candidate.focus) &&
    typeof candidate.profile === 'string' &&
    validProfiles.includes(candidate.profile) &&
    typeof candidate.goal === 'string' &&
    goals.includes(candidate.goal as GoalType)
  );
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateOnboarding() {
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

    hydrateOnboarding();

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

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        isReady,
        setFocus: (focus) => setState((current) => ({ ...current, focus })),
        setProfile: (profile) => setState((current) => ({ ...current, profile })),
        setGoal: (goal) => setState((current) => ({ ...current, goal })),
        completeOnboarding: () => setState((current) => ({ ...current, completed: true })),
        resetOnboarding: () => setState(defaultState),
      }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }

  return context;
}
