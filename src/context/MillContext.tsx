import React, { createContext, useContext, type ReactNode } from 'react';
import { Mill } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSeedData } from '../data/seed';

interface MillContextValue {
  mills: Mill[];
  setMills: (mills: Mill[]) => void;
  occupyMillSlot: (millName: string, slotName: string, puckId: string) => void;
  clearMillSlot: (millName: string, slotName: string) => void;
}

const MillContext = createContext<MillContextValue | undefined>(undefined);

export const MillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const seed = generateSeedData();
  const [mills, setMills] = useLocalStorage<Mill[]>('mills', seed.mills);

  const occupyMillSlot = (millName: string, slotName: string, puckId: string) =>
    setMills(
      mills.map((m) =>
        m.id === millName
          ? {
              ...m,
              slots: m.slots.map((s) =>
                s.slotName === slotName ? { ...s, occupied: true, puckId } : s,
              ),
            }
          : m,
      ),
    );

  const clearMillSlot = (millName: string, slotName: string) =>
    setMills(
      mills.map((m) =>
        m.id === millName
          ? {
              ...m,
              slots: m.slots.map((s) =>
                s.slotName === slotName ? { ...s, occupied: false, puckId: null } : s,
              ),
            }
          : m,
      ),
    );

  const value: MillContextValue = { mills, setMills, occupyMillSlot, clearMillSlot };

  return <MillContext.Provider value={value}>{children}</MillContext.Provider>;
};

export const useMillContext = () => {
  const ctx = useContext(MillContext);
  if (!ctx) throw new Error('useMillContext must be used within MillProvider');
  return ctx;
}; 