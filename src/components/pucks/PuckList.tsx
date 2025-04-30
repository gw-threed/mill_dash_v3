import React, { useMemo, useState, useEffect } from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useCaseContext } from '../../context/CaseContext';
import PuckCard from './PuckCard';
import AddPuckCard from './AddPuckCard';
import { ALL_OTHER_SHADES } from '../cases/ShadeTiles';

interface Props {
  selectedPuckId: string | null;
  setSelectedPuckId: React.Dispatch<React.SetStateAction<string | null>>;
}

const PuckList: React.FC<Props> = ({ selectedPuckId, setSelectedPuckId }) => {
  const { pucks } = usePuckContext();
  const { selectedShade, cases } = useCaseContext();
  const [activeSelectionShade, setActiveSelectionShade] = useState<string | null>(null);
  
  // Read the activeSelectionShade from window to keep in sync
  useEffect(() => {
    // Check if we have cases selected
    const checkActiveShade = () => {
      // @ts-ignore - Reading from window
      const windowActiveShade = window.activeSelectionShade;
      if (windowActiveShade !== activeSelectionShade) {
        setActiveSelectionShade(windowActiveShade);
      }
    };
    
    // Check immediately
    checkActiveShade();
    
    // Also set up an interval to check regularly for updates
    const intervalId = setInterval(checkActiveShade, 100);
    
    return () => clearInterval(intervalId);
  }, [activeSelectionShade]);

  const filtered = useMemo(() => {
    // If we have a specific shade selected from active cases, use that
    if (activeSelectionShade) {
      const eligible = pucks.filter((p) => p.status !== 'retired');
      return eligible.filter((p) => p.shade === activeSelectionShade);
    }
    
    // If no active shade, return empty array
    return [];
  }, [pucks, activeSelectionShade]);

  useEffect(() => {
    setSelectedPuckId((prev) => {
      if (!prev) return null;
      const stillExists = filtered.find((p) => p.puckId === prev);
      return stillExists ? prev : null;
    });
  }, [filtered, setSelectedPuckId]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((p) => (
        <PuckCard
          key={p.puckId}
          puck={p}
          isSelected={selectedPuckId === p.puckId}
          onSelect={(id) => setSelectedPuckId(id)}
        />
      ))}
      
      {activeSelectionShade && (
        <AddPuckCard selectedShade={activeSelectionShade} />
      )}
      
      {filtered.length === 0 && (
        <div className="text-gray-400 text-sm mt-4">
          {activeSelectionShade 
            ? `No pucks available for shade ${activeSelectionShade}.` 
            : "Select a case to view available pucks for its shade."}
        </div>
      )}
    </div>
  );
};

export default PuckList; 