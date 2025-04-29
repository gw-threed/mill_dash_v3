import React, { createContext, useContext, type ReactNode } from 'react';
import { MillLogEntry } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MillLogContextValue {
  logs: MillLogEntry[];
  addLogEntry: (entry: MillLogEntry) => void;
  addRelocationLogEntry: (
    originalLogId: string,
    puckId: string,
    previousLocation: string,
    newLocation: string,
    caseIds: string[]
  ) => void;
}

const MillLogContext = createContext<MillLogContextValue | undefined>(undefined);

// Simple unique id generator for logs
const generateLogId = () => `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const MillLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useLocalStorage<MillLogEntry[]>('millLogs', []);

  const addLogEntry = (entry: MillLogEntry) => setLogs((prev) => [...prev, entry]);
  
  const addRelocationLogEntry = (
    originalLogId: string,
    puckId: string,
    previousLocation: string,
    newLocation: string,
    caseIds: string[]
  ) => {
    const newEntry: MillLogEntry = {
      logId: generateLogId(),
      timestamp: new Date().toISOString(),
      puckId,
      previousLocation,
      newLocation,
      caseIds,
      lastJobTriggered: false,
      notes: `Relocated from ${previousLocation} due to mill reassignment`,
    };
    
    setLogs((prev) => [...prev, newEntry]);
  };

  const value: MillLogContextValue = { 
    logs, 
    addLogEntry, 
    addRelocationLogEntry 
  };
  
  return <MillLogContext.Provider value={value}>{children}</MillLogContext.Provider>;
};

export const useMillLogContext = () => {
  const ctx = useContext(MillLogContext);
  if (!ctx) throw new Error('useMillLogContext must be used within MillLogProvider');
  return ctx;
}; 