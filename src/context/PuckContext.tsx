import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Puck } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateSeedData } from '../data/seed';
import { MATERIAL_LOOKUP } from '../data/seed';

interface PuckContextValue {
  pucks: Puck[];
  setPucks: (pucks: Puck[]) => void;
  movePuck: (puckId: string, newLocation: string) => void;
  updatePuckScreenshot: (puckId: string, screenshotUrl: string) => void;
  retirePuck: (puckId: string) => void;
  updatePuckStatus: (puckId: string, status: 'in_storage' | 'in_mill' | 'retired' | 'in_inventory') => void;
  resetPucks: () => void;
  createPuck: (shade: string, thickness: string, storageLocation: string) => Puck;
  moveToInventory: (puckId: string) => void;
  moveFromInventoryToStorage: (puckId: string, storageLocation: string) => void;
  getInventoryPucks: () => Puck[];
}

const PuckContext = createContext<PuckContextValue | undefined>(undefined);

export const PuckProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const seed = generateSeedData();
  const [pucks, setPucks] = useLocalStorage<Puck[]>('pucks', seed.pucks);

  // Reset if localStorage has outdated data structure
  useEffect(() => {
    // Check if pucks have the required 'in_inventory' status type
    const hasInventoryPucks = pucks.some(p => p.status === 'in_inventory');
    
    // If the inventory data structure has changed, reset to seed
    if (!hasInventoryPucks) {
      console.log("No inventory pucks found. Resetting to seed data.");
      localStorage.removeItem('pucks');
      setPucks(seed.pucks);
    }
  }, []);

  const movePuck = (puckId: string, newLocation: string) =>
    setPucks((prev) =>
      prev.map((p) => (p.puckId === puckId ? { ...p, currentLocation: newLocation } : p)),
    );

  const updatePuckScreenshot = (puckId: string, screenshotUrl: string) =>
    setPucks((prev) => prev.map((p) => (p.puckId === puckId ? { ...p, screenshotUrl } : p)));

  const retirePuck = (puckId: string) =>
    setPucks((prev) => prev.map((p) => (p.puckId === puckId ? { ...p, status: 'retired' } : p)));

  const updatePuckStatus = (
    puckId: string,
    status: 'in_storage' | 'in_mill' | 'retired' | 'in_inventory',
  ) => setPucks((prev) => prev.map((p) => (p.puckId === puckId ? { ...p, status } : p)));

  const resetPucks = () => setPucks(seed.pucks);
  
  const createPuck = (shade: string, thickness: string, storageLocation: string): Puck => {
    // Find the material ID from the lookup table
    const materialInfo = MATERIAL_LOOKUP.find(m => m.shade === shade && m.thickness === thickness);
    
    if (!materialInfo) {
      throw new Error(`Material with shade ${shade} and thickness ${thickness} not found`);
    }
    
    // Generate a new puck ID
    const highestId = pucks.reduce((max, p) => {
      const match = p.puckId.match(/PUCK-(\d+)/);
      if (!match) return max;
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }, 0);
    
    const newPuckId = `PUCK-${(highestId + 1).toString().padStart(6, '0')}`;
    
    // Create the new puck
    const newPuck: Puck = {
      puckId: newPuckId,
      shrinkageFactor: parseFloat((1.22 + Math.random() * 0.05).toFixed(4)),
      serialNumber: Math.floor(1000 + Math.random() * 9000),
      materialId: materialInfo.materialId,
      lotNumber: Math.floor(100000 + Math.random() * 900000),
      shade,
      thickness,
      currentLocation: storageLocation,
      screenshotUrl: '/puck_placeholder.png',
      status: 'in_storage',
    };
    
    // Add to pucks array
    setPucks((prev) => [...prev, newPuck]);
    
    return newPuck;
  };

  // Move a puck to inventory status
  const moveToInventory = (puckId: string) => {
    setPucks((prev) => 
      prev.map((p) => (p.puckId === puckId 
        ? { ...p, status: 'in_inventory', currentLocation: 'Inventory' } 
        : p
      ))
    );
  };

  // Move a puck from inventory to a storage location
  const moveFromInventoryToStorage = (puckId: string, storageLocation: string) => {
    setPucks((prev) => 
      prev.map((p) => (p.puckId === puckId 
        ? { ...p, status: 'in_storage', currentLocation: storageLocation } 
        : p
      ))
    );
  };

  // Get all pucks in inventory
  const getInventoryPucks = () => {
    const inventoryPucks = pucks.filter(p => p.status === 'in_inventory');
    return inventoryPucks;
  };

  const value: PuckContextValue = {
    pucks,
    setPucks,
    movePuck,
    updatePuckScreenshot,
    retirePuck,
    updatePuckStatus,
    resetPucks,
    createPuck,
    moveToInventory,
    moveFromInventoryToStorage,
    getInventoryPucks,
  };

  return <PuckContext.Provider value={value}>{children}</PuckContext.Provider>;
};

export const usePuckContext = () => {
  const ctx = useContext(PuckContext);
  if (!ctx) throw new Error('usePuckContext must be used within PuckProvider');
  return ctx;
}; 