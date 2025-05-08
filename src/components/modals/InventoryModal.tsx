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
  const { getInventoryPucks, moveFromInventoryToStorage, pucks, moveToInventory, updatePuckStatus } = usePuckContext();
  const { findFirstAvailableSlot, occupySlot } = useStorageContext();
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  
  // Audit mode state
  const [auditMode, setAuditMode] = useState(false);
  const [scannedPuckIds, setScannedPuckIds] = useState<string[]>([]);
  const [auditComplete, setAuditComplete] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    missingFromInventory: Puck[];
    extraInInventory: Puck[];
  }>({ missingFromInventory: [], extraInInventory: [] });
  
  // Debug logging
  console.log("All pucks:", pucks);
  console.log("Pucks with in_inventory status:", pucks.filter(p => p.status === 'in_inventory'));
  
  // Get all inventory pucks
  const inventoryPucks = getInventoryPucks();
  console.log("Inventory pucks from getInventoryPucks:", inventoryPucks);
  
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

  // Start inventory audit
  const startAudit = () => {
    setAuditMode(true);
    setScannedPuckIds([]);
    setAuditComplete(false);
    setAuditResults({ missingFromInventory: [], extraInInventory: [] });
    setScanMessage('Audit mode started. Scan all pucks in inventory.');
  };

  // Simulate scanning a puck for audit
  const simulateScanPuck = () => {
    if (!auditMode) return;
    
    setScanning(true);
    setScanMessage('Scanning puck...');
    
    // Simulate a scan after a short delay
    setTimeout(() => {
      setScanning(false);
      
      // Get a random puck to simulate scanning
      // In a real implementation, this would get the actual scanned puck ID
      const allAvailablePucks = pucks.filter(p => p.status !== 'retired');
      const randomIndex = Math.floor(Math.random() * allAvailablePucks.length);
      const scannedPuck = allAvailablePucks[randomIndex];
      
      if (scannedPuckIds.includes(scannedPuck.puckId)) {
        setScanMessage(`Puck ${scannedPuck.puckId} already scanned.`);
      } else {
        setScannedPuckIds(prev => [...prev, scannedPuck.puckId]);
        setScanMessage(`Scanned puck: ${scannedPuck.puckId} (${scannedPuck.shade}, ${scannedPuck.thickness})`);
      }
    }, 1000);
  };

  // Complete the audit and analyze results
  const completeAudit = () => {
    // 1. Find pucks that were scanned but aren't in inventory
    const allPucksMap = pucks.reduce((acc, puck) => {
      acc[puck.puckId] = puck;
      return acc;
    }, {} as Record<string, Puck>);
    
    const missingFromInventory = scannedPuckIds
      .filter(id => {
        const puck = allPucksMap[id];
        return puck && puck.status !== 'in_inventory';
      })
      .map(id => allPucksMap[id]);
    
    // 2. Find pucks that are in inventory but weren't scanned
    const extraInInventory = inventoryPucks.filter(
      puck => !scannedPuckIds.includes(puck.puckId)
    );
    
    setAuditResults({ missingFromInventory, extraInInventory });
    setAuditComplete(true);
    setAuditMode(false);
    setScanMessage(`Audit complete. Found ${missingFromInventory.length} pucks to add and ${extraInInventory.length} pucks to remove.`);
  };

  // Move a scanned puck to inventory
  const moveToInventoryFromAudit = (puckId: string) => {
    moveToInventory(puckId);
    
    // Update audit results to remove this puck from the missingFromInventory list
    setAuditResults(prev => ({
      ...prev,
      missingFromInventory: prev.missingFromInventory.filter(p => p.puckId !== puckId)
    }));
  };

  // Remove a puck from inventory that wasn't scanned
  const removeFromInventory = (puckId: string) => {
    updatePuckStatus(puckId, 'in_storage');
    
    // Update audit results to remove this puck from the extraInInventory list
    setAuditResults(prev => ({
      ...prev,
      extraInInventory: prev.extraInInventory.filter(p => p.puckId !== puckId)
    }));
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
              disabled={auditMode}
            />
          </div>
          {!auditMode && !auditComplete && (
            <>
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
              <button
                onClick={startAudit}
                className="px-4 py-2 rounded-md flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Audit Inventory
              </button>
            </>
          )}
          {auditMode && (
            <>
              <button
                onClick={simulateScanPuck}
                disabled={scanning}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  scanning ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#BB86FC] hover:bg-[#BB86FC]/80'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m0 0H8m4 0h4m-4-8a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                {scanning ? 'Scanning...' : 'Scan Puck'}
              </button>
              <button
                onClick={completeAudit}
                className="px-4 py-2 rounded-md flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                Complete Audit
              </button>
            </>
          )}
        </div>
        
        {scanMessage && (
          <div className="mb-4 px-4 py-2 bg-[#2D2D2D] rounded-md text-center">
            {scanMessage}
          </div>
        )}
        
        {auditMode && (
          <div className="mb-4 px-4 py-2 bg-[#3A3A3A] rounded-md">
            <h4 className="font-semibold mb-2 text-[#BB86FC]">Audit in Progress</h4>
            <p className="text-sm mb-2">Scanned {scannedPuckIds.length} pucks so far.</p>
            <p className="text-xs text-gray-400">
              In a real implementation, scan each puck in your physical inventory with a barcode scanner.
            </p>
          </div>
        )}
        
        {/* Audit Results */}
        {auditComplete && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-[#BB86FC] pb-2 border-b border-[#BB86FC]/30">
              Audit Results
            </h4>
            
            {/* Pucks to add to inventory */}
            {auditResults.missingFromInventory.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold mb-2 text-yellow-500">
                  Pucks scanned but not in inventory system ({auditResults.missingFromInventory.length}):
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {auditResults.missingFromInventory.map(puck => (
                    <div key={puck.puckId} className="flex justify-between items-center bg-[#3A3A3A] p-2 rounded-md">
                      <div className="text-sm">
                        <p>{puck.puckId} - {puck.shade} ({puck.thickness})</p>
                        <p className="text-xs text-gray-400">Current status: {puck.status}</p>
                      </div>
                      <button
                        onClick={() => moveToInventoryFromAudit(puck.puckId)}
                        className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded"
                      >
                        Move to Inventory
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pucks to remove from inventory */}
            {auditResults.extraInInventory.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold mb-2 text-red-500">
                  Pucks in inventory but not scanned ({auditResults.extraInInventory.length}):
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {auditResults.extraInInventory.map(puck => (
                    <div key={puck.puckId} className="flex justify-between items-center bg-[#3A3A3A] p-2 rounded-md">
                      <div className="text-sm">
                        <p>{puck.puckId} - {puck.shade} ({puck.thickness})</p>
                      </div>
                      <button
                        onClick={() => removeFromInventory(puck.puckId)}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
                      >
                        Remove from Inventory
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {auditResults.missingFromInventory.length === 0 && 
             auditResults.extraInInventory.length === 0 && (
              <div className="text-center py-4 text-green-500">
                Inventory is completely accurate! All scanned pucks match the system.
              </div>
            )}
          </div>
        )}
        
        {/* Inventory status */}
        {!auditMode && !auditComplete && (
          <div className="mb-2 flex justify-between items-center">
            <p className="text-sm text-gray-400">
              {filteredPucks.length} pucks in inventory
              {search ? ` (filtered from ${inventoryPucks.length})` : ''}
            </p>
          </div>
        )}
        
        {/* Puck list organized by shade and thickness */}
        {!auditMode && (
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
        )}
      </div>
    </div>
  );
};

export default InventoryModal; 