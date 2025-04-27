import React from 'react';

interface Props {
  currentStep: number;
}

const steps = [
  'Select Mill & Slot',
  'Upload Screenshot',
  'Confirm G-code',
  'Ready',
];

const ConfirmFitProgressBar: React.FC<Props> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      {steps.map((label, idx) => {
        const stepNumber = idx + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        return (
          <div key={label} className="flex-1 flex items-center last:flex-none">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shadow ${
                isActive || isCompleted ? 'bg-[#BB86FC]' : 'bg-[#2D2D2D]'
              }`}
            >
              {stepNumber}
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-1 bg-[#2D2D2D] mx-1">
                <div
                  className="h-full bg-[#BB86FC]"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConfirmFitProgressBar; 