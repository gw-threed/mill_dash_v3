import React, { useMemo } from 'react';
import { useMillContext } from '../../context/MillContext';
import { usePuckContext } from '../../context/PuckContext';
import MillSlot from './MillSlot';
import { Puck } from '../../types';

interface Props {
  onSlotClick?: (puck: Puck) => void;
}

const MillGrid: React.FC<Props> = ({ onSlotClick }) => {
  const { mills } = useMillContext();
  const { pucks } = usePuckContext();

  // Build lookup map for quick access
  const puckMap = useMemo(() => Object.fromEntries(pucks.map((p) => [p.puckId, p])), [pucks]);

  const handleClick = (puck: Puck) => {
    if (onSlotClick) onSlotClick(puck);
  };

  return (
    <div className="space-y-6 overflow-auto pr-2">
      {mills.map((mill) => (
        <div key={mill.id} className="bg-[#1E1E1E] rounded p-4">
          <h4 className="font-semibold mb-3">
            {mill.id} | {mill.model}
          </h4>
          <div
            className={`grid gap-2 ${mill.model === 'A52' ? 'grid-cols-1' : mill.model === 'DWX' ? 'grid-cols-6' : 'grid-cols-4'}`}
          >
            {mill.slots.map((slot) => {
              const puck = slot.puckId ? puckMap[slot.puckId] : undefined;
              return (
                <MillSlot
                  key={slot.slotName}
                  slot={slot}
                  puck={puck}
                  onClick={puck ? () => handleClick(puck) : undefined}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MillGrid; 