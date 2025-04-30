import React, { useMemo, useState, useEffect } from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useCaseContext } from '../../context/CaseContext';
import PuckCard from './PuckCard';
import AddPuckCard from './AddPuckCard';

interface Props {
  selectedPuckId: string | null;
  setSelectedPuckId: React.Dispatch<React.SetStateAction<string | null>>;
}

const PuckList: React.FC<Props> = ({ selectedPuckId, setSelectedPuckId }) => {
  const { pucks } = usePuckContext();
  const { selectedShade } = useCaseContext();

  const filtered = useMemo(() => {
    if (!selectedShade) return [];
    const eligible = pucks.filter((p) => p.status !== 'retired');
    return eligible.filter((p) => p.shade === selectedShade);
  }, [pucks, selectedShade]);

  useEffect(() => {
    setSelectedPuckId((prev) => {
      if (!prev) return null;
      const stillExists = filtered.find((p) => p.puckId === prev);
      return stillExists ? prev : null;
    });
  }, [selectedShade]);

  return selectedShade ? (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((p) => (
        <PuckCard
          key={p.puckId}
          puck={p}
          isSelected={selectedPuckId === p.puckId}
          onSelect={(id) => setSelectedPuckId(id)}
        />
      ))}
      <AddPuckCard selectedShade={selectedShade} />
      
      {filtered.length === 0 && (
        <div className="text-gray-400 text-sm">No pucks available for this shade.</div>
      )}
    </div>
  ) : (
    <div className="text-gray-400 text-sm">Select a shade to view available pucks.</div>
  );
};

export default PuckList; 