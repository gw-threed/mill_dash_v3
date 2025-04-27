import React from 'react';
import StorageGrid from '../storage/StorageGrid';

interface Props {
  onClose: () => void;
}

const ViewStorageModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Storage Rack View</h3>
          <button onClick={onClose} className="text-sm px-3 py-1 bg-gray-600 rounded">Close</button>
        </div>
        <StorageGrid />
      </div>
    </div>
  );
};

export default ViewStorageModal; 