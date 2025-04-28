import React, { useMemo } from 'react';
import { useStorageContext } from '../../context/StorageContext';
import { usePuckContext } from '../../context/PuckContext';
import StorageSlot from './StorageSlot';
import { Puck } from '../../types';

interface Props {
  onSlotClick?: (puck: Puck) => void;
}

const StorageGrid: React.FC<Props> = ({ onSlotClick }) => {
  const { storageSlots } = useStorageContext();
  const { pucks } = usePuckContext();

  const puckMap = useMemo(() => Object.fromEntries(pucks.map((p) => [p.puckId, p])), [pucks]);

  const columns = 'ABCDEFG'.split('');
  const shelves = 'ABCDEFG'.split('');

  return (
    <div className="overflow-y-auto pr-2 space-y-6">
      {shelves.map((shelf) => (
        <div key={shelf} className="space-y-2">
          {/* Shelf Header */}
          <div className="sticky top-0 bg-[#1E1E1E] z-10 flex items-center pt-2">
            <h4 className="font-semibold text-sm uppercase">Shelf {shelf}</h4>
            <hr className="flex-1 ml-2 border-gray-600" />
          </div>
          {/* Column Letters */}
          <div className="flex gap-3">
            {columns.map((c) => (
              <div key={c} className="w-24 text-center text-xs opacity-60">
                {c}
              </div>
            ))}
          </div>
          {/* Columns with stacked slots */}
          <div className="flex gap-3">
            {columns.map((col) => {
              const colSlots = storageSlots
                .filter((s) => s.shelf === shelf && s.column === col)
                .sort((a, b) => a.slotNumber - b.slotNumber);
              return (
                <div key={col} className="flex flex-col-reverse gap-1 border border-gray-700 rounded-sm w-24 p-2">
                  {colSlots.map((slot) => {
                    const puck = slot.puckId ? puckMap[slot.puckId] : undefined;
                    return (
                      <StorageSlot
                        key={slot.fullLocation}
                        slot={slot}
                        puck={puck}
                        onClick={puck ? () => onSlotClick && onSlotClick(puck) : undefined}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StorageGrid; 