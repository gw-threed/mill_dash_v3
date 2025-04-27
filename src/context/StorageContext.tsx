import React, { createContext, useContext, type ReactNode } from 'react';
import { StorageSlot } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSeedData } from '../data/seed';

interface StorageContextValue {
  storageSlots: StorageSlot[];
  setStorageSlots: (slots: StorageSlot[]) => void;
  occupySlot: (fullLocation: string, puckId: string) => void;
  clearSlot: (fullLocation: string) => void;
  findFirstAvailableSlot: () => StorageSlot | undefined;
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const seed = generateSeedData();
  const [storageSlots, setStorageSlots] = useLocalStorage<StorageSlot[]>(
    'storageSlots',
    seed.storageSlots,
  );

  const occupySlot = (fullLocation: string, puckId: string) =>
    setStorageSlots((prev) =>
      prev.map((s) => (s.fullLocation === fullLocation ? { ...s, occupied: true, puckId } : s)),
    );

  const clearSlot = (fullLocation: string) =>
    setStorageSlots((prev) =>
      prev.map((s) =>
        s.fullLocation === fullLocation ? { ...s, occupied: false, puckId: null } : s,
      ),
    );

  const findFirstAvailableSlot = () => storageSlots.find((s) => !s.occupied);

  const value: StorageContextValue = {
    storageSlots,
    setStorageSlots,
    occupySlot,
    clearSlot,
    findFirstAvailableSlot,
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

export const useStorageContext = () => {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorageContext must be used within StorageProvider');
  return ctx;
}; 