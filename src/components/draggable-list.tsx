import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  type GestureResponderHandlers,
} from 'react-native';

import { Colors } from '@/constants/theme';

type RenderInfo = {
  index: number;
  isDragging: boolean;
  /** Da spargere sulla maniglia: è l'unico punto che avvia il trascinamento. */
  dragHandleProps: GestureResponderHandlers & { style?: object };
};

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string;
  /** Altezza fissa di ogni riga: serve a calcolare dove cade la riga trascinata. */
  rowHeight: number;
  renderRow: (item: T, info: RenderInfo) => ReactNode;
  onReorder: (from: number, to: number) => void;
  /** Avvisa quando inizia/finisce un trascinamento (per bloccare lo scroll della pagina). */
  onDragActiveChange?: (active: boolean) => void;
};

// Su web il browser proverebbe a scorrere la pagina invece di passare il gesto.
const webNoTouchScroll = Platform.OS === 'web' ? ({ touchAction: 'none', cursor: 'grab' } as object) : undefined;

/**
 * Lista riordinabile trascinando una maniglia. Usa solo PanResponder e Animated
 * di React Native: nessuna libreria nativa, funziona uguale su Android, iOS e web.
 */
export function DraggableList<T>({
  items,
  keyOf,
  rowHeight,
  renderRow,
  onReorder,
  onDragActiveChange,
}: Props<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const dy = useRef(new Animated.Value(0)).current;

  // I callback del PanResponder vengono creati una volta sola: leggono i valori aggiornati da qui.
  const live = useRef({ from: -1, hover: -1, count: items.length, onReorder, onDragActiveChange });
  live.current.count = items.length;
  live.current.onReorder = onReorder;
  live.current.onDragActiveChange = onDragActiveChange;

  const responders = useMemo(
    () =>
      items.map((_, index) =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          // Una volta preso il gesto, lo ScrollView non può rubarlo.
          onPanResponderTerminationRequest: () => false,
          onShouldBlockNativeResponder: () => true,
          onPanResponderGrant: () => {
            live.current.from = index;
            live.current.hover = index;
            dy.setValue(0);
            setDragIndex(index);
            setHoverIndex(index);
            live.current.onDragActiveChange?.(true);
          },
          onPanResponderMove: (_e, g) => {
            const { from, count } = live.current;
            // La riga trascinata non può uscire dalla lista.
            const minDy = -from * rowHeight;
            const maxDy = (count - 1 - from) * rowHeight;
            const clamped = Math.max(minDy, Math.min(maxDy, g.dy));
            dy.setValue(clamped);
            const hover = Math.max(0, Math.min(count - 1, from + Math.round(clamped / rowHeight)));
            if (hover !== live.current.hover) {
              live.current.hover = hover;
              setHoverIndex(hover);
            }
          },
          onPanResponderRelease: () => finish(true),
          onPanResponderTerminate: () => finish(false),
        }),
      ),
    // Ricreati solo quando cambia il numero di righe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, rowHeight],
  );

  function finish(commit: boolean) {
    const { from, hover } = live.current;
    if (commit && from >= 0 && hover >= 0 && from !== hover) live.current.onReorder(from, hover);
    live.current.from = -1;
    live.current.hover = -1;
    dy.setValue(0);
    setDragIndex(null);
    setHoverIndex(null);
    live.current.onDragActiveChange?.(false);
  }

  /** Spostamento delle righe NON trascinate per fare spazio a quella trascinata. */
  const shiftFor = (index: number): number => {
    if (dragIndex === null || hoverIndex === null || index === dragIndex) return 0;
    if (dragIndex < hoverIndex && index > dragIndex && index <= hoverIndex) return -rowHeight;
    if (dragIndex > hoverIndex && index < dragIndex && index >= hoverIndex) return rowHeight;
    return 0;
  };

  return (
    <View>
      {items.map((item, index) => {
        const isDragging = index === dragIndex;
        return (
          <Animated.View
            key={keyOf(item)}
            style={[
              { height: rowHeight },
              isDragging
                ? [styles.dragging, { transform: [{ translateY: dy }] }]
                : { transform: [{ translateY: shiftFor(index) }] },
            ]}>
            {renderRow(item, {
              index,
              isDragging,
              dragHandleProps: { ...responders[index]?.panHandlers, style: webNoTouchScroll },
            })}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dragging: {
    zIndex: 10,
    elevation: 10,
    backgroundColor: Colors.card,
    shadowColor: '#2A3A6B',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    borderRadius: 14,
  },
});
