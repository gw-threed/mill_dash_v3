import React, { useMemo } from 'react';
import { useMillContext } from '../../context/MillContext';

interface Props {
  selectedMillId: string | null;
  setSelectedMillId: (id: string) => void;
  selectedSlot: string | null;
  setSelectedSlot: (slot: string) => void;
}

// Helper to provide custom display labels and ordering
const millDisplayOrder = ['A52-1', 'A52-2', 'DWX-1', 'DWX-2', '350i-1'];

const millLabel = (millId: string) => {
  if (millId.startsWith('A52')) {
    const suffix = millId.split('-')[1] === '1' ? 'A' : 'B';
    return `A52 | ${suffix}`;
  }
  if (millId.startsWith('DWX')) {
    const suffix = millId.split('-')[1] === '1' ? 'A' : 'B';
    return `DWX | ${suffix}`;
  }
  if (millId.startsWith('350i')) return '350i';
  return millId;
};

const MillSlotSelector: React.FC<Props> = ({
  selectedMillId,
  setSelectedMillId,
  selectedSlot,
  setSelectedSlot,
}) => {
  const { mills } = useMillContext();

  // Order mills explicitly as per user spec
  const orderedMills = useMemo(() => {
    const map = Object.fromEntries(mills.map((m) => [m.id, m]));
    return millDisplayOrder
      .map((id) => map[id])
      .filter(Boolean);
  }, [mills]);

  const currentMill = useMemo(() => mills.find((m) => m.id === selectedMillId), [mills, selectedMillId]);

  // Auto-select slot 1 for single-slot mills
  React.useEffect(() => {
    if (currentMill && currentMill.slots.length === 1) {
      setSelectedSlot('1');
    }
  }, [currentMill, setSelectedSlot]);

  const selectMill = (id: string) => {
    setSelectedMillId(id);
    setSelectedSlot('');
  };

  return (
    <div className="space-y-4">
      {/* Mill Picker */}
      <div>
        <label className="block text-sm mb-1">Select Mill</label>
        <div className="flex flex-wrap gap-2">
          {orderedMills.map((m) => {
            const isSelected = m.id === selectedMillId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMill(m.id)}
                className={`px-3 py-2 rounded text-xs font-medium transition min-w-[90px] border border-gray-600 bg-[#2D2D2D] hover:border-[#BB86FC] ${
                  isSelected ? 'ring-2 ring-[#BB86FC]' : ''
                }`}
              >
                {millLabel(m.id)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot Picker */}
      {currentMill && currentMill.slots.length > 1 && (
        <div>
          <label className="block text-sm mb-1">Select Slot</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {currentMill.slots.map((slot) => {
              const isSelected = slot.slotName === selectedSlot;
              const occupied = slot.occupied;
              return (
                <button
                  key={slot.slotName}
                  type="button"
                  onClick={() => setSelectedSlot(slot.slotName)}
                  className={`px-3 py-1 rounded text-xs font-medium min-w-[60px] transition border border-gray-600 ${
                    occupied
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-[#2D2D2D] hover:border-[#BB86FC]'
                  } ${isSelected ? 'ring-2 ring-[#BB86FC]' : ''}`}
                >
                  {slot.slotName}
                  {occupied && ' 🚫'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentMill && currentMill.slots.length === 1 && (
        <p className="text-sm opacity-80">Slot 1 auto-selected for {currentMill.model}</p>
      )}
    </div>
  );
};

export default MillSlotSelector; 