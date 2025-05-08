import React, { useState, useMemo, useEffect } from 'react';
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
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [listenForScan, setListenForScan] = useState(true);
  
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

  // Set up keyboard listener for barcode scanner
  useEffect(() => {
    if (!listenForScan || inventoryPucks.length === 0) return;

    // In a real implementation, this would be connected to a barcode scanner
    // For demo purposes, we'll simulate a scan every 5 seconds
    let scanTimer: number;
    
    const simulateScan = () => {
      if (!listenForScan) return;
      
      // Only scan if we're not already scanning and have pucks to scan
      if (!scanning && inventoryPucks.length > 0) {
        processBarcodeScan();
      }
    };
    
    // Set up periodic scan simulation (in a real app this would be event-based)
    scanTimer = setTimeout(simulateScan, 5000);
    
    // In a real implementation, you would listen for scanner input events here
    const handleKeyDown = (event: KeyboardEvent) => {
      // Many barcode scanners act as keyboard input devices
      // You could detect specific patterns or prefixes here
      // For demo purposes, we'll simulate a scan when Enter is pressed
      if (event.key === 'Enter' && listenForScan) {
        processBarcodeScan();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(scanTimer);
    };
  }, [listenForScan, inventoryPucks, scanning]);

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

  // Process barcode scan
  const processBarcodeScan = () => {
    if (inventoryPucks.length === 0) {
      setError('No matching pucks available in inventory to scan');
      return;
    }

    setScanning(true);
    setScanMessage('Processing barcode scan...');
    
    // Simulate barcode scanning - in a real implementation this would get the actual scanned barcode
    setTimeout(() => {
      setScanning(false);
      
      // Simulate finding a random matching puck from inventory
      const randomIndex = Math.floor(Math.random() * inventoryPucks.length);
      const scannedPuck = inventoryPucks[randomIndex];
      
      setSelectedPuck(scannedPuck);
      setScanMessage(`Scanned puck: ${scannedPuck.puckId} (${scannedPuck.shade}, ${scannedPuck.thickness})`);
      
      // Temporarily stop listening to avoid multiple scans
      setListenForScan(false);
      setTimeout(() => setListenForScan(true), 2000);
    }, 1000);
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
        
        {/* Scanner status indicator */}
        {inventoryPucks.length > 0 && (
          <div className={`flex items-center justify-center gap-3 py-2 px-4 rounded-md bg-[#2D2D2D] ${scanning ? 'animate-pulse' : ''}`}>
            <div className={`w-3 h-3 rounded-full ${scanning ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <p className="text-sm">
              {scanning 
                ? 'Processing scan...' 
                : 'Ready to scan barcode - scan a puck or select below'}
            </p>
          </div>
        )}
        
        {/* Scan message */}
        {scanMessage && (
          <div className="px-4 py-2 bg-[#3A3A3A] rounded-md text-center border border-[#BB86FC]">
            {scanMessage}
          </div>
        )}
        
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