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
  const locationLabel = puck.currentLocation.includes('/') ? `Mill: ${puck.currentLocation}` : `Storage: ${puck.currentLocation}`;
  const locationColor = puck.currentLocation.includes('/') ? 'bg-yellow-500 text-black' : 'bg-green-600';

  return (
    <div
      onClick={() => onSelect(puck.puckId)}
      className={clsx(
        'relative cursor-pointer bg-[#1E1E1E] text-white rounded-md p-4 shadow transition transform hover:-translate-y-0.5 hover:shadow-lg flex flex-col',
        isSelected ? 'border-2 border-[#BB86FC]' : 'border border-transparent',
      )}
    >
      {/* Location Badge */}
      <span
        className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold ${locationColor}`}
      >
        {locationLabel}
      </span>

      {/* Thumbnail */}
      <img
        src={puck.screenshotUrl === '/puck_placeholder.png' ? placeholderImg : puck.screenshotUrl}
        alt="puck thumbnail"
        className="w-full h-32 object-cover rounded-md shadow-md mb-3"
      />

      {/* Shade & Thickness */}
      <div className="text-center mb-3">
        <div className="text-xl font-bold">{puck.shade}</div>
        <div className="text-sm opacity-80">{puck.thickness}</div>
      </div>

      {/* Meta */}
      <div className="text-xs opacity-80 space-y-1 mt-auto">
        <div>Shrink: {puck.shrinkageFactor.toFixed(4)}</div>
        <div>Lot: {puck.lotNumber}</div>
        <div>Serial: {puck.serialNumber}</div>
      </div>
    </div>
  );
};

export default PuckCard; 