import React, { useState, useMemo } from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useStorageContext } from '../../context/StorageContext';
import { Puck } from '../../types';

interface Props {
  onClose: () => void;
}

// Group pucks by shade and thickness
const groupPucks = (pucks: Puck[]) => {
  const groups: Record<string, Puck[]> = {};
  
  pucks.forEach(puck => {
    const key = `${puck.shade}-${puck.thickness}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(puck);
  });
  
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
};

const InventoryModal: React.FC<Props> = ({ onClose }) => {
  const { getInventoryPucks, moveFromInventoryToStorage } = usePuckContext();
  const { findFirstAvailableSlot, occupySlot } = useStorageContext();
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  
  // Get all inventory pucks
  const inventoryPucks = getInventoryPucks();
  
  // Filter pucks based on search
  const filteredPucks = useMemo(() => {
    if (!search) return inventoryPucks;
    
    const term = search.toLowerCase();
    return inventoryPucks.filter(puck => 
      puck.puckId.toLowerCase().includes(term) ||
      puck.shade.toLowerCase().includes(term) ||
      puck.thickness.toLowerCase().includes(term) ||
      puck.serialNumber.toString().includes(term)
    );
  }, [inventoryPucks, search]);
  
  // Group pucks by shade and thickness
  const groupedPucks = useMemo(() => {
    return groupPucks(filteredPucks);
  }, [filteredPucks]);
  
  // Move puck from inventory to storage
  const handleMovePuck = (puckId: string) => {
    const slot = findFirstAvailableSlot();
    if (!slot) {
      alert('No available storage slots. Please free up a slot first.');
      return;
    }
    
    moveFromInventoryToStorage(puckId, slot.fullLocation);
    occupySlot(slot.fullLocation, puckId);
  };
  
  // Handle barcode scan for moving pucks
  const handleScanBarcode = () => {
    setScanning(true);
    setScanMessage('Scanning...');
    
    // Simulate barcode scanning - in a real implementation this would be connected to a scanner
    const timeoutId = setTimeout(() => {
      setScanning(false);
      setScanMessage('');
      
      // For now show a message that this is not fully implemented
      alert('Barcode scanning would be implemented with actual scanner hardware');
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg w-full max-w-5xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Puck Inventory</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search and scan controls */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by shade, thickness, or ID..."
              className="w-full px-3 py-2 bg-[#2D2D2D] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleScanBarcode}
            disabled={scanning}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              scanning ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#BB86FC] hover:bg-[#BB86FC]/80'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m0 0H8m4 0h4m-4-8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            {scanning ? 'Scanning...' : 'Scan Barcode'}
          </button>
        </div>
        
        {scanMessage && (
          <div className="mb-4 px-4 py-2 bg-[#2D2D2D] rounded-md text-center">
            {scanMessage}
          </div>
        )}
        
        {/* Inventory status */}
        <div className="mb-2 flex justify-between items-center">
          <p className="text-sm text-gray-400">
            {filteredPucks.length} pucks in inventory
            {search ? ` (filtered from ${inventoryPucks.length})` : ''}
          </p>
        </div>
        
        {/* Puck list organized by shade and thickness */}
        <div className="flex-1 overflow-y-auto">
          {groupedPucks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search ? 'No pucks match your search.' : 'No pucks in inventory.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedPucks.map(([key, pucks]) => {
                const [shade, thickness] = key.split('-');
                return (
                  <div key={key} className="bg-[#2D2D2D] rounded-md p-4">
                    <h4 className="font-semibold mb-3 text-[#BB86FC] border-b border-[#BB86FC]/30 pb-2">
                      {shade} ({thickness}) - {pucks.length} pucks
                    </h4>
                    <div className="space-y-3">
                      {pucks.map(puck => (
                        <div key={puck.puckId} className="flex justify-between items-center bg-[#3A3A3A] p-3 rounded-md">
                          <div>
                            <p className="font-medium">{puck.puckId}</p>
                            <p className="text-xs text-gray-400">
                              SN: {puck.serialNumber} | LOT: {puck.lotNumber}
                            </p>
                          </div>
                          <button
                            onClick={() => handleMovePuck(puck.puckId)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                          >
                            Pull to Storage
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal; 