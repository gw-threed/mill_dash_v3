import React, { useState, useMemo } from 'react';
import { useMillLogContext } from '../../context/MillLogContext';
import { useMillContext } from '../../context/MillContext';
import { usePuckContext } from '../../context/PuckContext';
import { useCaseContext } from '../../context/CaseContext';
import { MillLogEntry } from '../../types';
import ConfirmFitModal from './ConfirmFitModal';
import { generateAdditionalCases } from '../../data/seed';

interface Props {
  onClose: () => void;
}

const ITEMS_PER_PAGE = 20;

const MillLogModal: React.FC<Props> = ({ onClose }) => {
  const { logs } = useMillLogContext();
  const { mills } = useMillContext();
  const { pucks } = usePuckContext();
  const { addCases } = useCaseContext();
  
  const [query, setQuery] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MillLogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to check if a date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const filtered: MillLogEntry[] = useMemo(() => {
    // Get filtered logs based on query
    let result = !query.trim() 
      ? [...logs] 
      : logs.filter((log) => {
          const q = query.toLowerCase();
          return (
            log.puckId.toLowerCase().includes(q) ||
            log.caseIds.some((cid) => cid.toLowerCase().includes(q)) ||
            (log.technicianName && log.technicianName.toLowerCase().includes(q)) ||
            log.newPuckId?.toLowerCase().includes(q)
          );
        });
    
    // Sort by timestamp (newest first)
    return result.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [logs, query]);

  // Calculate pagination info
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  
  // Ensure currentPage is in valid range when filtered results change
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  
  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleReassignClick = (log: MillLogEntry) => {
    setSelectedLog(log);
    setShowReassignModal(true);
  };
  
  const handleReassignmentComplete = () => {
    setShowReassignModal(false);
    setSelectedLog(null);
  };
  
  const handleAddMockCases = () => {
    const newCases = generateAdditionalCases();
    addCases(newCases);
    alert(`Added ${newCases.length} new mock cases`);
  };
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto animate-modal-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Mill Log ({logs.length})</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleAddMockCases}
              className="text-sm px-3 py-1 bg-[#BB86FC] rounded"
            >
              Add 30 Mock Cases
            </button>
            <button onClick={onClose} className="text-sm px-3 py-1 bg-gray-600 rounded">Close</button>
          </div>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by puck, case, technician..."
          className="w-full mb-4 px-3 py-2 rounded bg-[#2D2D2D] border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
        />

        <div className="overflow-x-auto text-xs">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#2D2D2D]">
                <th className="p-2 border border-gray-700">Time</th>
                <th className="p-2 border border-gray-700">Puck</th>
                <th className="p-2 border border-gray-700">From</th>
                <th className="p-2 border border-gray-700">To</th>
                <th className="p-2 border border-gray-700">Cases</th>
                <th className="p-2 border border-gray-700">Tech</th>
                <th className="p-2 border border-gray-700">Last Job</th>
                <th className="p-2 border border-gray-700">Notes</th>
                <th className="p-2 border border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((log) => {
                const isTodaysJob = isToday(log.timestamp);

                return (
                  <tr key={log.logId} className="odd:bg-[#1E1E1E] even:bg-[#2A2A2A]">
                    <td className="p-2 border border-gray-700 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2 border border-gray-700 whitespace-nowrap">{log.puckId}</td>
                    <td className="p-2 border border-gray-700">{log.previousLocation}</td>
                    <td className="p-2 border border-gray-700">{log.newLocation}</td>
                    <td className="p-2 border border-gray-700 max-w-xs truncate" title={log.caseIds.join(', ')}>
                      {log.caseIds.join(', ')}
                    </td>
                    <td className="p-2 border border-gray-700">{log.technicianName || '-'}</td>
                    <td className="p-2 border border-gray-700 text-center">{log.lastJobTriggered ? '✅' : ''}</td>
                    <td className="p-2 border border-gray-700">{log.notes || '-'}</td>
                    <td className="p-2 border border-gray-700 text-center">
                      {isTodaysJob && log.newLocation.includes('/') && (
                        <button
                          onClick={() => handleReassignClick(log)}
                          className="text-xs px-2 py-1 rounded bg-[#BB86FC] hover:brightness-110"
                        >
                          Reassign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center opacity-60">
                    No log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400">
              Showing {Math.min(filtered.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filtered.length, currentPage * ITEMS_PER_PAGE)} of {filtered.length} entries
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs bg-[#2D2D2D] hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs bg-[#2D2D2D] hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="px-2 py-1 text-xs bg-[#3D3D3D] rounded">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs bg-[#2D2D2D] hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs bg-[#2D2D2D] hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirm Fit Modal for reassignment */}
      {showReassignModal && selectedLog && (
        <ConfirmFitModal
          caseIds={selectedLog.caseIds}
          puckId={selectedLog.puckId}
          onClose={() => setShowReassignModal(false)}
          isReassignment={true}
          originalLocation={selectedLog.newLocation}
          onReassignmentComplete={handleReassignmentComplete}
        />
      )}
    </div>
  );
};

export default MillLogModal; 