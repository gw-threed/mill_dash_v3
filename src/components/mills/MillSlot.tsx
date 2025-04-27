import React from 'react';
import { MillSlot as Slot, Puck } from '../../types';

interface Props {
  slot: Slot;
  puck?: Puck;
  onClick?: () => void;
}

// Helper to color-code shade borders similar to storage slot
const shadeBorderColor = (shade?: string) => {
  if (!shade) return 'border-gray-600';
  if (shade.startsWith('A')) return 'border-red-400';
  if (shade.startsWith('B')) return 'border-green-400';
  if (shade.startsWith('C')) return 'border-blue-400';
  return 'border-yellow-400';
};

const MillSlot: React.FC<Props> = ({ slot, puck, onClick }) => {
  const occupied = slot.occupied && puck;
  const borderClass = occupied ? shadeBorderColor(puck?.shade) : 'border-[#2D2D2D]';
  const bgClass = occupied ? 'bg-[#1E1E1E]' : 'bg-[#2D2D2D] text-gray-600';
  const hoverClass = occupied ? 'hover:brightness-125 cursor-pointer' : '';

  return (
    <div
      onClick={occupied ? onClick : undefined}
      className={`w-12 h-12 flex items-center justify-center text-[10px] md:text-xs rounded-sm border ${borderClass} ${bgClass} ${hoverClass}`}
      title={occupied ? `${puck?.puckId} (${puck?.shade})` : 'Empty Slot'}
    >
      {slot.slotName}
    </div>
  );
};

export default MillSlot; 