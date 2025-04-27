import React from 'react';
import { Mill } from '../../types';
import MillSlot from './MillSlot';

interface Props {
  mills: Mill[];
}

const MillGrid: React.FC<Props> = ({ mills }) => {
  return (
    <div className="space-y-4">
      {mills.map((mill) => (
        <div key={mill.id}>
          <h4 className="font-semibold mb-1">{mill.id}</h4>
          <div className="flex space-x-1 flex-wrap">
            {mill.slots.map((s) => (
              <MillSlot key={`${mill.id}-${s.slotName}`} slot={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MillGrid; 