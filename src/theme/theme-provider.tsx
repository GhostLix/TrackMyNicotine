import AsyncStorage from '@react-native-async-storage/async-storage';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
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

import { buildTheme, type Appearance, type Theme } from '@/theme/themes';

/** Salvato a parte dai dati dell'app: "Cancella tutti i dati" e l'anteprima web non lo azzerano. */
const APPEARANCE_KEY = 'trackmynicotine/appearance/v1';

type ThemeContextValue = {
  theme: Theme;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
  /** true quando preferenza e font sono pronti (fino ad allora resta lo splash). */
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>('giorno');
  const [loaded, setLoaded] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });

  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_KEY)
      .then((raw) => {
        if (raw === 'giorno' || raw === 'notte') setAppearanceState(raw);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setAppearance = useCallback((a: Appearance) => {
    setAppearanceState(a);
    AsyncStorage.setItem(APPEARANCE_KEY, a).catch(() => {});
  }, []);

  const theme = useMemo(() => buildTheme(appearance), [appearance]);
  // Se il font non si carica si prosegue comunque (il sistema userà il carattere di default).
  const ready = loaded && (fontsLoaded || !!fontError);

  const value = useMemo(
    () => ({ theme, appearance, setAppearance, ready }),
    [theme, appearance, setAppearance, ready],
  );
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

export function useAppearance() {
  const { appearance, setAppearance, ready } = useThemeContext();
  return { appearance, setAppearance, ready };
}

/** Crea gli stili di un componente a partire dal tema, ricalcolandoli solo quando il tema cambia. */
export function useStyles<T>(factory: (t: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
