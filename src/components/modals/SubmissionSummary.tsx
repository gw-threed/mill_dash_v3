import React from 'react';

interface Props {
  items: string[];
  onDone: () => void;
  title?: string;
}

const SubmissionSummary: React.FC<Props> = ({ items, onDone, title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
      <h4 className="text-lg font-semibold">{title || 'Milling Assignment Completed ✅'}</h4>
      <ul className="text-sm space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="opacity-80">
            {it}
          </li>
        ))}
      </ul>
      <button
        onClick={onDone}
        className="px-4 py-2 rounded bg-[#BB86FC] hover:brightness-110 text-sm mt-4"
      >
        Done
      </button>
    </div>
  );
};

export default SubmissionSummary; 