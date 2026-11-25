import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Aspetto dell'app. Due modalità, scelte dalle Impostazioni:
 * - Giorno: blu brillante su grigio chiaro, card bianche con ombra morbida;
 * - Notte: stesso blu su fondo blu notte, card con bordo sottile.
 * Carattere: DM Sans. Ogni componente legge colori, raggi, ombre e font da qui.
 */

export type Appearance = 'giorno' | 'notte';

export type Palette = {
  /** Sfondo della schermata. */
  background: string;
  /** Superficie delle card. */
  card: string;
  /** Superficie secondaria (campi di testo, chip non attivi). */
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  /** Bordo dei controlli non attivi (caselle): più marcato di `border`. */
  control: string;
  primary: string;
  primaryDark: string;
  /** Sfondo tenue dell'accento (pill, righe selezionate). */
  primarySoft: string;
  /** Testo/icone sopra il colore primario. */
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  ringTrack: string;
  /** Velo dietro i modali. */
  backdrop: string;
  /** Colore dell'ombra delle card. */
  shadow: string;
};

const PALETTES: Record<Appearance, Palette> = {
  giorno: {
    background: '#F4F6FB',
    card: '#FFFFFF',
    surface: '#F1F4FA',
    text: '#1B2340',
    textMuted: '#7D86A1',
    border: '#E6E9F2',
    control: '#C5CCDD',
    primary: '#3D6EF5',
    primaryDark: '#2A54D1',
    primarySoft: '#E8EEFE',
    onPrimary: '#FFFFFF',
    danger: '#E5484D',
    dangerSoft: '#FDECEC',
    ringTrack: '#E3E8F5',
    backdrop: 'rgba(27, 35, 64, 0.45)',
    shadow: '#2A3A6B',
  },
  notte: {
    background: '#0D1220',
    card: '#161D2E',
    surface: '#1E2638',
    text: '#ECF1FA',
    textMuted: '#8D98B0',
    border: '#263045',
    control: '#4C5873',
    primary: '#5B8CFF',
    primaryDark: '#8AAEFF',
    primarySoft: '#1B2A4D',
    onPrimary: '#FFFFFF',
    danger: '#FF6B6E',
    dangerSoft: '#3A1E25',
    ringTrack: '#222B40',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
  },
};

type Weight = '400' | '500' | '600' | '700' | '800';

/** DM Sans: compatto e leggibile, dall'aspetto morbido. */
const FONT: Record<Weight, string> = {
  '400': 'DMSans_400Regular',
  '500': 'DMSans_500Medium',
  '600': 'DMSans_600SemiBold',
  '700': 'DMSans_700Bold',
  '800': 'DMSans_800ExtraBold',
};

export type Theme = {
  appearance: Appearance;
  dark: boolean;
  colors: Palette;
  radius: { sm: number; md: number; lg: number; pill: number };
  /** Stile di testo completo: dimensione, e famiglia del font con il peso richiesto. */
  text: (size: number, weight?: Weight) => TextStyle;
  /** Solo il peso (cioè la famiglia equivalente), per testi annidati che ereditano la dimensione. */
  weight: (weight: Weight) => TextStyle;
  /** Aspetto delle card: ombra di giorno, bordo sottile di notte (le ombre sul nero non si vedono). */
  elevation: ViewStyle;
  /** Forma dei bottoni: raggio e testo. */
  button: { radius: number; label: TextStyle };
  /** Font per i testi dentro gli SVG (assi del grafico). */
  svgFont: string;
};

export function buildTheme(appearance: Appearance): Theme {
  const colors = PALETTES[appearance];
  const dark = appearance === 'notte';
  const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
  return {
    appearance,
    dark,
    colors,
    radius,
    // Con un font personalizzato il peso è già nella famiglia: fontWeight lo falserebbe su Android.
    text: (size, weight = '400') => ({ fontSize: size, fontFamily: FONT[weight] }),
    weight: (weight) => ({ fontFamily: FONT[weight] }),
    elevation: dark
      ? { borderWidth: 1, borderColor: colors.border }
      : {
          shadowColor: colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        },
    button: { radius: radius.md, label: {} },
    svgFont: FONT['400'],
  };
}
