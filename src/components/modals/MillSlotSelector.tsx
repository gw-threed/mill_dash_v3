import React, { useMemo } from 'react';
import { useMillContext } from '../../context/MillContext';

interface Props {
  selectedMillId: string | null;
  setSelectedMillId: (id: string) => void;
  selectedSlot: string | null;
  setSelectedSlot: (slot: string) => void;
}

const MillSlotSelector: React.FC<Props> = ({
  selectedMillId,
  setSelectedMillId,
  selectedSlot,
  setSelectedSlot,
}) => {
  const { mills } = useMillContext();

  const handleMillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMillId(e.target.value);
    setSelectedSlot('');
  };

  const currentMill = useMemo(() => mills.find((m) => m.id === selectedMillId), [mills, selectedMillId]);

  React.useEffect(() => {
    if (currentMill && currentMill.slots.length === 1) {
      setSelectedSlot('1');
    }
  }, [currentMill, setSelectedSlot]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Select Mill</label>
        <select
          value={selectedMillId || ''}
          onChange={handleMillChange}
          className="w-full bg-[#2D2D2D] text-white p-2 rounded"
        >
          <option value="" disabled>
            -- choose mill --
          </option>
          {mills.map((m) => (
            <option key={m.id} value={m.id} className="text-black">
              {m.id} ({m.model})
            </option>
          ))}
        </select>
      </div>
      {currentMill && currentMill.slots.length > 1 && (
        <div>
          <label className="block text-sm mb-1">Select Slot</label>
          <select
            value={selectedSlot || ''}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="w-full bg-[#2D2D2D] text-white p-2 rounded"
          >
            <option value="" disabled>
              -- choose slot --
            </option>
            {currentMill.slots.map((s) => (
              <option key={s.slotName} value={s.slotName} className="text-black">
                {s.slotName} {s.occupied ? `(occupied)` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      {currentMill && currentMill.slots.length === 1 && (
        <p className="text-sm opacity-80">Slot 1 auto-selected for {currentMill.model}</p>
      )}
    </div>
  );
};

export default MillSlotSelector; 