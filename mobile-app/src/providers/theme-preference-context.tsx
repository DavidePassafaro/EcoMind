import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemeMode = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

type ThemePreferenceContextValue = {
  isReady: boolean;
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = 'ecomind.theme-mode.v1';
const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateThemeMode() {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue === 'system' || storedValue === 'light' || storedValue === 'dark') {
          if (isMounted) {
            setMode(storedValue);
          }
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    hydrateThemeMode();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {
      // Theme preference failures should not block app usage.
    });
  }, [isReady, mode]);

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }

    return mode;
  }, [mode, systemScheme]);

  return (
    <ThemePreferenceContext.Provider value={{ isReady, mode, resolvedTheme, setMode }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }

  return context;
}
