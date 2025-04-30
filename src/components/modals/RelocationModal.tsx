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
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-[500px] space-y-6">
        <h3 className="text-xl font-semibold">Puck Relocation Instructions</h3>
        
        {stepOneNeeded && (
          <div className="bg-gray-800 p-4 rounded-md">
            <div className="mb-2 text-sm">Step 1: Move current puck <span className="text-[#BB86FC] font-semibold">{occupiedPuckId}</span> (Shade {occupiedShade}) from:</div>
            <div className="text-2xl font-bold text-center mb-3 text-[#BB86FC]">{millId} / Slot {slotName}</div>
            <div className="mb-2 text-sm">To storage slot:</div>
            <div className="text-3xl font-bold text-center p-3 bg-[#2D2D2D] rounded-md text-white border-2 border-[#BB86FC]">
              {vacantSlot}
            </div>
          </div>
        )}
        
        <div className="bg-gray-800 p-4 rounded-md">
          <div className="mb-2 text-sm">
            {stepOneNeeded ? 'Step 2: ' : ''}
            Move selected puck <span className="text-[#BB86FC] font-semibold">{selectedPuckId}</span> from:
          </div>
          <div className="text-2xl font-bold text-center mb-3 text-white">
            {selectedPuckLoc}
          </div>
          <div className="mb-2 text-sm">To mill slot:</div>
          <div className="text-3xl font-bold text-center p-3 bg-[#2D2D2D] rounded-md text-white border-2 border-[#BB86FC]">
            {millId} / Slot {slotName}
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="px-4 py-3 rounded bg-[#BB86FC] hover:brightness-110 w-full text-base font-semibold mt-2"
        >
          I've moved the pucks
        </button>
      </div>
    </div>
  );
};

export default RelocationModal; 