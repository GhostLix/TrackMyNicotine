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

import { DEFAULT_PRODUCTS, type Product } from '@/data/products';
import { prunePuffs, type Puff } from '@/lib/nicotine';

const STORAGE_KEY = 'trackmynicotine/state/v1';

type PersistedState = {
  puffs: Puff[];
  selectedProductId: string | null;
  /** Limite giornaliero in mg. null = non ancora scelto (onboarding). */
  dailyLimitMg: number | null;
  /** Prodotti creati dall'utente. */
  customProducts: Product[];
};

const INITIAL_STATE: PersistedState = {
  puffs: [],
  selectedProductId: null,
  dailyLimitMg: null,
  customProducts: [],
};

export type ProductInput = Pick<Product, 'name' | 'detail' | 'mgPerPuff'>;

type NicotineStore = PersistedState & {
  loaded: boolean;
  /** Orario corrente, aggiornato ogni 30s: guida il reset di mezzanotte e il grafico. */
  now: number;
  /** Prodotti predefiniti + quelli dell'utente. */
  products: Product[];
  selectedProduct: Product;
  addPuff: () => void;
  undoLastPuff: () => void;
  selectProduct: (id: string) => void;
  addProduct: (input: ProductInput) => void;
  updateProduct: (id: string, input: ProductInput) => void;
  deleteProduct: (id: string) => void;
  setDailyLimit: (mg: number) => void;
  resetAll: () => void;
};

const NicotineContext = createContext<NicotineStore | null>(null);

function allProducts(s: PersistedState): Product[] {
  return [...DEFAULT_PRODUCTS, ...s.customProducts];
}

function findProduct(s: PersistedState, id: string | null): Product {
  const list = allProducts(s);
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
            customProducts: parsed.customProducts ?? [],
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
      customProducts: [...s.customProducts, { ...input, id, custom: true }],
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
      selectedProductId: s.selectedProductId === id ? null : s.selectedProductId,
    }));
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
      selectedProduct,
      addPuff,
      undoLastPuff,
      selectProduct,
      addProduct,
      updateProduct,
      deleteProduct,
      setDailyLimit,
      resetAll,
    }),
    [
      state,
      loaded,
      now,
      products,
      selectedProduct,
      addPuff,
      undoLastPuff,
      selectProduct,
      addProduct,
      updateProduct,
      deleteProduct,
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
