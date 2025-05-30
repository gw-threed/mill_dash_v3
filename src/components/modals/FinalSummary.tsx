import React from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useCaseContext } from '../../context/CaseContext';

interface Props {
  caseIds: string[];
  puckId: string;
  millId: string;
  slotName: string;
  isReassignment?: boolean;
  originalLocation?: string;
}

const FinalSummary: React.FC<Props> = ({ 
  caseIds, 
  puckId, 
  millId, 
  slotName,
  isReassignment = false,
  originalLocation = ''
}) => {
  const { pucks } = usePuckContext();
  const { cases } = useCaseContext();
  const puck = pucks.find((p) => p.puckId === puckId);
  const selectedCases = cases.filter((c) => caseIds.includes(c.caseId));
  return (
    <div className="text-sm space-y-3">
      {isReassignment && (
        <div className="bg-[#3D3D3D] p-3 rounded mb-3">
          <h5 className="font-semibold mb-1 text-[#BB86FC]">Mill Reassignment</h5>
          <p>Moving job from {originalLocation} to {millId} / Slot {slotName}</p>
        </div>
      )}
      <div>
        <h5 className="font-semibold mb-1">Destination</h5>
        <p>
          {millId} / Slot {slotName}
        </p>
      </div>
      {puck && (
        <div>
          <h5 className="font-semibold mb-1">Puck</h5>
          <p>
            {puck.shade} {puck.thickness} | Shrink {puck.shrinkageFactor.toFixed(4)} | Lot{' '}
            {puck.lotNumber}
          </p>
        </div>
      )}
      <div>
        <h5 className="font-semibold mb-1">Cases ({selectedCases.length})</h5>
        <ul className="list-disc list-inside opacity-80">
          {selectedCases.map((c) => (
            <li key={c.caseId}>
              {c.caseId} | {c.units} units
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FinalSummary; 