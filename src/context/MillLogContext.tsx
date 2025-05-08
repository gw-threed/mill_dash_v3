import React, { createContext, useContext, type ReactNode } from 'react';
import { MillLogEntry } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSeedData } from '../data/seed';

interface MillLogContextValue {
  logs: MillLogEntry[];
  setLogs: (logs: MillLogEntry[]) => void;
  addLogEntry: (log: MillLogEntry) => void;
  addRelocationLogEntry: (
    puckId: string,
    previousLocation: string,
    newLocation: string,
    caseIds: string[],
    notes?: string
  ) => void;
}

const MillLogContext = createContext<MillLogContextValue | undefined>(undefined);

export const MillLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const seed = generateSeedData();
  const [logs, setLogs] = useLocalStorage<MillLogEntry[]>('millLogs', seed.millLogs);

  const addLogEntry = (log: MillLogEntry) => {
    setLogs((prev) => [log, ...prev]);
  };

  const addRelocationLogEntry = (
    puckId: string,
    previousLocation: string,
    newLocation: string,
    caseIds: string[],
    notes?: string
  ) => {
    const logEntry: MillLogEntry = {
      logId: `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      timestamp: new Date().toISOString(),
      puckId,
      previousLocation,
      newLocation,
      caseIds,
      notes,
      lastJobTriggered: false,
    };
    
    addLogEntry(logEntry);
  };

  const value: MillLogContextValue = {
    logs,
    setLogs,
    addLogEntry,
    addRelocationLogEntry,
  };

  return <MillLogContext.Provider value={value}>{children}</MillLogContext.Provider>;
};

export const useMillLogContext = () => {
  const ctx = useContext(MillLogContext);
  if (!ctx) throw new Error('useMillLogContext must be used within MillLogProvider');
  return ctx;
}; 