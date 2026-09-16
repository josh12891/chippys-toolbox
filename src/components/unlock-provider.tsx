import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  billingFootnote,
  createUnlockBilling,
  listenForUnlockTransactions,
  type BillingActionResult,
  type BillingKind,
} from "@/lib/billing";
import { readUnlockedFlag, UNLOCK_PRICE_LABEL } from "@/lib/unlock";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return readUnlockedFlag();
}

function getServerSnapshot() {
  return false;
}

type UnlockContextValue = {
  unlocked: boolean;
  kind: BillingKind;
  priceLabel: string;
  busy: boolean;
  footnote: string;
  purchaseUnlock: () => Promise<BillingActionResult>;
  restorePurchases: () => Promise<BillingActionResult>;
};

const UnlockContext = createContext<UnlockContextValue | null>(null);

export function UnlockProvider({ children }: { children: ReactNode }) {
  const billing = useMemo(() => createUnlockBilling(), []);
  const unlocked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [kind, setKind] = useState<BillingKind>("stub");
  const [priceLabel, setPriceLabel] = useState(UNLOCK_PRICE_LABEL);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stopListening: (() => void) | undefined;
    void (async () => {
      const nextKind = await billing.resolveKind();
      const nextPrice = await billing.getPriceLabel();
      await billing.refreshFromStore();
      stopListening = await listenForUnlockTransactions(() => emit());
      if (cancelled) {
        stopListening();
        return;
      }
      setKind(nextKind);
      setPriceLabel(nextPrice);
      emit();
    })();
    return () => {
      cancelled = true;
      stopListening?.();
    };
  }, [billing]);

  const purchaseUnlock = useCallback(async () => {
    setBusy(true);
    try {
      const result = await billing.purchase();
      emit();
      return result;
    } finally {
      setBusy(false);
    }
  }, [billing]);

  const restorePurchases = useCallback(async () => {
    setBusy(true);
    try {
      const result = await billing.restore();
      emit();
      return result;
    } finally {
      setBusy(false);
    }
  }, [billing]);

  const footnote = billingFootnote(kind, billing.platformName);

  const value = useMemo(
    () => ({
      unlocked,
      kind,
      priceLabel,
      busy,
      footnote,
      purchaseUnlock,
      restorePurchases,
    }),
    [busy, footnote, kind, priceLabel, purchaseUnlock, restorePurchases, unlocked],
  );

  return <UnlockContext.Provider value={value}>{children}</UnlockContext.Provider>;
}

export function useUnlock() {
  const ctx = useContext(UnlockContext);
  if (!ctx) {
    throw new Error("useUnlock must be used within UnlockProvider");
  }
  return ctx;
}
