import React, { useState, useMemo } from 'react';
import { useMillLogContext } from '../../context/MillLogContext';
import { MillLogEntry } from '../../types';

interface Props {
  onClose: () => void;
}

const MillLogModal: React.FC<Props> = ({ onClose }) => {
  const { logs } = useMillLogContext();
  const [query, setQuery] = useState('');

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
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center opacity-60">
                    No log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MillLogModal; 