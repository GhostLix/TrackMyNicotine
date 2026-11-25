import AsyncStorage from '@react-native-async-storage/async-storage';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk/400Regular';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { useFonts } from 'expo-font';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  buildTheme,
  DEV_GROUPS,
  type ButtonId,
  type CardId,
  type DevGroupKey,
  type StyleId,
  type TextId,
  type Theme,
} from '@/theme/themes';

/** Salvato a parte dai dati dell'app: "Cancella tutti i dati" e l'anteprima web non lo azzerano. */
const DEV_KEY = 'trackmynicotine/dev/v1';

/** Variante scelta per ogni gruppo (numerate da 1). */
export type DevSettings = Record<DevGroupKey, number>;

export const DEFAULT_DEV: DevSettings = Object.fromEntries(
  Object.keys(DEV_GROUPS).map((k) => [k, 1]),
) as DevSettings;

type ThemeContextValue = {
  theme: Theme;
  dev: DevSettings;
  setDev: (patch: Partial<DevSettings>) => void;
  /** true quando preferenze e font sono pronti (fino ad allora resta lo splash). */
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function sanitize(raw: Partial<Record<string, unknown>>): DevSettings {
  const out = { ...DEFAULT_DEV };
  for (const key of Object.keys(DEV_GROUPS) as DevGroupKey[]) {
    const v = raw[key];
    const max = DEV_GROUPS[key].options.length;
    if (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= max) out[key] = v;
  }
  return out;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dev, setDevState] = useState<DevSettings>(DEFAULT_DEV);
  const [devLoaded, setDevLoaded] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(DEV_KEY)
      .then((raw) => {
        if (!raw) return;
        setDevState(sanitize(JSON.parse(raw) as Partial<Record<string, unknown>>));
      })
      .catch(() => {})
      .finally(() => setDevLoaded(true));
  }, []);

  const setDev = useCallback((patch: Partial<DevSettings>) => {
    setDevState((d) => {
      const next = { ...d, ...patch };
      AsyncStorage.setItem(DEV_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Se un font non si carica si usa quello di sistema, invece di bloccare l'app.
  const textId = (fontError ? 1 : dev.text) as TextId;
  const theme = useMemo(
    () => buildTheme(dev.style as StyleId, textId, dev.button as ButtonId, dev.card as CardId),
    [dev.style, textId, dev.button, dev.card],
  );
  const ready = devLoaded && (fontsLoaded || !!fontError);

  const value = useMemo(() => ({ theme, dev, setDev, ready }), [theme, dev, setDev, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve essere usato dentro <ThemeProvider>');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useDevSettings() {
  const { dev, setDev, ready } = useThemeContext();
  return { dev, setDev, ready };
}

/** Crea gli stili di un componente a partire dal tema, ricalcolandoli solo quando il tema cambia. */
export function useStyles<T>(factory: (t: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
