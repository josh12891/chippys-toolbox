import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  readUnlockedFlag,
  restoreUnlockFlag,
  writeUnlockedFlag,
} from "@/lib/unlock";

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
  unlockOnThisDevice: () => void;
  restoreOnThisDevice: () => { unlocked: boolean; message: string };
};

const UnlockContext = createContext<UnlockContextValue | null>(null);

export function UnlockProvider({ children }: { children: ReactNode }) {
  const unlocked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const unlockOnThisDevice = useCallback(() => {
    writeUnlockedFlag(true);
    emit();
  }, []);

  const restoreOnThisDevice = useCallback(() => {
    const result = restoreUnlockFlag();
    emit();
    return result;
  }, []);

  const value = useMemo(
    () => ({ unlocked, unlockOnThisDevice, restoreOnThisDevice }),
    [restoreOnThisDevice, unlockOnThisDevice, unlocked],
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
