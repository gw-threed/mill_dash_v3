import React from 'react';

interface Props {
  gcodeConfirmed: boolean;
  setGcodeConfirmed: (val: boolean) => void;
  title?: string;
}

const GcodeConfirmation: React.FC<Props> = ({ gcodeConfirmed, setGcodeConfirmed, title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      {!gcodeConfirmed ? (
        <>
          <p className="text-sm opacity-80">Please confirm that the G-code has been generated successfully.</p>
          <button
            onClick={() => setGcodeConfirmed(true)}
            className="px-4 py-2 rounded bg-[#BB86FC] hover:brightness-110 text-sm"
          >
            Confirm G-code
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-green-400 flex items-center gap-2">
            <span className="material-icons text-green-400">check_circle</span>
            G-code Confirmed. Ready to proceed.
          </p>
        </>
      )}
    </div>
  );
};

export default GcodeConfirmation; 