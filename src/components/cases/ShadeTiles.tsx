import React, { useMemo, useState } from 'react';
import { useCaseContext } from '../../context/CaseContext';

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
        <div className="relative">
          <Tile
            label="Other Shades"
            count={otherShades.reduce((sum, s) => sum + s.count, 0)}
            isSelected={Boolean(
              selectedShade && !topShades.find((t) => t.shade === selectedShade),
            )}
            onClick={() => setShowOther((prev) => !prev)}
          />
          {showOther && (
            <div className="absolute z-10 mt-2 bg-surface text-textPrimary rounded shadow-lg p-2 max-h-60 overflow-y-auto w-40">
              {otherShades.map(({ shade, count }) => (
                <button
                  key={shade}
                  className="flex justify-between w-full text-sm py-1 px-2 hover:bg-surface-light rounded"
                  onClick={() => handleSelect(shade)}
                >
                  <span>{shade}</span>
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShadeTiles; 