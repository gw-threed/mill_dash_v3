import React from 'react';
import { StorageSlot as Slot, Puck } from '../../types';

interface Props {
  slot: Slot;
  puck?: Puck;
  onClick?: () => void;
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
  const tooltipBase = `Shelf ${slot.shelf}, Column ${slot.column}, Slot ${slot.slotNumber}`;
  const tooltip = occupied ? `${tooltipBase} - ${puck?.shade} ${puck?.thickness}` : `${tooltipBase} (Empty)`;

  return (
    <div
      onClick={occupied ? onClick : undefined}
      className={`h-5 w-20 flex items-center justify-center text-[10px] md:text-xs rounded-sm border ${
        occupied ? shadeColor(puck?.shade) : 'border-[#2D2D2D] bg-[#1A1A1A] text-gray-600'
      } ${occupied ? 'hover:brightness-125 cursor-pointer' : ''}`}
      title={tooltip}
    >
      {slot.slotNumber}
    </div>
  );
};

export default StorageSlot; 