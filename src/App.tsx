import React, { useEffect } from 'react';
import CaseList from './components/cases/CaseList';
import { CaseProvider } from './context/CaseContext';
import { PuckProvider } from './context/PuckContext';
import { StorageProvider } from './context/StorageContext';
import { MillProvider } from './context/MillContext';
import PuckList from './components/pucks/PuckList';
import DashboardLayout from './components/DashboardLayout';

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CaseProvider>
    <PuckProvider>
      <StorageProvider>
        <MillProvider>{children}</MillProvider>
      </StorageProvider>
    </PuckProvider>
  </CaseProvider>
);

const App: React.FC = () => {
  return (
    <Providers>
      <DashboardLayout />
    </Providers>
  );
};

export default App; 