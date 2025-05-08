import React from 'react';
import { CamCase } from '../../types';
import clsx from 'clsx';

interface Props {
  caseData: CamCase;
  isSelected: boolean;
  isSelectable: boolean;
  onToggle: () => void;
  activeSelectionShade: string | null;
}

const CaseCard: React.FC<Props> = ({ 
  caseData, 
  isSelected, 
  isSelectable,
  onToggle, 
  activeSelectionShade 
}) => {
  return (
    <div
      data-case-id={caseData.caseId}
      onClick={() => isSelectable && onToggle()}
      className={clsx(
        'case-card relative bg-[#1E1E1E] text-white p-3 rounded-md flex flex-col shadow transition',
        isSelectable ? 'hover:-translate-y-0.5 hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed',
        isSelected ? 'selected ring-2 ring-cyan-400/70 shadow-[0_0_10px_#22D3EE]' : 'ring-0',
      )}
    >
      <label
        className={clsx(
          "absolute left-2 top-1/2 -translate-y-1/2",
          isSelectable ? "cursor-pointer" : "cursor-not-allowed"
        )}
        onClick={(e) => { 
          e.stopPropagation();
          if (isSelectable) {
            onToggle();
          }
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={!isSelectable}
          onChange={() => {}} // Handled by parent onClick
          className="sr-only"
        />
        <span
          className={clsx(
            'h-5 w-5 inline-block border rounded-sm border-borderMuted bg-transparent',
            isSelected && 'border-primary',
            !isSelectable && 'opacity-50'
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