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
        isSelected ? 'ring-2 ring-cyan-400/70 shadow-[0_0_10px_#22D3EE]' : 'ring-0',
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
        className="w-full aspect-square object-cover rounded-md shadow-md mb-3"
      />

      {/* Bottom info row */}
      <div className="mt-auto flex justify-between items-end text-xs">
        {/* Shade & thickness (left) */}
        <div>
          <div className="text-lg font-bold leading-none">{puck.shade}</div>
          <div className="opacity-80">{puck.thickness}</div>
        </div>

        {/* Meta (right) */}
        <div className="text-right opacity-80 space-y-0.5">
          <div>Shr: {puck.shrinkageFactor.toFixed(2)}</div>
          <div>Lot: {puck.lotNumber}</div>
          <div>Ser: {puck.serialNumber}</div>
        </div>
      </div>
    </div>
  );
};

export default PuckCard; 