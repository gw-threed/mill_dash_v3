import React from 'react';
import { MillSlot as Slot } from '../../types';

interface Props {
  slot: Slot;
}

const MillSlot: React.FC<Props> = ({ slot }) => {
  const occupiedClass = slot.occupied ? 'bg-green-500' : 'bg-gray-200';
  return <div className={`w-8 h-8 border ${occupiedClass}`} title={`${slot.millName}-${slot.slotName}`}></div>;
};

export default MillSlot; 