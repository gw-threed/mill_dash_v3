import React, { useState, useMemo } from 'react';
import { useMillLogContext } from '../../context/MillLogContext';
import { useMillContext } from '../../context/MillContext';
import { usePuckContext } from '../../context/PuckContext';
import { useStorageContext } from '../../context/StorageContext';
import { MillLogEntry } from '../../types';
import RelocationModal from './RelocationModal';

interface Props {
  onClose: () => void;
}

const MillLogModal: React.FC<Props> = ({ onClose }) => {
  const { logs, addRelocationLogEntry } = useMillLogContext();
  const { mills, occupyMillSlot, clearMillSlot } = useMillContext();
  const { movePuck, updatePuckStatus, pucks } = usePuckContext();
  const { findFirstAvailableSlot, clearSlot, occupySlot } = useStorageContext();
  
  const [query, setQuery] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [selectedNewMill, setSelectedNewMill] = useState<string>('');
  const [selectedNewSlot, setSelectedNewSlot] = useState<string>('');
  const [showRelocation, setShowRelocation] = useState(false);
  const [relocationInfo, setRelocationInfo] = useState<{
    puckToMove: string;
    fromLocation: string;
    toMill: string;
    toSlot: string;
    displacedPuckId: string | null;
  } | null>(null);

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

  const handleEditClick = (logId: string) => {
    setEditingLogId(logId);
    setSelectedNewMill('');
    setSelectedNewSlot('');
  };

  const handleSaveReallocation = (log: MillLogEntry) => {
    if (!selectedNewMill || !selectedNewSlot) return;
    
    // Get old location details
    const [oldMillId, oldSlotName] = log.newLocation.split('/');
    
    // New location string
    const newLocation = `${selectedNewMill}/${selectedNewSlot}`;
    
    // Check if the selected slot is already occupied by a different puck
    const selectedMill = mills.find(m => m.id === selectedNewMill);
    const selectedSlot = selectedMill?.slots.find(s => s.slotName === selectedNewSlot);
    
    if (selectedSlot?.occupied && selectedSlot.puckId !== log.puckId) {
      // We need to show the relocation modal
      setRelocationInfo({
        puckToMove: log.puckId,
        fromLocation: log.newLocation,
        toMill: selectedNewMill,
        toSlot: selectedNewSlot,
        displacedPuckId: selectedSlot.puckId
      });
      setShowRelocation(true);
      return;
    }
    
    // If slot not occupied or occupied by same puck, proceed normally
    completeReallocation(log, oldMillId, oldSlotName, newLocation);
  };

  const completeReallocation = (log: MillLogEntry, oldMillId: string, oldSlotName: string, newLocation: string) => {
    // Add a new relocation log entry instead of updating the existing one
    addRelocationLogEntry(
      log.logId,
      log.puckId,
      log.newLocation, // Previous location is the current location
      newLocation,     // New location
      log.caseIds      // Same case IDs
    );
    
    // Clear old mill slot
    clearMillSlot(oldMillId, oldSlotName);
    
    // Occupy new mill slot
    const [newMillId, newSlotName] = newLocation.split('/');
    occupyMillSlot(newMillId, newSlotName, log.puckId);
    
    // Update puck location
    movePuck(log.puckId, newLocation);
    
    // Reset edit state
    setEditingLogId(null);
  };

  const handleRelocationConfirm = () => {
    if (!relocationInfo) return;
    
    const { puckToMove, fromLocation, toMill, toSlot, displacedPuckId } = relocationInfo;
    
    if (displacedPuckId) {
      // 1. Find a storage slot for the displaced puck
      const vacantSlot = findFirstAvailableSlot();
      if (!vacantSlot) {
        alert('No vacant storage slots available!');
        return;
      }
      
      // 2. Move the displaced puck to storage
      movePuck(displacedPuckId, vacantSlot.fullLocation);
      updatePuckStatus(displacedPuckId, 'in_storage');
      occupySlot(vacantSlot.fullLocation, displacedPuckId);
      
      // 3. Log the relocation of the displaced puck
      const displacedLog = logs.find(l => l.puckId === displacedPuckId && l.newLocation === `${toMill}/${toSlot}`);
      if (displacedLog) {
        addRelocationLogEntry(
          displacedLog.logId,
          displacedPuckId,
          `${toMill}/${toSlot}`,
          vacantSlot.fullLocation,
          displacedLog.caseIds
        );
      }
    }
    
    // 4. Process the original reallocation
    const [oldMillId, oldSlotName] = fromLocation.split('/');
    const newLocation = `${toMill}/${toSlot}`;
    
    const log = logs.find(l => l.puckId === puckToMove && l.newLocation === fromLocation);
    if (log) {
      completeReallocation(log, oldMillId, oldSlotName, newLocation);
    }
    
    // Reset state
    setShowRelocation(false);
    setRelocationInfo(null);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setSelectedNewMill('');
    setSelectedNewSlot('');
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
                const isEditing = editingLogId === log.logId;

                return (
                  <tr key={log.logId} className="odd:bg-[#1E1E1E] even:bg-[#2A2A2A]">
                    <td className="p-2 border border-gray-700 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2 border border-gray-700 whitespace-nowrap">{log.puckId}</td>
                    <td className="p-2 border border-gray-700">{log.previousLocation}</td>
                    <td className="p-2 border border-gray-700">
                      {isEditing ? (
                        <div className="flex flex-col space-y-2">
                          <select 
                            value={selectedNewMill}
                            onChange={(e) => {
                              setSelectedNewMill(e.target.value);
                              setSelectedNewSlot('');
                            }}
                            className="bg-[#3D3D3D] text-white p-1 rounded text-xs border border-gray-600"
                          >
                            <option value="">Select Mill</option>
                            {mills.map((mill) => (
                              <option key={mill.id} value={mill.id}>
                                {mill.id} ({mill.model})
                              </option>
                            ))}
                          </select>
                          
                          {selectedNewMill && (
                            <select 
                              value={selectedNewSlot}
                              onChange={(e) => setSelectedNewSlot(e.target.value)}
                              className="bg-[#3D3D3D] text-white p-1 rounded text-xs border border-gray-600"
                            >
                              <option value="">Select Slot</option>
                              {mills
                                .find(m => m.id === selectedNewMill)
                                ?.slots
                                .map((slot) => (
                                  <option key={slot.slotName} value={slot.slotName}>
                                    Slot {slot.slotName} {slot.occupied && slot.puckId !== log.puckId ? `(Occupied by ${slot.puckId})` : ''}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        log.newLocation
                      )}
                    </td>
                    <td className="p-2 border border-gray-700 max-w-xs truncate" title={log.caseIds.join(', ')}>
                      {log.caseIds.join(', ')}
                    </td>
                    <td className="p-2 border border-gray-700">{log.technicianName || '-'}</td>
                    <td className="p-2 border border-gray-700 text-center">{log.lastJobTriggered ? '✅' : ''}</td>
                    <td className="p-2 border border-gray-700">{log.notes || '-'}</td>
                    <td className="p-2 border border-gray-700 text-center">
                      {isEditing ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleSaveReallocation(log)}
                            disabled={!selectedNewMill || !selectedNewSlot}
                            className={`text-xs px-2 py-1 rounded ${
                              !selectedNewMill || !selectedNewSlot ? 
                              'bg-gray-700 opacity-50 cursor-not-allowed' : 
                              'bg-green-600 hover:bg-green-500'
                            }`}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        isTodaysJob && log.newLocation.includes('/') && (
                          <button
                            onClick={() => handleEditClick(log.logId)}
                            className="text-xs px-2 py-1 rounded bg-[#BB86FC] hover:brightness-110"
                          >
                            Reassign
                          </button>
                        )
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
      
      {/* Relocation Modal */}
      {showRelocation && relocationInfo && (
        <RelocationModal
          selectedPuckId={relocationInfo.puckToMove}
          selectedPuckLoc={relocationInfo.fromLocation}
          millId={relocationInfo.toMill}
          slotName={relocationInfo.toSlot}
          occupiedPuckId={relocationInfo.displacedPuckId || undefined}
          occupiedShade={
            relocationInfo.displacedPuckId 
              ? pucks.find(p => p.puckId === relocationInfo.displacedPuckId)?.shade 
              : undefined
          }
          vacantSlot={findFirstAvailableSlot()?.fullLocation}
          onConfirm={handleRelocationConfirm}
          onCancel={() => {
            setShowRelocation(false);
            setRelocationInfo(null);
          }}
        />
      )}
    </div>
  );
};

export default MillLogModal; 