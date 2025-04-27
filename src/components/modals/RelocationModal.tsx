import React from 'react';

interface Props {
  selectedPuckId: string;
  selectedPuckLoc: string;
  millId: string;
  slotName: string;
  occupiedPuckId?: string;
  occupiedShade?: string;
  vacantSlot?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const RelocationModal: React.FC<Props> = ({
  selectedPuckId,
  selectedPuckLoc,
  millId,
  slotName,
  occupiedPuckId,
  occupiedShade,
  vacantSlot,
  onConfirm,
  onCancel,
}) => {
  const stepOneNeeded = !!occupiedPuckId;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onCancel} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-96 space-y-4">
        <h3 className="text-lg font-semibold">Puck Relocation Instructions</h3>
        <ol className="list-decimal list-inside space-y-3 text-sm">
          {stepOneNeeded && (
            <li>
              Move current puck <span className="text-[#BB86FC] font-semibold">{occupiedPuckId}</span>{' '}
              (Shade {occupiedShade}) from <span className="text-[#BB86FC]">{millId} / Slot {slotName}</span>{' '}
              to first vacant storage slot{' '}
              <span className="text-[#BB86FC] font-semibold">{vacantSlot}</span>.
            </li>
          )}
          <li>
            Move selected puck{' '}
            <span className="text-[#BB86FC] font-semibold">{selectedPuckId}</span> from{' '}
            <span className="text-[#BB86FC]">{selectedPuckLoc}</span> to{' '}
            <span className="text-[#BB86FC]">{millId} / Slot {slotName}</span>.
          </li>
        </ol>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded bg-[#BB86FC] hover:brightness-110 w-full text-sm mt-2"
        >
          I've moved the pucks
        </button>
      </div>
    </div>
  );
};

export default RelocationModal; 