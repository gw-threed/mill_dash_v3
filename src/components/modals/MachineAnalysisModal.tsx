import React, { useMemo, useState } from 'react';
import { useMillLogContext } from '../../context/MillLogContext';
import { useMillContext } from '../../context/MillContext';
import { useCaseContext } from '../../context/CaseContext';
import MillAnalysis from '../mills/MillAnalysis';

interface Props {
  onClose: () => void;
}

// Machine stats interface
interface MachineStats {
  millId: string;
  pucksUsed: number;
  unitsMilled: number;
  casesCompleted: number;
  materialCounts: Record<string, number>; // shade-thickness -> count
}

// Analysis view types
type AnalysisView = 'overall' | 'custom';

const MachineAnalysisModal: React.FC<Props> = ({ onClose }) => {
  const { logs } = useMillLogContext();
  const { mills } = useMillContext();
  const { cases } = useCaseContext();
  const [analysisView, setAnalysisView] = useState<AnalysisView>('overall');
  
  // Calculate machine statistics
  const machineStats = useMemo(() => {
    // Initialize stats for each mill
    const stats: Record<string, MachineStats> = {};
    
    mills.forEach(mill => {
      stats[mill.id] = {
        millId: mill.id,
        pucksUsed: 0,
        unitsMilled: 0,
        casesCompleted: 0,
        materialCounts: {}
      };
    });
    
    // Process logs to calculate metrics
    logs.forEach(log => {
      // If this is a log entry where a puck was moved to a mill
      if (log.newLocation.includes('mill') && !log.lastJobTriggered) {
        const millId = log.newLocation.split('-')[0]; // Extract mill ID from location
        
        if (stats[millId]) {
          // Increment puck count
          stats[millId].pucksUsed++;
          
          // Count units and cases
          if (log.caseIds && log.caseIds.length > 0) {
            // Find cases for this log entry
            const relatedCases = cases.filter(c => log.caseIds.includes(c.caseId));
            
            // Count units
            relatedCases.forEach(c => {
              stats[millId].unitsMilled += c.units;
            });
            
            // Count unique cases
            stats[millId].casesCompleted += relatedCases.length;
            
            // Check for material type if available in caseIds
            relatedCases.forEach(c => {
              // Use shade as the material identifier
              const materialKey = c.shade;
              stats[millId].materialCounts[materialKey] = 
                (stats[millId].materialCounts[materialKey] || 0) + 1;
            });
          }
        }
      }
    });
    
    return Object.values(stats);
  }, [logs, mills, cases]);
  
  // Calculate totals
  const totals = useMemo(() => {
    return machineStats.reduce((acc, stat) => {
      return {
        pucksUsed: acc.pucksUsed + stat.pucksUsed,
        unitsMilled: acc.unitsMilled + stat.unitsMilled,
        casesCompleted: acc.casesCompleted + stat.casesCompleted
      };
    }, { pucksUsed: 0, unitsMilled: 0, casesCompleted: 0 });
  }, [machineStats]);
  
  // Sort stats by units milled (highest first)
  const sortedStats = useMemo(() => {
    return [...machineStats].sort((a, b) => b.unitsMilled - a.unitsMilled);
  }, [machineStats]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      
      {/* Modal content */}
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-[900px] max-h-[85vh] flex flex-col">
        <h3 className="text-xl font-semibold border-b border-gray-700 pb-3">Machine Analysis</h3>
        
        {/* View selector */}
        <div className="flex gap-3 mt-4 mb-3">
          <button
            onClick={() => setAnalysisView('overall')}
            className={`px-4 py-2 rounded text-sm ${
              analysisView === 'overall' 
                ? 'bg-[#BB86FC] text-black font-medium' 
                : 'bg-[#3D3D3D] hover:bg-[#4D4D4D]'
            }`}
          >
            Overall Stats
          </button>
          <button
            onClick={() => setAnalysisView('custom')}
            className={`px-4 py-2 rounded text-sm ${
              analysisView === 'custom' 
                ? 'bg-[#BB86FC] text-black font-medium' 
                : 'bg-[#3D3D3D] hover:bg-[#4D4D4D]'
            }`}
          >
            Custom Date Range Analysis
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {analysisView === 'overall' ? (
            <>
              {/* Description */}
              <div className="mb-4 p-3 bg-[#3D3D3D] rounded text-sm border-l-4 border-[#BB86FC]">
                <p>This analysis shows the total units milled and pucks used by each machine.</p>
              </div>
              
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#2D2D3D] rounded-md p-4 flex flex-col items-center justify-center border border-[#BB86FC]">
                  <span className="text-xs text-gray-300">Total Units Milled</span>
                  <span className="text-2xl font-bold text-[#BB86FC] mt-1">
                    {totals.unitsMilled}
                  </span>
                </div>
                <div className="bg-[#2D2D3D] rounded-md p-4 flex flex-col items-center justify-center border border-[#BB86FC]">
                  <span className="text-xs text-gray-300">Total Pucks Used</span>
                  <span className="text-2xl font-bold text-[#BB86FC] mt-1">
                    {totals.pucksUsed}
                  </span>
                </div>
                <div className="bg-[#2D2D3D] rounded-md p-4 flex flex-col items-center justify-center border border-[#BB86FC]">
                  <span className="text-xs text-gray-300">Total Cases Completed</span>
                  <span className="text-2xl font-bold text-[#BB86FC] mt-1">
                    {totals.casesCompleted}
                  </span>
                </div>
              </div>
              
              {/* Machine stats table */}
              <div className="bg-[#2D2D2D] rounded-md p-4">
                <h4 className="text-sm font-medium mb-3">Machine Performance</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3 pt-1">Machine ID</th>
                      <th className="pb-3 pt-1 text-right">Units Milled</th>
                      <th className="pb-3 pt-1 text-right">Pucks Used</th>
                      <th className="pb-3 pt-1 text-right">Cases Completed</th>
                      <th className="pb-3 pt-1 text-right">Units/Puck</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStats.map(stat => (
                      <tr key={stat.millId} className="border-b border-gray-700">
                        <td className="py-3">{stat.millId}</td>
                        <td className="py-3 text-right">{stat.unitsMilled}</td>
                        <td className="py-3 text-right">{stat.pucksUsed}</td>
                        <td className="py-3 text-right">{stat.casesCompleted}</td>
                        <td className="py-3 text-right">
                          {stat.pucksUsed > 0 
                            ? (stat.unitsMilled / stat.pucksUsed).toFixed(1) 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Material distribution section */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-3">Material Distribution by Machine</h4>
                <div className="space-y-4">
                  {sortedStats.map(stat => (
                    <div key={`materials-${stat.millId}`} className="bg-[#2D2D2D] rounded-md p-4">
                      <h5 className="text-sm font-medium mb-2">{stat.millId}</h5>
                      {Object.keys(stat.materialCounts).length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(stat.materialCounts).map(([material, count]) => (
                            <div key={`${stat.millId}-${material}`} className="bg-[#3D3D3D] p-2 rounded text-center">
                              <div className="text-xs text-gray-300">{material}</div>
                              <div className="font-medium">{count}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No material data available</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#2D2D2D] rounded-md p-4">
              <div className="mb-4 p-3 bg-[#3D3D3D] rounded text-sm border-l-4 border-[#BB86FC]">
                <p>Analyze mill performance over a custom date range. Use the date selectors to define your analysis period.</p>
              </div>
              
              {/* Render the custom date range analysis */}
              <div className="mt-4">
                <MillAnalysis />
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

export default MachineAnalysisModal; 