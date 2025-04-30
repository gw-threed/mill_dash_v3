import React from 'react';

interface Props {
  items: string[];
  onDone: () => void;
  title?: string;
}

const SubmissionSummary: React.FC<Props> = ({ items, onDone, title }) => {
  // Function to parse location information from summary items
  const extractLocationInfo = (text: string) => {
    // Look for patterns like "Puck X moved to Y" or "relocated to Z"
    const moveToMatch = text.match(/moved to ([A-Za-z0-9\-]+) (Slot|\/) ([A-Za-z0-9]+)/i);
    const relocatedToMatch = text.match(/relocated to ([A-Za-z0-9\-]+.*)/i);
    
    if (moveToMatch) {
      const [_, location, slotType, slotId] = moveToMatch;
      return {
        action: 'Move to:',
        location: slotType === '/' ? `${location}/${slotId}` : `${location} Slot ${slotId}`
      };
    }
    
    if (relocatedToMatch) {
      return {
        action: 'Relocated to:',
        location: relocatedToMatch[1]
      };
    }
    
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
      <h4 className="text-xl font-semibold">{title || 'Milling Assignment Completed ✅'}</h4>
      
      {/* Display items with special emphasis on location information */}
      <div className="w-full space-y-5">
        {items.map((item, idx) => {
          const locationInfo = extractLocationInfo(item);
          
          if (locationInfo) {
            return (
              <div key={idx} className="bg-gray-800 p-4 rounded-md">
                <div className="mb-2 text-sm">{item.split(locationInfo.location)[0]}</div>
                <div className="text-2xl font-bold text-center p-3 bg-[#2D2D2D] rounded-md text-white border border-[#BB86FC]">
                  {locationInfo.location}
                </div>
              </div>
            );
          }
          
          return (
            <div key={idx} className="text-sm opacity-80 p-2">
              {item}
            </div>
          );
        })}
      </div>
      
      <button
        onClick={onDone}
        className="px-4 py-3 rounded bg-[#BB86FC] hover:brightness-110 text-base font-semibold mt-4"
      >
        Done
      </button>
    </div>
  );
};

export default SubmissionSummary; 