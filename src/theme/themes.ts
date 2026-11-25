import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Tre stili visivi selezionabili dalle Impostazioni developer.
 * Ogni componente prende colori, ombre, raggi e font da qui (mai valori fissi),
 * così cambiare stile cambia tutta l'app.
 */

export type StyleId = 1 | 2 | 3;
export type TextId = 1 | 2 | 3;
export type NavId = 1 | 2 | 3;
export type ProductsLayoutId = 1 | 2 | 3;

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
  /** Bordo dei controlli non attivi (caselle, interruttori): più marcato di `border`. */
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

export type StyleDefinition = {
  id: StyleId;
  name: string;
  description: string;
  dark: boolean;
  colors: Palette;
  radius: { sm: number; md: number; lg: number; pill: number };
  /** Ombra delle card; null = card piatte con bordo. */
  shadow: ViewStyle | null;
};

const PILL = 999;

export const STYLES: Record<StyleId, StyleDefinition> = {
  1: {
    id: 1,
    name: 'Classico',
    description: 'Blu brillante su grigio chiaro, card bianche con ombre morbide.',
    dark: false,
    colors: {
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
    radius: { sm: 10, md: 16, lg: 24, pill: PILL },
    shadow: {
      shadowColor: '#2A3A6B',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  },
  2: {
    id: 2,
    name: 'Notte',
    description: 'Tema scuro blu notte con accento menta: riposante la sera.',
    dark: true,
    colors: {
      background: '#0E1320',
      card: '#171E2E',
      surface: '#1F2738',
      text: '#ECF1FA',
      textMuted: '#8D98B0',
      border: '#263045',
      control: '#4C5873',
      primary: '#3DDBB4',
      primaryDark: '#5EE6C4',
      primarySoft: '#173A3A',
      onPrimary: '#06261F',
      danger: '#FF6B6E',
      dangerSoft: '#3A1E25',
      ringTrack: '#232C40',
      backdrop: 'rgba(0, 0, 0, 0.6)',
      shadow: '#000000',
    },
    radius: { sm: 12, md: 18, lg: 26, pill: PILL },
    shadow: null,
  },
  3: {
    id: 3,
    name: 'Natura',
    description: 'Verde salvia e bianco caldo: calmo e meno “clinico”.',
    dark: false,
    colors: {
      background: '#EEF3EF',
      card: '#FFFFFF',
      surface: '#EDF2EE',
      text: '#17302A',
      textMuted: '#6E8580',
      border: '#DCE6E0',
      control: '#BCCEC4',
      primary: '#2F8F6B',
      primaryDark: '#1F6E51',
      primarySoft: '#DDF0E6',
      onPrimary: '#FFFFFF',
      danger: '#D9534F',
      dangerSoft: '#FBE9E7',
      ringTrack: '#DCE8E1',
      backdrop: 'rgba(23, 48, 42, 0.45)',
      shadow: '#1D3B33',
    },
    radius: { sm: 14, md: 20, lg: 30, pill: PILL },
    shadow: {
      shadowColor: '#1D3B33',
      shadowOpacity: 0.07,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
  },
};

type Weight = '400' | '500' | '600' | '700' | '800';

export type TextDefinition = {
  id: TextId;
  name: string;
  description: string;
  /** Moltiplicatore delle dimensioni del testo. */
  scale: number;
  /** null = font di sistema. */
  families: Record<Weight, string> | null;
};

export const TEXTS: Record<TextId, TextDefinition> = {
  1: {
    id: 1,
    name: 'Sistema',
    description: 'Il carattere del telefono: familiare e neutro.',
    scale: 1,
    families: null,
  },
  2: {
    id: 2,
    name: 'Arrotondato',
    description: 'Nunito: forme morbide e amichevoli, un po’ più grande.',
    scale: 1.04,
    families: {
      '400': 'Nunito_400Regular',
      '500': 'Nunito_600SemiBold',
      '600': 'Nunito_700Bold',
      '700': 'Nunito_800ExtraBold',
      '800': 'Nunito_900Black',
    },
  },
  3: {
    id: 3,
    name: 'Moderno',
    description: 'Space Grotesk: geometrico, numeri molto leggibili.',
    scale: 0.98,
    families: {
      '400': 'SpaceGrotesk_400Regular',
      '500': 'SpaceGrotesk_500Medium',
      '600': 'SpaceGrotesk_600SemiBold',
      '700': 'SpaceGrotesk_700Bold',
      '800': 'SpaceGrotesk_700Bold',
    },
  },
};

export const NAVS: Record<NavId, { name: string; description: string }> = {
  1: { name: 'Classica', description: 'Barra in basso con icona e nome per ogni sezione.' },
  2: { name: 'Fluttuante', description: 'Pillola sospesa: la sezione attiva si allarga e mostra il nome.' },
  3: { name: 'Minimal', description: 'Solo icone, un puntino indica la sezione attiva.' },
};

export const PRODUCT_LAYOUTS: Record<ProductsLayoutId, { name: string; description: string }> = {
  1: { name: 'Per tipo', description: 'Un unico elenco diviso per tipo di prodotto.' },
  2: { name: 'Filtri', description: 'Chip in alto per vedere un tipo alla volta.' },
  3: { name: 'Per punteggio', description: 'Prodotti raggruppati per lettera, dalla A alla E.' },
};

export type Theme = StyleDefinition & {
  textDef: TextDefinition;
  /** Stile di testo completo: dimensione scalata, peso e famiglia del font scelto. */
  text: (size: number, weight?: Weight) => TextStyle;
  /** Solo il peso (o la famiglia equivalente), per testi annidati che ereditano la dimensione. */
  weight: (weight: Weight) => TextStyle;
  /** Ombra delle card, o bordo sottile se lo stile è piatto. */
  elevation: ViewStyle;
  /** Font per i testi dentro gli SVG (assi del grafico). */
  svgFont: string | undefined;
};

export function buildTheme(styleId: StyleId, textId: TextId): Theme {
  const style = STYLES[styleId];
  const textDef = TEXTS[textId];
  return {
    ...style,
    textDef,
    text: (size, weight = '400') =>
      textDef.families
        ? // Con un font personalizzato il peso è già nella famiglia: fontWeight lo falserebbe su Android.
          { fontSize: Math.round(size * textDef.scale * 10) / 10, fontFamily: textDef.families[weight] }
        : { fontSize: Math.round(size * textDef.scale * 10) / 10, fontWeight: weight },
    weight: (weight) =>
      textDef.families ? { fontFamily: textDef.families[weight] } : { fontWeight: weight },
    elevation: style.shadow ?? { borderWidth: 1, borderColor: style.colors.border },
    svgFont:
      textDef.families?.['400'] ??
      (Platform.OS === 'web' ? 'system-ui, -apple-system, Roboto, sans-serif' : undefined),
  };
}
