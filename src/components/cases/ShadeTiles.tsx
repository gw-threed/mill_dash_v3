import React, { useMemo, useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';

// Special constant to represent "all other shades"
export const ALL_OTHER_SHADES = "ALL_OTHER_SHADES";

interface ShadeCount {
  shade: string;
  count: number;
}

const Tile: React.FC<{
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ label, count, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-32 h-20 rounded-md transition transform hover:-translate-y-1 hover:shadow-lg text-white text-sm p-2 ${
      isSelected ? 'bg-primary' : 'bg-surface'
    }`}
  >
    <span className="font-semibold text-lg">{label}</span>
    <span className="text-xs opacity-80">{count} Cases</span>
  </button>
);

const ShadeTiles: React.FC = () => {
  const { cases, selectedShade, setSelectedShade } = useCaseContext();

  const { topShades, otherShades } = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.shade] = (counts[c.shade] || 0) + 1;
    });
    const shadeArr: ShadeCount[] = Object.entries(counts).map(([shade, count]) => ({
      shade,
      count,
    }));
    shadeArr.sort((a, b) => b.count - a.count);
    const topShades = shadeArr.slice(0, 6);
    const otherShades = shadeArr.slice(6);
    return { topShades, otherShades };
  }, [cases]);

  const [showOther, setShowOther] = useState(false);

  const handleSelect = (shade: string) => {
    if (selectedShade === shade) {
      // clicking the same shade clears filter
      setSelectedShade(null);
    } else {
      setSelectedShade(shade);
    }
    setShowOther(false);
  };

  const handleOtherShadesClick = () => {
    // If other shades is already selected, clicking again deselects it
    if (selectedShade === ALL_OTHER_SHADES) {
      setSelectedShade(null);
    } else {
      // When clicking "Other Shades", select all other shades at once
      setSelectedShade(ALL_OTHER_SHADES);
    }
    setShowOther(false);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {topShades.map(({ shade, count }) => (
        <Tile
          key={shade}
          label={shade}
          count={count}
          isSelected={selectedShade === shade}
          onClick={() => handleSelect(shade)}
        />
      ))}
      {otherShades.length > 0 && (
        <Tile
          label="Other Shades"
          count={otherShades.reduce((sum, s) => sum + s.count, 0)}
          isSelected={selectedShade === ALL_OTHER_SHADES}
          onClick={handleOtherShadesClick}
        />
      )}
    </div>
  );
};

export default ShadeTiles; 