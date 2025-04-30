import React, { useMemo } from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useMillLogContext } from '../../context/MillLogContext';
import { MATERIAL_LOOKUP } from '../../data/seed';
import { MillLogEntry } from '../../types';

interface Props {
  onClose: () => void;
}

// Interface for material usage data
interface MaterialUsage {
  shade: string;
  thickness: string;
  materialId: number;
  usedLast5Weeks: number;
  weeklyAverage: number;
  currentInventory: number;
  recommendedInventory: number;
  status: 'low' | 'ok' | 'excess';
}

const InventoryAnalysisModal: React.FC<Props> = ({ onClose }) => {
  const { pucks } = usePuckContext();
  const { logs } = useMillLogContext();
  
  // Calculate usage statistics and inventory recommendations
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
    logs.forEach((log: MillLogEntry) => {
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
    
    // Calculate recommendations based on usage
    return materials.map(material => {
      const [shade, thickness, materialIdStr] = material.split('-');
      const materialId = parseInt(materialIdStr, 10);
      const usedLast5Weeks = usage[material] || 0;
      const weeklyAverage = usedLast5Weeks / 5;
      const currentInventory = inventory[material] || 0;
      
      // Recommended inventory: 5 weeks of average usage
      const recommendedInventory = Math.ceil(weeklyAverage * 5);
      
      // Determine status (low, ok, excess)
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
        status
      };
    }).filter(item => item.usedLast5Weeks > 0 || item.currentInventory > 0); // Only show materials with some usage or inventory
  }, [pucks, logs]);
  
  // Sort by status (low first, then ok, then excess)
  const sortedAnalysis = useMemo(() => {
    return [...inventoryAnalysis].sort((a, b) => {
      const statusPriority = { 'low': 0, 'ok': 1, 'excess': 2 };
      return statusPriority[a.status] - statusPriority[b.status];
    });
  }, [inventoryAnalysis]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      
      {/* Modal content */}
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-[800px] max-h-[80vh] flex flex-col">
        <h3 className="text-xl font-semibold border-b border-gray-700 pb-3">Inventory Analysis</h3>
        
        <div className="overflow-y-auto flex-grow mt-4">
          {/* Description */}
          <div className="mb-4 p-3 bg-[#3D3D3D] rounded text-sm border-l-4 border-[#BB86FC]">
            <p>This analysis shows usage trends for the last 5 weeks and recommends inventory levels based on 5 weeks of usage coverage. Materials with low inventory are highlighted in red.</p>
          </div>
          
          {sortedAnalysis.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No usage data available for analysis.</p>
            </div>
          ) : (
            <div className="bg-[#2D2D2D] rounded-md p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3 pt-1">Material</th>
                    <th className="pb-3 pt-1">Shade</th>
                    <th className="pb-3 pt-1">Thickness</th>
                    <th className="pb-3 pt-1 text-right">Used<br/>(5 wks)</th>
                    <th className="pb-3 pt-1 text-right">Avg<br/>Weekly</th>
                    <th className="pb-3 pt-1 text-right">Current<br/>Stock</th>
                    <th className="pb-3 pt-1 text-right">Recommended<br/>Stock</th>
                    <th className="pb-3 pt-1 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAnalysis.map((item) => (
                    <tr 
                      key={`${item.shade}-${item.thickness}-${item.materialId}`}
                      className={`border-b border-gray-700 ${
                        item.status === 'low' ? 'bg-[#3D1E20]' : 
                        item.status === 'excess' ? 'bg-[#1D3B2A]' : ''
                      }`}
                    >
                      <td className="py-3">{item.materialId}</td>
                      <td className="py-3">{item.shade}</td>
                      <td className="py-3">{item.thickness}</td>
                      <td className="py-3 text-right">{item.usedLast5Weeks}</td>
                      <td className="py-3 text-right">{item.weeklyAverage.toFixed(1)}</td>
                      <td className="py-3 text-right">{item.currentInventory}</td>
                      <td className="py-3 text-right">{item.recommendedInventory}</td>
                      <td className="py-3 text-center">
                        {item.status === 'low' ? (
                          <span className="inline-flex items-center gap-1 text-red-400">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Low
                          </span>
                        ) : item.status === 'excess' ? (
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Excess
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-400">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Summary stats */}
          {sortedAnalysis.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-[#3D1E20] rounded-md p-3 flex flex-col items-center justify-center border border-red-800">
                <span className="text-xs text-gray-300">Low Stock Items</span>
                <span className="text-2xl font-bold text-red-400 mt-1">
                  {sortedAnalysis.filter(item => item.status === 'low').length}
                </span>
              </div>
              <div className="bg-[#2D2D3D] rounded-md p-3 flex flex-col items-center justify-center border border-yellow-800">
                <span className="text-xs text-gray-300">Adequate Stock Items</span>
                <span className="text-2xl font-bold text-yellow-400 mt-1">
                  {sortedAnalysis.filter(item => item.status === 'ok').length}
                </span>
              </div>
              <div className="bg-[#1D3B2A] rounded-md p-3 flex flex-col items-center justify-center border border-green-800">
                <span className="text-xs text-gray-300">Excess Stock Items</span>
                <span className="text-2xl font-bold text-green-400 mt-1">
                  {sortedAnalysis.filter(item => item.status === 'excess').length}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
          >
            Close
          </button>
          <button
            className="px-4 py-2 rounded bg-[#BB86FC] hover:brightness-110 text-sm font-medium"
          >
            Export Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalysisModal; 