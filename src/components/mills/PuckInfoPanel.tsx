import React from 'react';
import { Puck } from '../../types';
import placeholderImg from '../../assets/puck_placeholder.png';

interface Props {
  puck: Puck;
  onClose: () => void;
}

const PuckInfoPanel: React.FC<Props> = ({ puck, onClose }) => {
  return (
    <div className="w-64 bg-[#2D2D2D] p-4 rounded sticky top-0 h-fit">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">Puck {puck.puckId}</h4>
        <button onClick={onClose} className="text-xs bg-gray-600 px-2 py-0.5 rounded">X</button>
      </div>
      <p className="text-xs opacity-80 mb-1">Shade: {puck.shade}</p>
      <p className="text-xs opacity-80 mb-1">Thickness: {puck.thickness}</p>
      <p className="text-xs opacity-80 mb-1">Shrink: {puck.shrinkageFactor.toFixed(4)}</p>
      <p className="text-xs opacity-80 mb-1">Lot: {puck.lotNumber}</p>
      <img
        src={puck.screenshotUrl === '/puck_placeholder.png' ? placeholderImg : puck.screenshotUrl}
        alt="screenshot"
        className="mt-2 w-full h-40 object-contain border border-gray-600 rounded"
      />
    </div>
  );
};

export default PuckInfoPanel; 