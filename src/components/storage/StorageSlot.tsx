import React from 'react';
import { StorageSlot as Slot, Puck } from '../../types';

interface Props {
  slot: Slot;
  puck?: Puck;
  onClick: () => void;
}

const shadeColor = (shade?: string) => {
  if (!shade) return 'border-gray-600';
  if (shade.startsWith('A')) return 'border-red-400';
  if (shade.startsWith('B')) return 'border-green-400';
  if (shade.startsWith('C')) return 'border-blue-400';
  return 'border-yellow-400';
};

const StorageSlot: React.FC<Props> = ({ slot, puck, onClick }) => {
  const occupied = slot.occupied && puck;
  return (
    <div
      onClick={occupied ? onClick : undefined}
      className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-[10px] md:text-xs cursor-pointer rounded-sm border ${
        occupied ? shadeColor(puck?.shade) : 'border-gray-700'
      } ${occupied ? 'hover:brightness-125' : ''}`}
    >
      {slot.slotNumber}
    </div>
  );
};

export default StorageSlot; 