import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Tre stili visivi selezionabili dalle Impostazioni developer.
 * Ogni componente prende colori, ombre, raggi e font da qui (mai valori fissi),
 * così cambiare stile cambia tutta l'app.
 */

export type StyleId = 1 | 2 | 3;
export type TextId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ButtonId = 1 | 2 | 3;
export type CardId = 1 | 2 | 3;

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
  4: {
    id: 4,
    name: 'Poppins',
    description: 'Poppins: geometrico e deciso, molto usato nelle app moderne.',
    scale: 0.96,
    families: {
      '400': 'Poppins_400Regular',
      '500': 'Poppins_500Medium',
      '600': 'Poppins_600SemiBold',
      '700': 'Poppins_700Bold',
      '800': 'Poppins_800ExtraBold',
    },
  },
  5: {
    id: 5,
    name: 'Manrope',
    description: 'Manrope: pulito e professionale, ottimo per i numeri grandi.',
    scale: 1,
    families: {
      '400': 'Manrope_400Regular',
      '500': 'Manrope_500Medium',
      '600': 'Manrope_600SemiBold',
      '700': 'Manrope_700Bold',
      '800': 'Manrope_800ExtraBold',
    },
  },
  6: {
    id: 6,
    name: 'DM Sans',
    description: 'DM Sans: compatto e leggibile, dall’aspetto morbido.',
    scale: 1,
    families: {
      '400': 'DMSans_400Regular',
      '500': 'DMSans_500Medium',
      '600': 'DMSans_600SemiBold',
      '700': 'DMSans_700Bold',
      '800': 'DMSans_800ExtraBold',
    },
  },
  7: {
    id: 7,
    name: 'Outfit',
    description: 'Outfit: tondeggiante e contemporaneo, titoli d’impatto.',
    scale: 1.02,
    families: {
      '400': 'Outfit_400Regular',
      '500': 'Outfit_500Medium',
      '600': 'Outfit_600SemiBold',
      '700': 'Outfit_700Bold',
      '800': 'Outfit_800ExtraBold',
    },
  },
};

export type OptionMeta = { name: string; description: string };

/**
 * Gruppi delle Impostazioni developer. L'ordine qui è l'ordine in cui compaiono.
 * Ogni gruppo ha le sue varianti numerate da 1.
 */
export const DEV_GROUPS = {
  style: {
    label: 'Colori',
    options: [
      { name: 'Classico', description: STYLES[1].description },
      { name: 'Notte', description: STYLES[2].description },
      { name: 'Natura', description: STYLES[3].description },
    ],
  },
  text: {
    label: 'Testi',
    options: Object.values(TEXTS).map((d) => ({ name: d.name, description: d.description })),
  },
  home: {
    label: 'Layout Home',
    options: [
      { name: 'Card', description: 'Selettore in alto, contatore e grafico in due card separate.' },
      { name: 'Hero', description: 'Fascia colorata in alto con data e prodotto, contatore in primo piano.' },
      { name: 'Dashboard', description: 'Tre riquadri con i numeri chiave sopra il contatore.' },
      { name: 'Fluttuante', description: 'Il contatore galleggia sullo sfondo, senza card: più aria e meno riquadri.' },
      { name: 'Focus', description: 'Il contatore al centro e grande; numeri e grafico ridotti all’essenziale.' },
    ],
  },
  counter: {
    label: 'Contatore',
    options: [
      { name: 'Anello', description: 'Pulsante rotondo con anello che si riempie verso il limite.' },
      { name: 'Barra', description: 'Grande pulsante “+1 tiro” con barra di avanzamento sotto.' },
      { name: 'Riempimento', description: 'Cerchio che si riempie come un bicchiere man mano che fumi.' },
      { name: 'Glow', description: 'Pulsante pieno e luminoso con un anello sottile intorno.' },
      { name: 'Sottile', description: 'Solo un anello fine e numeri grandi, niente sfondo.' },
    ],
  },
  chart: {
    label: 'Grafico',
    options: [
      { name: 'Area', description: 'Nicotina nel corpo nelle ultime 24 ore, con area colorata.' },
      { name: 'Barre', description: 'Nicotina assunta ora per ora nelle ultime 24 ore.' },
      { name: 'Linea', description: 'Linea essenziale con il punto attuale evidenziato.' },
    ],
  },
  picker: {
    label: 'Selettore prodotto',
    options: [
      { name: 'Pannello', description: 'Un pannello che sale dal basso, comodo col pollice.' },
      { name: 'Tendina', description: 'Menu a tendina a tutta larghezza.' },
      { name: 'Chip', description: 'I predefiniti in una fila scorrevole: un tocco per cambiare.' },
    ],
  },
  button: {
    label: 'Bottoni',
    options: [
      { name: 'Arrotondati', description: 'Angoli morbidi, testo normale.' },
      { name: 'Pillola', description: 'Completamente tondi ai lati.' },
      { name: 'Squadrati', description: 'Angoli stretti e testo in maiuscolo.' },
    ],
  },
  card: {
    label: 'Card',
    options: [
      { name: 'Ombra', description: 'Card sollevate con un’ombra morbida.' },
      { name: 'Bordo', description: 'Card piatte con un bordo sottile.' },
      { name: 'Piatte', description: 'Nessun bordo né ombra: solo il colore della superficie.' },
    ],
  },
  nav: {
    label: 'Barra di navigazione',
    options: [
      { name: 'Classica', description: 'Icona e nome per ogni sezione.' },
      { name: 'Fluttuante', description: 'Pillola sospesa: la sezione attiva si allarga e mostra il nome.' },
      { name: 'Minimal', description: 'Solo icone, un puntino indica la sezione attiva.' },
      { name: 'Con +1', description: 'Pulsante centrale per registrare un tiro da qualsiasi schermata.' },
    ],
  },
  products: {
    label: 'Organizzazione prodotti',
    options: [
      { name: 'Per tipo', description: 'Un unico elenco diviso per tipo di prodotto.' },
      { name: 'Filtri', description: 'Chip in alto per vedere un tipo alla volta.' },
      { name: 'Per punteggio', description: 'Prodotti raggruppati per lettera, dalla A alla E.' },
    ],
  },
} satisfies Record<string, { label: string; options: OptionMeta[] }>;

