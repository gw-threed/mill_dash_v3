import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { usePuckContext } from '../../context/PuckContext';
import { useStorageContext } from '../../context/StorageContext';
import { Puck } from '../../types';
import placeholderImg from '../../assets/puck_placeholder.png';

interface Props {
  selectedShade: string | null;
}

const AddPuckCard: React.FC<Props> = ({ selectedShade }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPuckForMove, setSelectedPuckForMove] = useState<Puck | null>(null);
  
  const { pucks, moveFromInventoryToStorage } = usePuckContext();
  const { findFirstAvailableSlot, occupySlot } = useStorageContext();

  // Get pucks from inventory that match the selected shade
  const inventoryPucks = useMemo(() => {
    if (!selectedShade) return [];
    return pucks.filter(p => p.status === 'in_inventory' && p.shade === selectedShade);
  }, [pucks, selectedShade]);

  const handlePullFromInventory = (puck: Puck) => {
    setSelectedPuckForMove(puck);
  };

  const confirmPullFromInventory = () => {
    if (!selectedPuckForMove) return;
    
    // Find available storage slot
    const vacant = findFirstAvailableSlot();
    if (!vacant) {
      setError('No vacant storage slots available');
      return;
    }
    
    // Move puck from inventory to storage
    moveFromInventoryToStorage(selectedPuckForMove.puckId, vacant.fullLocation);
    occupySlot(vacant.fullLocation, selectedPuckForMove.puckId);
    
    // Close modal and show success with large text for the location
    setIsModalOpen(false);
    setSelectedPuckForMove(null);
    
    // Show placement confirmation with large text
    setShowPlacementConfirmation(true);
    setStorageLocation(vacant.fullLocation);
  };

  // State for placement confirmation
  const [showPlacementConfirmation, setShowPlacementConfirmation] = useState(false);
  const [storageLocation, setStorageLocation] = useState('');

  const resetModal = () => {
    setSelectedPuckForMove(null);
    setError(null);
    setIsModalOpen(false);
  };

  if (!selectedShade) return null;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={clsx(
          'relative cursor-pointer bg-[#1E1E1E] text-white rounded-md p-4 shadow transition transform hover:-translate-y-0.5 hover:shadow-lg flex flex-col',
          'border-2 border-dashed border-gray-600 hover:border-[#BB86FC]'
        )}
      >
        {/* Placeholder image with plus icon overlay */}
        <div className="relative">
          <img
            src={placeholderImg}
            alt="Add new puck"
            className="w-full aspect-square object-cover rounded-md shadow-md mb-3 opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#BB86FC] rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div className="mt-auto flex justify-center items-center text-center">
          <div className="text-lg font-bold leading-none text-[#BB86FC]">
            Add {selectedShade} Puck
          </div>
        </div>
      </div>

      {/* Modal for selecting pucks from inventory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={resetModal} />
          <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 w-[500px] space-y-5">
            <div>
              <h3 className="text-lg font-semibold">Pull Puck from Inventory</h3>
              {selectedShade && (
                <p className="text-sm text-gray-300 mt-1">
                  Available {selectedShade} pucks in inventory: <span className="font-medium text-white">{inventoryPucks.length}</span>
                </p>
              )}
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            {inventoryPucks.length === 0 ? (
              <div className="bg-[#2D2D2D] rounded-md p-4 text-center">
                <p className="text-gray-400">No {selectedShade} pucks available in inventory.</p>
                <p className="text-xs mt-2">Check inventory or order new pucks.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {inventoryPucks.map(puck => (
                  <div 
                    key={puck.puckId}
                    className={`bg-[#2D2D2D] rounded-md p-3 hover:bg-[#3D3D3D] cursor-pointer transition
                      ${selectedPuckForMove?.puckId === puck.puckId ? 'ring-2 ring-[#BB86FC]' : ''}
                    `}
                    onClick={() => handlePullFromInventory(puck)}
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
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!selectedPuckForMove || inventoryPucks.length === 0}
                onClick={confirmPullFromInventory}
                className={`px-4 py-2 rounded text-sm font-medium transition min-w-[120px] bg-[#BB86FC] hover:brightness-110 ${
                  !selectedPuckForMove || inventoryPucks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Pull to Storage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Placement confirmation modal */}
      {showPlacementConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowPlacementConfirmation(false)} />
          <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 w-[500px] space-y-6">
            <h3 className="text-xl font-semibold">Puck Moved to Storage</h3>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <div className="mb-2 text-sm">
                Pulled from Inventory. Place in storage slot:
              </div>
              <div className="text-4xl font-bold text-center p-6 bg-[#2D2D2D] rounded-md text-white border-2 border-[#BB86FC]">
                {storageLocation}
              </div>
            </div>
            
            <button
              onClick={() => setShowPlacementConfirmation(false)}
              className="px-4 py-3 rounded bg-[#BB86FC] hover:brightness-110 w-full text-base font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPuckCard; 