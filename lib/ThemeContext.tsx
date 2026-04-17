import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palette, radius, spacing, typography, type ColorScheme, type Theme } from './theme';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: ColorScheme;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const STORAGE_KEY = 'dziennik.themeMode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildTheme(scheme: ColorScheme): Theme {
  return { scheme, colors: palette(scheme), spacing, radius, typography };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = (useColorScheme() ?? 'light') as ColorScheme;
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setModeState(raw);
        }
      })
      .catch(() => {
        // AsyncStorage niedostępne np. w SSR — zostajemy na 'system'.
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggle = () => {
    const effective: ColorScheme = mode === 'system' ? systemScheme : mode;
    setMode(effective === 'dark' ? 'light' : 'dark');
  };

  const scheme: ColorScheme = mode === 'system' ? systemScheme : mode;
  const theme = buildTheme(scheme);

  if (!hydrated) {
    // Pierwszy render: czekamy na odczyt preferencji, żeby uniknąć mignięcia motywu.
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, scheme, theme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
