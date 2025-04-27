import React from 'react';
import { CamCase } from '../../types';
import clsx from 'clsx';

interface Props {
  caseData: CamCase;
  isSelected: boolean;
  onToggle: (caseId: string) => void;
  onCaseClick: (caseData: CamCase) => void;
}

const CaseCard: React.FC<Props> = ({ caseData, isSelected, onToggle, onCaseClick }) => {
  return (
    <div
      onClick={() => onCaseClick(caseData)}
      className={clsx(
        'relative bg-[#1E1E1E] text-white p-3 rounded-md flex flex-col shadow transition hover:-translate-y-0.5 hover:shadow-lg',
        isSelected ? 'border-2 border-primary-light' : 'border border-transparent',
      )}
    >
      <label
        className="absolute left-2 top-1/2 -translate-y-1/2"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(caseData.caseId)}
          className="h-5 w-5 text-[#BB86FC] border-[#BB86FC] bg-transparent rounded focus:ring-0 focus:ring-offset-0 opacity-80"
        />
      </label>
      <div className="flex justify-between items-center gap-2 text-sm pl-8">
        <span className="font-bold text-lg">{caseData.shade}</span>
        <span className="opacity-80 truncate">
          {caseData.caseId} | {caseData.officeName}
        </span>
      </div>
      <div className="flex justify-between items-center text-xs opacity-80 mt-1 whitespace-nowrap pl-8">
        <span className="truncate">{caseData.toothNumbers.join(', ')}</span>
        <span>{caseData.units} unit{caseData.units > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default CaseCard; 