import React, { createContext, useContext, type ReactNode } from 'react';
import { MillLogEntry } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MillLogContextValue {
  logs: MillLogEntry[];
  addLogEntry: (entry: MillLogEntry) => void;
}

const MillLogContext = createContext<MillLogContextValue | undefined>(undefined);

export const MillLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useLocalStorage<MillLogEntry[]>('millLogs', []);

  const addLogEntry = (entry: MillLogEntry) => setLogs((prev) => [...prev, entry]);

  const value: MillLogContextValue = { logs, addLogEntry };
  return <MillLogContext.Provider value={value}>{children}</MillLogContext.Provider>;
};

export const useMillLogContext = () => {
  const ctx = useContext(MillLogContext);
  if (!ctx) throw new Error('useMillLogContext must be used within MillLogProvider');
  return ctx;
}; 