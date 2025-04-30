import React, { useState, useMemo } from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useMillLogContext } from '../../context/MillLogContext';
import { Puck } from '../../types';
import { MATERIAL_LOOKUP } from '../../data/seed';

interface Props {
  onClose: () => void;
}

const UsedPuckOrderQueueModal: React.FC<Props> = ({ onClose }) => {
  const { pucks, setPucks, retirePuck } = usePuckContext();
  const { logs } = useMillLogContext();
  const [isAddingSuggested, setIsAddingSuggested] = useState(false);
  const [suggestedAdded, setSuggestedAdded] = useState(false);
  
  // Get all pucks with 'retired' status
  const retiredPucks = useMemo(() => 
    pucks.filter(puck => puck.status === 'retired'),
    [pucks]
  );

  // Group pucks by shade and thickness
  const groupedPucks = useMemo(() => {
    const groups: Record<string, Puck[]> = {};
    
    retiredPucks.forEach(puck => {
      const key = `${puck.shade}-${puck.thickness}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(puck);
    });
    
    return groups;
  }, [retiredPucks]);

  // Prepare summary data for the order
  const orderSummary = useMemo(() => 
    Object.entries(groupedPucks).map(([key, pucks]) => {
      const [shade, thickness] = key.split('-');
      return {
        shade,
        thickness,
        count: pucks.length,
        pucks
      };
    }),
    [groupedPucks]
  );

  // Calculate inventory analysis (similar logic as in InventoryAnalysisModal)
  const inventoryAnalysis = useMemo(() => {
    // Get current date and date 5 weeks ago
    const now = new Date();
    const fiveWeeksAgo = new Date();
    fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35); // 5 weeks = 35 days
    
    // Get unique materials (shade + thickness combinations)
    const materials = [...new Set(MATERIAL_LOOKUP.map(m => `${m.shade}-${m.thickness}-${m.materialId}`))];
    
    // Count usage in the last 5 weeks from mill logs where lastJobTriggered is true
    const usage: Record<string, number> = {};
    
    // Initialize usage counter for all materials
    materials.forEach(material => {
      usage[material] = 0;
    });
    
    // Count retired pucks in the mill logs from the last 5 weeks
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      
      // Only consider logs from the last 5 weeks
      if (logDate >= fiveWeeksAgo && log.lastJobTriggered) {
        const puck = pucks.find(p => p.puckId === log.puckId);
        if (puck) {
          const key = `${puck.shade}-${puck.thickness}-${puck.materialId}`;
          usage[key] = (usage[key] || 0) + 1;
        }
      }
    });
    
    // Count current inventory levels
    const inventory: Record<string, number> = {};
    
    // Initialize inventory counter for all materials
    materials.forEach(material => {
      inventory[material] = 0;
    });
    
    // Count active pucks (in storage or in mill)
    pucks.forEach(puck => {
      if (puck.status !== 'retired') {
        const key = `${puck.shade}-${puck.thickness}-${puck.materialId}`;
        inventory[key] = (inventory[key] || 0) + 1;
      }
    });
    
    // Calculate recommendations and shortages
    return materials.map(material => {
      const [shade, thickness, materialIdStr] = material.split('-');
      const materialId = parseInt(materialIdStr, 10);
      const usedLast5Weeks = usage[material] || 0;
      const weeklyAverage = usedLast5Weeks / 5;
      const currentInventory = inventory[material] || 0;
      
      // Recommended inventory: 5 weeks of average usage
      const recommendedInventory = Math.ceil(weeklyAverage * 5);
      
      // Calculate shortage (how many pucks we're short of the recommended level)
      const shortage = recommendedInventory > currentInventory ? 
        recommendedInventory - currentInventory : 0;
      
      // Determine status
      let status: 'low' | 'ok' | 'excess' = 'ok';
      if (currentInventory < recommendedInventory * 0.7) {
        status = 'low';
      } else if (currentInventory > recommendedInventory * 1.3) {
        status = 'excess';
      }
      
      return {
        shade,
        thickness,
        materialId,
        usedLast5Weeks,
        weeklyAverage,
        currentInventory,
        recommendedInventory,
        shortage,
        status
      };
    }).filter(item => item.shortage > 0); // Only include materials with shortages
  }, [pucks, logs]);

  // Function to add suggested inventory to the order queue
  const addSuggestedInventory = () => {
    setIsAddingSuggested(true);
    
    // Get current highest puck ID to generate new IDs
    const highestId = pucks.reduce((max, p) => {
      const match = p.puckId.match(/PUCK-(\d+)/);
      if (!match) return max;
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }, 0);
    
    let idCounter = highestId + 1;
    let newPucks: Puck[] = [];
    
    // Create "placeholder" pucks for each shortage
    inventoryAnalysis.forEach(item => {
      // Find the material info
      const materialInfo = MATERIAL_LOOKUP.find(m => 
        m.shade === item.shade && 
        m.thickness === item.thickness && 
        m.materialId === item.materialId
      );
      
      if (!materialInfo) return;
      
      // Create placeholder pucks for the shortage quantity
      for (let i = 0; i < item.shortage; i++) {
        const newPuckId = `PUCK-${idCounter.toString().padStart(6, '0')}`;
        idCounter++;
        
        const newPuck: Puck = {
          puckId: newPuckId,
          shrinkageFactor: parseFloat((1.22 + Math.random() * 0.05).toFixed(4)),
          serialNumber: Math.floor(1000 + Math.random() * 9000),
          materialId: item.materialId,
          lotNumber: Math.floor(100000 + Math.random() * 900000),
          shade: item.shade,
          thickness: item.thickness,
          currentLocation: "suggested_order", // Special location to indicate this is a suggested addition
          screenshotUrl: '/puck_placeholder.png',
          status: 'retired', // Mark as retired so it shows in the order queue
        };
        
        newPucks.push(newPuck);
      }
    });
    
    // Add new pucks to the state
    setPucks([...pucks, ...newPucks]);
    setSuggestedAdded(true);
    setIsAddingSuggested(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      
      {/* Modal content */}
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-[600px] max-h-[80vh] flex flex-col">
        <h3 className="text-xl font-semibold border-b border-gray-700 pb-3">Used Puck Order Queue</h3>
        
        <div className="overflow-y-auto flex-grow mt-4">
          {/* Description of order process */}
          <div className="mb-4 p-3 bg-[#3D3D3D] rounded text-sm border-l-4 border-[#BB86FC]">
            <p>Orders will automatically be sent via API to Argen every Friday. If you need to place an order before Friday, you can manually submit the used pucks for reorder using the button below.</p>
          </div>
          
          {suggestedAdded && (
            <div className="mb-4 p-3 bg-[#2D3B2A] rounded text-sm border-l-4 border-green-600">
              <p>Suggested inventory has been added to the order queue based on inventory analysis.</p>
            </div>
          )}
          
          {orderSummary.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No used pucks in the queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary section */}
              <div className="bg-[#2D2D2D] rounded-md p-4">
                <h4 className="text-sm font-medium mb-3">Order Summary</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400">
                      <th className="pb-2">Shade</th>
                      <th className="pb-2">Thickness</th>
                      <th className="pb-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderSummary.map(({ shade, thickness, count }) => (
                      <tr key={`${shade}-${thickness}`} className="border-t border-gray-700">
                        <td className="py-2">{shade}</td>
                        <td className="py-2">{thickness}</td>
                        <td className="py-2 text-right">{count}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-700 font-medium">
                      <td className="py-2" colSpan={2}>Total</td>
                      <td className="py-2 text-right">
                        {orderSummary.reduce((sum, item) => sum + item.count, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Detailed list */}
              <div>
                <h4 className="text-sm font-medium mb-3">Detailed List</h4>
                <div className="space-y-3">
                  {orderSummary.map(({ shade, thickness, pucks }) => (
                    <div key={`${shade}-${thickness}`} className="bg-[#2D2D2D] rounded-md p-4">
                      <h5 className="text-sm font-medium mb-2">{shade} - {thickness}</h5>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-400">
                            <th className="pb-2">Puck ID</th>
                            <th className="pb-2">Material ID</th>
                            <th className="pb-2">Serial #</th>
                            <th className="pb-2">Lot #</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pucks.map(puck => (
                            <tr key={puck.puckId} className="border-t border-gray-700">
                              <td className="py-1.5">
                                {puck.currentLocation === "suggested_order" ? (
                                  <span className="flex items-center">
                                    {puck.puckId}
                                    <span className="ml-1 text-[10px] px-1 py-0.5 bg-green-900 text-green-300 rounded">suggested</span>
                                  </span>
                                ) : (
                                  puck.puckId
                                )}
                              </td>
                              <td className="py-1.5">{puck.materialId}</td>
                              <td className="py-1.5">{puck.serialNumber}</td>
                              <td className="py-1.5">{puck.lotNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-between">
          {/* Left side - Add suggested inventory button */}
          <div>
            {inventoryAnalysis.length > 0 && !suggestedAdded ? (
              <button
                onClick={addSuggestedInventory}
                disabled={isAddingSuggested}
                className={`px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-sm font-medium ${isAddingSuggested ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAddingSuggested ? 'Adding...' : `Add Suggested Inventory (${inventoryAnalysis.reduce((sum, item) => sum + item.shortage, 0)} pucks)`}
              </button>
            ) : null}
          </div>
          
          {/* Right side - Close and Submit buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
            >
              Close
            </button>
            {retiredPucks.length > 0 && (
              <button
                className="px-4 py-2 rounded bg-[#BB86FC] hover:brightness-110 text-sm font-medium"
              >
                Manual Submit Order to Argen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsedPuckOrderQueueModal; 