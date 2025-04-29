import React, { useState, useMemo } from 'react';
import { useMillLogContext } from '../../context/MillLogContext';
import { useMillContext } from '../../context/MillContext';
import { usePuckContext } from '../../context/PuckContext';
import { MillLogEntry } from '../../types';
import ConfirmFitModal from './ConfirmFitModal';

interface Props {
  onClose: () => void;
}

const MillLogModal: React.FC<Props> = ({ onClose }) => {
  const { logs } = useMillLogContext();
  const { mills } = useMillContext();
  const { pucks } = usePuckContext();
  
  const [query, setQuery] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MillLogEntry | null>(null);

  // Helper to check if a date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const filtered: MillLogEntry[] = useMemo(() => {
    if (!query.trim()) return logs.slice().reverse(); // newest first
    const q = query.toLowerCase();
    return logs
      .filter((log) => {
        return (
          log.puckId.toLowerCase().includes(q) ||
          log.caseIds.some((cid) => cid.toLowerCase().includes(q)) ||
          (log.technicianName && log.technicianName.toLowerCase().includes(q)) ||
          log.newPuckId?.toLowerCase().includes(q)
        );
      })
      .slice()
      .reverse();
  }, [logs, query]);

  const handleReassignClick = (log: MillLogEntry) => {
    setSelectedLog(log);
    setShowReassignModal(true);
  };
  
  const handleReassignmentComplete = () => {
    setShowReassignModal(false);
    setSelectedLog(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto animate-modal-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Mill Log ({logs.length})</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 bg-gray-600 rounded">Close</button>
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
              {filtered.map((log) => {
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