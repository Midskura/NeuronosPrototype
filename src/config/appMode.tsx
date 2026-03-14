// App Mode Context — Essentials vs Full Suite toggle
// Stored in localStorage, accessible everywhere via useAppMode()

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type AppMode = "essentials" | "full";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isEssentials: boolean;
  isFull: boolean;
}

const STORAGE_KEY = "neuron_app_mode";
const DEFAULT_MODE: AppMode = "essentials";

const AppModeContext = createContext<AppModeContextType>({
  mode: DEFAULT_MODE,
  setMode: () => {},
  isEssentials: true,
  isFull: false,
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "essentials" || saved === "full") return saved;
    }
    return DEFAULT_MODE;
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode,
        isEssentials: mode === "essentials",
        isFull: mode === "full",
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
