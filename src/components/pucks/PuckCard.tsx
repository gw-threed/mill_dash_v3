import React from 'react';
import clsx from 'clsx';
import { Puck } from '../../types';
import placeholderImg from '../../assets/puck_placeholder.png';

interface Props {
  puck: Puck;
  isSelected: boolean;
  onSelect: (puckId: string) => void;
}

const PuckCard: React.FC<Props> = ({ puck, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(puck.puckId)}
      className={clsx(
        'cursor-pointer bg-[#1E1E1E] text-white rounded-md p-3 shadow transition transform hover:-translate-y-0.5 hover:shadow-lg',
        isSelected ? 'border-2 border-[#BB86FC]' : 'border border-transparent',
      )}
    >
      {puck.status === 'in_mill' && (
        <span className="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] px-1 rounded">In Mill</span>
      )}
      <div className="flex flex-col items-center mb-3">
        <img
          src={puck.screenshotUrl === '/puck_placeholder.png' ? placeholderImg : puck.screenshotUrl}
          alt="puck screenshot"
          className="w-32 h-32 object-cover rounded-md shadow-md mb-2"
        />
        <div className="text-center">
          <div className="text-xl font-bold">{puck.shade}</div>
          <div className="text-sm opacity-80">{puck.thickness}</div>
        </div>
      </div>
      <div className="text-xs opacity-80 space-y-1">
        <div>Loc: {puck.currentLocation}</div>
        <div>Shrink: {puck.shrinkageFactor.toFixed(4)}</div>
        <div>Lot: {puck.lotNumber}</div>
        <div>Serial: {puck.serialNumber}</div>
      </div>
    </div>
  );
};

export default PuckCard; 