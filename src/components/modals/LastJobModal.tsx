import React, { useState, useMemo } from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useStorageContext } from '../../context/StorageContext';
import { Puck } from '../../types';

interface Props {
  onConfirm: (replacementPuckId: string) => void;
  onCancel: () => void;
  expectedShade: string;
  expectedThickness: string;
}

const LastJobModal: React.FC<Props> = ({ onConfirm, onCancel, expectedShade, expectedThickness }) => {
  const { pucks, moveFromInventoryToStorage } = usePuckContext();
  const { findFirstAvailableSlot, occupySlot } = useStorageContext();

  const [selectedPuck, setSelectedPuck] = useState<Puck | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for placement confirmation
  const [showPlacementConfirmation, setShowPlacementConfirmation] = useState(false);
  const [storageLocation, setStorageLocation] = useState('');

  // Get pucks from inventory that match the expected shade and thickness
  const inventoryPucks = useMemo(() => {
    return pucks.filter(p => 
      p.status === 'in_inventory' && 
      p.shade === expectedShade && 
      p.thickness === expectedThickness
    );
  }, [pucks, expectedShade, expectedThickness]);

  const handleSelectPuck = (puck: Puck) => {
    setSelectedPuck(puck);
    setError(null);
  };

  const handleConfirmSelection = () => {
    if (!selectedPuck) return;
    
    const vacant = findFirstAvailableSlot();
    if (!vacant) {
      setError('No vacant storage slot available');
      return;
    }

    // Move puck from inventory to storage
    moveFromInventoryToStorage(selectedPuck.puckId, vacant.fullLocation);
    occupySlot(vacant.fullLocation, selectedPuck.puckId);

    // Show placement confirmation with large text
    setShowPlacementConfirmation(true);
    setStorageLocation(vacant.fullLocation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onCancel} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-[500px] space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Last Job – Replace Depleted Puck</h3>
          <p className="text-sm text-gray-300 mt-1">
            Replacing puck: <span className="font-medium text-white">{expectedShade} {expectedThickness}</span>
          </p>
        </div>
        
        {inventoryPucks.length === 0 ? (
          <div className="bg-[#2D2D2D] rounded-md p-4 text-center">
            <p className="text-red-400">No matching pucks available in inventory!</p>
            <p className="text-xs mt-2">
              You need a {expectedShade} {expectedThickness} puck to replace the depleted one.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm">Select a replacement puck from inventory:</p>
              
              <div className="bg-[#2D2D2D] rounded-md overflow-hidden">
                <div className="max-h-60 overflow-y-auto space-y-1 p-1">
                  {inventoryPucks.map(puck => (
                    <div 
                      key={puck.puckId}
                      className={`rounded-md p-3 cursor-pointer transition ${
                        selectedPuck?.puckId === puck.puckId 
                          ? 'bg-[#BB86FC]/20 border border-[#BB86FC]' 
                          : 'bg-[#3D3D3D] hover:bg-[#4D4D4D] border border-transparent'
                      }`}
                      onClick={() => handleSelectPuck(puck)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{puck.puckId}</p>
                          <p className="text-xs text-gray-400">
                            {puck.shade} | {puck.thickness} | SN: {puck.serialNumber}
                          </p>
                        </div>
                        <div className="text-xs px-2 py-1 bg-[#1E1E1E] rounded">
                          Lot: {puck.lotNumber}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!selectedPuck}
                onClick={handleConfirmSelection}
                className={`px-4 py-2 rounded text-sm font-medium transition min-w-[120px] bg-[#BB86FC] hover:brightness-110 ${
                  !selectedPuck ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Use Selected Puck
              </button>
            </div>
          </>
        )}
      </div>

      {/* Placement confirmation modal */}
      {showPlacementConfirmation && selectedPuck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 w-[500px] space-y-6">
            <h3 className="text-xl font-semibold">Replacement Puck Moved to Storage</h3>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <div className="mb-2 text-sm">
                Place puck <span className="font-semibold">{selectedPuck.puckId}</span> in storage slot:
              </div>
              <div className="text-4xl font-bold text-center p-6 bg-[#2D2D2D] rounded-md text-white border-2 border-[#BB86FC]">
                {storageLocation}
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowPlacementConfirmation(false);
                onConfirm(selectedPuck.puckId);
              }}
              className="px-4 py-3 rounded bg-[#BB86FC] hover:brightness-110 w-full text-base font-semibold"
            >
              Confirm Placement
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LastJobModal; 