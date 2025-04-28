import React, { useState } from 'react';
import StorageGrid from '../storage/StorageGrid';
import SlotInfoPanel from '../storage/SlotInfoPanel';
import { Puck } from '../../types';

interface Props {
  onClose: () => void;
}

const ViewStorageModal: React.FC<Props> = ({ onClose }) => {
  const [selectedPuck, setSelectedPuck] = useState<Puck | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-surface text-textPrimary rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto animate-modal-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Storage Rack View</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 bg-gray-600 rounded">Close</button>
        </div>
        <div className="flex gap-4">
          <StorageGrid onSlotClick={(puck)=>setSelectedPuck(puck)} />
          {selectedPuck && <SlotInfoPanel puck={selectedPuck} onClose={()=>setSelectedPuck(null)} />}
        </div>
      </div>
    </div>
  );
};

export default ViewStorageModal; 