import React, { createContext, useContext, type ReactNode } from 'react';
import { Puck } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSeedData } from '../data/seed';

interface PuckContextValue {
  pucks: Puck[];
  setPucks: (pucks: Puck[]) => void;
  movePuck: (puckId: string, newLocation: string) => void;
  updatePuckScreenshot: (puckId: string, screenshotUrl: string) => void;
  retirePuck: (puckId: string) => void;
  updatePuckStatus: (puckId: string, status: 'in_storage' | 'in_mill' | 'retired') => void;
  resetPucks: () => void;
}

const PuckContext = createContext<PuckContextValue | undefined>(undefined);

export const PuckProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const seed = generateSeedData();
  const [pucks, setPucks] = useLocalStorage<Puck[]>('pucks', seed.pucks);

  const movePuck = (puckId: string, newLocation: string) =>
    setPucks(
      pucks.map((p) => (p.puckId === puckId ? { ...p, currentLocation: newLocation } : p)),
    );

  const updatePuckScreenshot = (puckId: string, screenshotUrl: string) =>
    setPucks(
      pucks.map((p) => (p.puckId === puckId ? { ...p, screenshotUrl } : p)),
    );

  const retirePuck = (puckId: string) =>
    setPucks(
      pucks.map((p) => (p.puckId === puckId ? { ...p, status: 'retired' } : p)),
    );

  const updatePuckStatus = (
    puckId: string,
    status: 'in_storage' | 'in_mill' | 'retired',
  ) => setPucks(pucks.map((p) => (p.puckId === puckId ? { ...p, status } : p)));

  const resetPucks = () => setPucks(seed.pucks);

  const value: PuckContextValue = {
    pucks,
    setPucks,
    movePuck,
    updatePuckScreenshot,
    retirePuck,
    updatePuckStatus,
    resetPucks,
  };

  return <PuckContext.Provider value={value}>{children}</PuckContext.Provider>;
};

export const usePuckContext = () => {
  const ctx = useContext(PuckContext);
  if (!ctx) throw new Error('usePuckContext must be used within PuckProvider');
  return ctx;
}; 