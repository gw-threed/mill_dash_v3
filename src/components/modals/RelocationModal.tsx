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
  const puckDisplacementNeeded = !!occupiedPuckId && occupiedPuckId !== selectedPuckId;
  const selectedPuckIsAlreadyInMill = selectedPuckLoc.includes(millId) && selectedPuckLoc.includes(slotName);

  // Determine the title and messages based on the context
  const title = puckDisplacementNeeded 
    ? "Puck Relocation Instructions" 
    : "Mill Assignment Instructions";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onCancel} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-[500px] space-y-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        
        {puckDisplacementNeeded && (
          <div className="bg-gray-800 p-4 rounded-md">
            <div className="mb-2 text-sm">Step 1: Move current puck <span className="text-[#BB86FC] font-semibold">{occupiedPuckId}</span> (Shade {occupiedShade}) from:</div>
            <div className="text-2xl font-bold text-center mb-3 text-[#BB86FC]">{millId} / Slot {slotName}</div>
            <div className="mb-2 text-sm">To storage slot:</div>
            <div className="text-3xl font-bold text-center p-3 bg-[#2D2D2D] rounded-md text-white border-2 border-[#BB86FC]">
              {vacantSlot}
            </div>
          </div>
        )}
        
        {/* Only show puck movement instructions if the puck isn't already in the target location */}
        {!selectedPuckIsAlreadyInMill && (
          <div className="bg-gray-800 p-4 rounded-md">
            <div className="mb-2 text-sm">
              {puckDisplacementNeeded ? 'Step 2: ' : ''}
              Move selected puck <span className="text-[#BB86FC] font-semibold">{selectedPuckId}</span> from:
            </div>
            <div className="text-2xl font-bold text-center mb-3 text-white">
              {selectedPuckLoc || 'Current Location'}
            </div>
            <div className="mb-2 text-sm">To mill slot:</div>
            <div className="text-3xl font-bold text-center p-3 bg-[#2D2D2D] rounded-md text-white border-2 border-[#BB86FC]">
              {millId} / Slot {slotName}
            </div>
          </div>
        )}

        {/* If the puck is already in the target location, show a different message */}
        {selectedPuckIsAlreadyInMill && !puckDisplacementNeeded && (
          <div className="bg-green-800/30 p-4 rounded-md">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-lg font-medium text-green-300">Puck Already in Position</p>
            </div>
            <p className="text-center">
              The selected puck <span className="text-[#BB86FC] font-semibold">{selectedPuckId}</span> is already in {millId} / Slot {slotName}.
            </p>
          </div>
        )}

        <button
          onClick={onConfirm}
          className="px-4 py-3 rounded bg-[#BB86FC] hover:brightness-110 w-full text-base font-semibold mt-2"
        >
          {selectedPuckIsAlreadyInMill ? "Continue" : "I've moved the puck" + (puckDisplacementNeeded ? "s" : "")}
        </button>
      </div>
    </div>
  );
};

export default RelocationModal; 