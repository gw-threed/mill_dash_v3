import React, { createContext, useContext, type ReactNode } from 'react';
import { CamCase } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSeedData } from '../data/seed';

interface CaseContextValue {
  cases: CamCase[];
  setCases: (cases: CamCase[]) => void;
  addCase: (newCase: CamCase) => void;
  addCases: (newCases: CamCase[]) => void;
  removeCases: (caseIds: string[]) => void;
  resetCases: () => void;
  selectedShade: string | null;
  setSelectedShade: (shade: string | null) => void;
}

const CaseContext = createContext<CaseContextValue | undefined>(undefined);

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const seed = generateSeedData();
  const [cases, setCases] = useLocalStorage<CamCase[]>('cases', seed.cases);
  const [selectedShade, setSelectedShade] = React.useState<string | null>(null);

  const addCase = (newCase: CamCase) => setCases((prev) => [...prev, newCase]);
  const addCases = (newCases: CamCase[]) => setCases((prev) => [...prev, ...newCases]);
  const removeCases = (ids: string[]) => setCases((prev) => prev.filter((c) => !ids.includes(c.caseId)));
  const resetCases = () => setCases(seed.cases);

  const value: CaseContextValue = { cases, setCases, addCase, addCases, removeCases, resetCases, selectedShade, setSelectedShade };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
};

export const useCaseContext = () => {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCaseContext must be used within CaseProvider');
  return ctx;
}; 