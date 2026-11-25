import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { CATALOG, DEFAULT_ENABLED_IDS, type Product } from '@/data/products';
import { prunePuffs, type Puff } from '@/lib/nicotine';

const STORAGE_KEY = 'trackmynicotine/state/v1';

type PersistedState = {
  puffs: Puff[];
  selectedProductId: string | null;
  /** Limite giornaliero in mg. null = non ancora scelto (onboarding). */
  dailyLimitMg: number | null;
  /** Prodotti creati dall'utente. */
  customProducts: Product[];
  /** Prodotti con la spunta: sono quelli che compaiono nella tendina della Home. */
  enabledProductIds: string[];
};

const INITIAL_STATE: PersistedState = {
  puffs: [],
  selectedProductId: null,
  dailyLimitMg: null,
  customProducts: [],
  enabledProductIds: DEFAULT_ENABLED_IDS,
};

export type ProductInput = Pick<Product, 'name' | 'detail' | 'mgPerPuff' | 'category'>;

type NicotineStore = PersistedState & {
  loaded: boolean;
  /** Orario corrente, aggiornato ogni 30s: guida il reset di mezzanotte e il grafico. */
  now: number;
  /** Catalogo + prodotti dell'utente. */
  products: Product[];
  /** I predefiniti, nell'ordine scelto dall'utente. */
  enabledProducts: Product[];
  selectedProduct: Product;
  addPuff: () => void;
  undoLastPuff: () => void;
  selectProduct: (id: string) => void;
  addProduct: (input: ProductInput) => void;
  updateProduct: (id: string, input: ProductInput) => void;
  deleteProduct: (id: string) => void;
  /** Mette o toglie la spunta. Restituisce false se era l'ultimo prodotto attivo. */
  toggleEnabled: (id: string) => boolean;
  /** Sposta un predefinito di una posizione (-1 su, +1 giù). */
  moveEnabled: (id: string, delta: -1 | 1) => void;
  setDailyLimit: (mg: number) => void;
  resetAll: () => void;
};

const NicotineContext = createContext<NicotineStore | null>(null);

function allProducts(s: PersistedState): Product[] {
  return [...s.customProducts, ...CATALOG];
}

/** I predefiniti, nell'ordine scelto dall'utente (lo stesso della tendina della Home). */
function enabledOf(s: PersistedState): Product[] {
  const byId = new Map(allProducts(s).map((p) => [p.id, p]));
  const list = s.enabledProductIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => p !== undefined);
  return list.length > 0 ? list : [CATALOG[0]];
}

/** Il prodotto in uso deve avere la spunta; altrimenti si ripiega sul primo attivo. */
function findProduct(s: PersistedState, id: string | null): Product {
  const list = enabledOf(s);
  return list.find((p) => p.id === id) ?? list[0];
}

export function NicotineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          setState({
            ...INITIAL_STATE,
            ...parsed,
            // Prodotti creati prima che esistessero le categorie.
            customProducts: (parsed.customProducts ?? []).map((p) => ({
              ...p,
              category: p.category ?? 'liquidi',
            })),
            enabledProductIds: parsed.enabledProductIds ?? DEFAULT_ENABLED_IDS,
            puffs: prunePuffs(parsed.puffs ?? [], Date.now()),
          });
        }
      })
      .catch(() => {
        // Dati corrotti o storage non disponibile: si riparte da zero.
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const products = useMemo(() => allProducts(state), [state]);
  const enabledProducts = useMemo(() => enabledOf(state), [state]);
  const selectedProduct = findProduct(state, state.selectedProductId);

  const addPuff = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((s) => {
      const product = findProduct(s, s.selectedProductId);
      // I mg vengono salvati nel tiro: modificare o eliminare il prodotto non altera lo storico.
      return { ...s, puffs: [...s.puffs, { t, productId: product.id, mg: product.mgPerPuff }] };
    });
  }, []);

  const undoLastPuff = useCallback(() => {
    setNow(Date.now());
    setState((s) => ({ ...s, puffs: s.puffs.slice(0, -1) }));
  }, []);

  const selectProduct = useCallback((id: string) => {
    setState((s) => ({ ...s, selectedProductId: id }));
  }, []);

  const addProduct = useCallback((input: ProductInput) => {
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setState((s) => ({
      ...s,
      // Fissa la selezione attuale: altrimenti il nuovo prodotto (in cima alla lista) la cambierebbe.
      selectedProductId: findProduct(s, s.selectedProductId).id,
      customProducts: [...s.customProducts, { ...input, id, custom: true }],
      enabledProductIds: [...s.enabledProductIds, id],
    }));
  }, []);

  const updateProduct = useCallback((id: string, input: ProductInput) => {
    setState((s) => ({
      ...s,
      customProducts: s.customProducts.map((p) => (p.id === id ? { ...p, ...input } : p)),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      customProducts: s.customProducts.filter((p) => p.id !== id),
      enabledProductIds: s.enabledProductIds.filter((e) => e !== id),
      selectedProductId: s.selectedProductId === id ? null : s.selectedProductId,
    }));
  }, []);

  const toggleEnabled = useCallback(
    (id: string) => {
      const isEnabled = state.enabledProductIds.includes(id);
      if (isEnabled && enabledOf(state).length <= 1) return false;
      setState((s) => ({
        ...s,
        selectedProductId: findProduct(s, s.selectedProductId).id,
        enabledProductIds: s.enabledProductIds.includes(id)
          ? s.enabledProductIds.filter((e) => e !== id)
          : [...s.enabledProductIds, id],
      }));
      return true;
    },
    [state],
  );

  const moveEnabled = useCallback((id: string, delta: -1 | 1) => {
    setState((s) => {
      // Si lavora sulla lista visibile, così gli id di prodotti non più esistenti non contano.
      const order = enabledOf(s).map((p) => p.id);
      const from = order.indexOf(id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= order.length) return s;
      [order[from], order[to]] = [order[to], order[from]];
      return { ...s, enabledProductIds: order };
    });
  }, []);

  const setDailyLimit = useCallback((mg: number) => {
    setState((s) => ({ ...s, dailyLimitMg: mg }));
  }, []);

  const resetAll = useCallback(() => setState(INITIAL_STATE), []);

  const value = useMemo<NicotineStore>(
    () => ({
      ...state,
      loaded,
      now,
      products,
      enabledProducts,
      selectedProduct,
      addPuff,
      undoLastPuff,
      selectProduct,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleEnabled,
      moveEnabled,
      setDailyLimit,
      resetAll,
    }),
    [
      state,
      loaded,
      now,
      products,
      enabledProducts,
      selectedProduct,
      addPuff,
      undoLastPuff,
      selectProduct,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleEnabled,
      moveEnabled,
      setDailyLimit,
      resetAll,
    ],
  );

  return <NicotineContext.Provider value={value}>{children}</NicotineContext.Provider>;
}

export function useNicotine(): NicotineStore {
  const ctx = useContext(NicotineContext);
  if (!ctx) throw new Error('useNicotine deve essere usato dentro <NicotineProvider>');
  return ctx;
}