export type DevGroupKey = keyof typeof DEV_GROUPS;

/** Combinazioni già pronte, scelte guardando l'app: un tocco le applica tutte. */
export const PRESETS: { name: string; description: string; dev: Record<DevGroupKey, number> }[] = [
  {
    name: 'Aria',
    description: 'Chiaro e arioso: pulsante luminoso senza card, DM Sans, barra fluttuante.',
    dev: { style: 1, text: 6, home: 4, counter: 4, chart: 3, picker: 1, button: 2, card: 3, nav: 2, products: 1 },
  },
  {
    name: 'Notte',
    description: 'Scuro e minimale: anello sottile al centro, Manrope, solo icone.',
    dev: { style: 2, text: 5, home: 5, counter: 5, chart: 2, picker: 1, button: 2, card: 3, nav: 3, products: 1 },
  },
  {
    name: 'Natura',
    description: 'Verde e morbido: Outfit, pulsante “+1” sempre a portata nella barra.',
    dev: { style: 3, text: 7, home: 4, counter: 4, chart: 1, picker: 1, button: 2, card: 1, nav: 4, products: 1 },
  },
  {
    name: 'Energia',
    description: 'Fascia blu in alto, anello sottile, Poppins e grafico a barre.',
    dev: { style: 1, text: 4, home: 2, counter: 5, chart: 2, picker: 1, button: 2, card: 1, nav: 2, products: 1 },
  },
];

export type Theme = StyleDefinition & {
  textDef: TextDefinition;
  /** Stile di testo completo: dimensione scalata, peso e famiglia del font scelto. */
  text: (size: number, weight?: Weight) => TextStyle;
  /** Solo il peso (o la famiglia equivalente), per testi annidati che ereditano la dimensione. */
  weight: (weight: Weight) => TextStyle;
  /** Aspetto delle card secondo la variante scelta (ombra, bordo o piatte). */
  elevation: ViewStyle;
  /** Forma dei bottoni: raggio e testo. */
  button: { radius: number; label: TextStyle };
  /** Font per i testi dentro gli SVG (assi del grafico). */
  svgFont: string | undefined;
};

export function buildTheme(styleId: StyleId, textId: TextId, buttonId: ButtonId = 1, cardId: CardId = 1): Theme {
  const style = STYLES[styleId];
  const textDef = TEXTS[textId];
  const border = { borderWidth: 1, borderColor: style.colors.border };
  const elevation: ViewStyle =
    cardId === 1 ? (style.shadow ?? border) : cardId === 2 ? border : { borderWidth: 0 };
  const button =
    buttonId === 2
      ? { radius: 999, label: {} }
      : buttonId === 3
        ? { radius: 6, label: { textTransform: 'uppercase' as const, letterSpacing: 0.8 } }
        : { radius: style.radius.md, label: {} };
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
    elevation,
    button,
    svgFont:
      textDef.families?.['400'] ??
      (Platform.OS === 'web' ? 'system-ui, -apple-system, Roboto, sans-serif' : undefined),
  };
}
