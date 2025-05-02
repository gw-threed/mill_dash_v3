import React, { useState, useEffect } from 'react';
import { useMillContext } from '../../context/MillContext';
import { useMillLogContext } from '../../context/MillLogContext';
import { usePuckContext } from '../../context/PuckContext';
import { analyzeAggregateMillPerformance, analyzeMaterialUsage, getDefaultStartDate, MillUtilization, MaterialUsage } from '../../utils/millAnalysis';

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const MillAnalysis: React.FC = () => {
  const { mills } = useMillContext();
  const { logs } = useMillLogContext();
  const { pucks } = usePuckContext();
  
  const [startDate, setStartDate] = useState<Date>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [millData, setMillData] = useState<MillUtilization[]>([]);
  const [materialData, setMaterialData] = useState<MaterialUsage[]>([]);
  const [activeTab, setActiveTab] = useState<'mills' | 'materials'>('mills');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refresh analysis data when date range changes
  const refreshAnalysis = () => {
    if (logs.length > 0 && mills.length > 0) {
      setIsLoading(true);
      
      // Perform analysis with the selected date range (aggregate, not by week)
      const millAnalysis = analyzeAggregateMillPerformance(logs, mills, startDate, endDate);
      setMillData(millAnalysis);
      
      // Analyze material usage with the selected date range
      const materials = analyzeMaterialUsage(logs, pucks, startDate, endDate);
      setMaterialData(materials);
      
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshAnalysis();
  }, [logs, mills, pucks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle date changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setStartDate(newDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setEndDate(newDate);
    }
  };

  // Apply date range
  const handleApplyDateRange = () => {
    refreshAnalysis();
  };

  // Reset to default 5 weeks
  const handleResetDateRange = () => {
    setStartDate(getDefaultStartDate());
    setEndDate(new Date());
    // Refresh analysis after state updates
    setTimeout(refreshAnalysis, 0);
  };

  if (isLoading) {
    return <div className="p-4">Loading analysis...</div>;
  }

  // Calculate the period duration in days
  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-4 bg-[#2D2D2D] rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">Mill Performance Analysis</h2>
      
      {/* Date range selector */}
      <div className="mb-6 p-3 bg-[#3D3D3D] rounded">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
              Start Date:
            </label>
            <input
              type="date"
              id="startDate"
              value={formatDateForInput(startDate)}
              onChange={handleStartDateChange}
              className="w-full p-2 border border-gray-600 bg-[#2D2D2D] text-white rounded-md"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
              End Date:
            </label>
            <input
              type="date"
              id="endDate"
              value={formatDateForInput(endDate)}
              onChange={handleEndDateChange}
              className="w-full p-2 border border-gray-600 bg-[#2D2D2D] text-white rounded-md"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyDateRange}
              className="px-4 py-2 bg-[#BB86FC] text-black font-medium rounded"
            >
              Apply
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleResetDateRange}
              className="px-4 py-2 bg-[#4D4D4D] text-white rounded"
            >
              Reset to Last 5 Weeks
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm">
          <p>
            Analyzing {daysDifference} days of data from{' '}
            <span className="font-medium">{startDate.toLocaleDateString()}</span> to{' '}
            <span className="font-medium">{endDate.toLocaleDateString()}</span>
          </p>
        </div>
      </div>
      
      {millData.length === 0 ? (
        <div className="text-gray-400">No data available for the selected period</div>
      ) : (
        <>
          {/* Tab selector */}
          <div className="flex mb-4 border-b border-gray-700">
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === 'mills' 
                  ? 'text-[#BB86FC] border-b-2 border-[#BB86FC]' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('mills')}
            >
              Mill Performance
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === 'materials' 
                  ? 'text-[#BB86FC] border-b-2 border-[#BB86FC]' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('materials')}
            >
              Material Usage
            </button>
          </div>

          {activeTab === 'mills' ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-[#2D2D2D]">
                  <thead className="bg-[#3D3D3D]">
                    <tr>
                      <th className="py-2 px-4 text-left text-gray-300">Mill</th>
                      <th className="py-2 px-4 text-left text-gray-300">Total Jobs</th>
                      <th className="py-2 px-4 text-left text-gray-300">Total Units</th>
                      <th className="py-2 px-4 text-left text-gray-300">Avg. Job Time</th>
                      <th className="py-2 px-4 text-left text-gray-300">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {millData.map((millItem) => (
                      <tr key={millItem.millId} className="border-t border-gray-700">
                        <td className="py-2 px-4">{millItem.millId}</td>
                        <td className="py-2 px-4">{millItem.totalJobs}</td>
                        <td className="py-2 px-4">{millItem.totalUnits}</td>
                        <td className="py-2 px-4">{millItem.avgJobTime.toFixed(1)} hours</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-700 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-[#BB86FC] h-2.5 rounded-full" 
                                style={{ width: `${millItem.utilization}%` }}
                              ></div>
                            </div>
                            <span>{millItem.utilization.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#3D3D3D] p-3 rounded">
                    <p className="font-medium text-gray-300">Most Used Mill:</p>
                    {millData.length > 0 && (
                      <p>
                        {millData.reduce((prev, current) => 
                          (prev.totalJobs > current.totalJobs) ? prev : current
                        ).millId}
                        {' '}
                        ({millData.reduce((prev, current) => 
                          (prev.totalJobs > current.totalJobs) ? prev : current
                        ).totalJobs} jobs)
                      </p>
                    )}
                  </div>
                  <div className="bg-[#3D3D3D] p-3 rounded">
                    <p className="font-medium text-gray-300">Highest Utilization:</p>
                    {millData.length > 0 && (
                      <p>
                        {millData.reduce((prev, current) => 
                          (prev.utilization > current.utilization) ? prev : current
                        ).millId}
                        {' '}
                        ({millData.reduce((prev, current) => 
                          (prev.utilization > current.utilization) ? prev : current
                        ).utilization.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                  <div className="bg-[#3D3D3D] p-3 rounded">
                    <p className="font-medium text-gray-300">Total Units Produced:</p>
                    <p>{millData.reduce((sum, mill) => sum + mill.totalUnits, 0)}</p>
                  </div>
                  <div className="bg-[#3D3D3D] p-3 rounded">
                    <p className="font-medium text-gray-300">Average Utilization:</p>
                    <p>
                      {millData.length > 0
                        ? (millData.reduce((sum, mill) => sum + mill.utilization, 0) / millData.length).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <h3 className="text-lg font-semibold mb-3">Material Usage Analysis</h3>
              
              {materialData.length === 0 ? (
                <p className="text-gray-400">No material usage data available for the selected period</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-[#2D2D2D]">
                      <thead className="bg-[#3D3D3D]">
                        <tr>
                          <th className="py-2 px-4 text-left text-gray-300">Material</th>
                          <th className="py-2 px-4 text-left text-gray-300">Thickness</th>
                          <th className="py-2 px-4 text-left text-gray-300">Jobs</th>
                          <th className="py-2 px-4 text-left text-gray-300">Units</th>
                          <th className="py-2 px-4 text-left text-gray-300">Pucks Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialData.map((material, index) => (
                          <tr key={`${material.shade}-${material.thickness}-${index}`} className="border-t border-gray-700">
                            <td className="py-2 px-4">{material.shade}</td>
                            <td className="py-2 px-4">{material.thickness}</td>
                            <td className="py-2 px-4">{material.totalJobs}</td>
                            <td className="py-2 px-4">{material.totalUnits}</td>
                            <td className="py-2 px-4">{material.pucksUsed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-2">Most Used Materials</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {materialData.slice(0, 4).map((material, index) => (
                        <div key={`top-${index}`} className="bg-[#3D3D3D] p-3 rounded">
                          <p className="font-medium text-[#BB86FC]">{material.shade} {material.thickness}</p>
                          <p className="text-sm text-gray-300 mt-1">{material.totalJobs} jobs, {material.totalUnits} units</p>
                          <p className="text-sm mt-1">{material.pucksUsed} pucks used</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MillAnalysis; 