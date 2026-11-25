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

import { getProduct, type Product } from '@/data/products';
import { prunePuffs, type Puff } from '@/lib/nicotine';

const STORAGE_KEY = 'trackmynicotine/state/v1';

type PersistedState = {
  puffs: Puff[];
  selectedProductId: string | null;
  /** Limite giornaliero in mg. null = non ancora scelto (onboarding). */
  dailyLimitMg: number | null;
};

const INITIAL_STATE: PersistedState = {
  puffs: [],
  selectedProductId: null,
  dailyLimitMg: null,
};

type NicotineStore = PersistedState & {
  loaded: boolean;
  /** Orario corrente, aggiornato ogni 30s: guida il reset di mezzanotte e il grafico. */
  now: number;
  selectedProduct: Product;
  addPuff: () => void;
  undoLastPuff: () => void;
  selectProduct: (id: string) => void;
  setDailyLimit: (mg: number) => void;
  resetAll: () => void;
};

const NicotineContext = createContext<NicotineStore | null>(null);

export function NicotineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          setState({ ...INITIAL_STATE, ...parsed, puffs: prunePuffs(parsed.puffs ?? [], Date.now()) });
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

  const selectedProduct = getProduct(state.selectedProductId);

  const addPuff = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((s) => {
      const product = getProduct(s.selectedProductId);
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

  const setDailyLimit = useCallback((mg: number) => {
    setState((s) => ({ ...s, dailyLimitMg: mg }));
  }, []);

  const resetAll = useCallback(() => setState(INITIAL_STATE), []);

  const value = useMemo<NicotineStore>(
    () => ({
      ...state,
      loaded,
      now,
      selectedProduct,
      addPuff,
      undoLastPuff,
      selectProduct,
      setDailyLimit,
      resetAll,
    }),
    [state, loaded, now, selectedProduct, addPuff, undoLastPuff, selectProduct, setDailyLimit, resetAll],
  );

  return <NicotineContext.Provider value={value}>{children}</NicotineContext.Provider>;
}

export function useNicotine(): NicotineStore {
  const ctx = useContext(NicotineContext);
  if (!ctx) throw new Error('useNicotine deve essere usato dentro <NicotineProvider>');
  return ctx;
}
