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
        isSelected ? 'ring-2 ring-cyan-400/70 shadow-[0_0_10px_#22D3EE]' : 'ring-0',
      )}
    >
      <label
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(caseData.caseId)}
          className="sr-only"
        />
        <span
          className={clsx(
            'h-5 w-5 inline-block border rounded-sm border-borderMuted bg-transparent',
            isSelected && 'border-primary'
          )}
        ></span>
        {isSelected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 text-primary absolute left-[5px] top-1/2 -translate-y-1/2"
          >
            <path
              fillRule="evenodd"
              d="M9 12.75l-2.25-2.25a.75.75 0 10-1.06 1.06l3 3a.75.75 0 001.06 0l6-6a.75.75 0 10-1.06-1.06L9 12.75z"
              clipRule="evenodd"
            />
          </svg>
        )}
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