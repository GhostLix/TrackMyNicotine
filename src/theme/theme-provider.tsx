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
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit/800ExtraBold';
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
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
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
