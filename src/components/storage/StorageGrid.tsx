import React, { useState } from 'react';
import { useStorageContext } from '../../context/StorageContext';
import { usePuckContext } from '../../context/PuckContext';
import StorageSlot from './StorageSlot';
import placeholderImg from '../../assets/puck_placeholder.png';

const StorageGrid: React.FC = () => {
  const { storageSlots } = useStorageContext();
  const { pucks } = usePuckContext();
  const [selectedPuckId, setSelectedPuckId] = useState<string | null>(null);

  const puckMap = Object.fromEntries(pucks.map((p) => [p.puckId, p]));

  const columns = 'ABCDEFG'.split('');
  const shelves = 'ABCDEFG'.split('');

  const selectedPuck = selectedPuckId ? puckMap[selectedPuckId] : null;

  return (
    <div className="flex gap-6">
      {/* grid */}
      <div className="flex flex-col gap-1">
        {shelves.map((shelf) => (
          <div key={shelf} className="flex gap-1">
            {columns.map((col) => {
              const colSlots = storageSlots.filter((s) => s.shelf === shelf && s.column === col);
              // slots sorted bottom(1) to top(9)
              return (
                <div key={col} className="flex flex-col-reverse gap-1">
                  {colSlots.map((slot) => (
                    <StorageSlot
                      key={slot.fullLocation}
                      slot={slot}
                      puck={slot.puckId ? puckMap[slot.puckId] : undefined}
                      onClick={() => setSelectedPuckId(slot.puckId || null)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* info panel */}
      {selectedPuck && (
        <div className="w-60 bg-[#2D2D2D] p-4 rounded">
          <h4 className="font-semibold mb-2">Puck {selectedPuck.puckId}</h4>
          <p className="text-xs opacity-80 mb-1">Shade: {selectedPuck.shade}</p>
          <p className="text-xs opacity-80 mb-1">Thickness: {selectedPuck.thickness}</p>
          <p className="text-xs opacity-80 mb-1">Shrink: {selectedPuck.shrinkageFactor.toFixed(4)}</p>
          <p className="text-xs opacity-80 mb-1">Lot: {selectedPuck.lotNumber}</p>
          <img
            src={selectedPuck.screenshotUrl === '/puck_placeholder.png' ? placeholderImg : selectedPuck.screenshotUrl}
            alt="screenshot"
            className="mt-2 w-full h-40 object-contain border border-gray-600 rounded"
          />
        </div>
      )}
    </div>
  );
};

export default StorageGrid; 