import React, { useEffect, useMemo, useState } from 'react';
import CaseCard from './CaseCard';
import { useCaseContext } from '../../context/CaseContext';
import { CamCase } from '../../types';
import { ALL_OTHER_SHADES } from './ShadeTiles';

interface Props {
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const CaseList: React.FC<Props> = ({ selectedIds, setSelectedIds }) => {
  const { cases, selectedShade, setSelectedShade } = useCaseContext();
  
  // Track the active shade for selected cases
  const [activeSelectionShade, setActiveSelectionShade] = useState<string | null>(null);

  // Add activeSelectionShade to window object for other components
  useEffect(() => {
    // @ts-ignore - Adding property to window
    window.activeSelectionShade = activeSelectionShade;
  }, [activeSelectionShade]);

  // Function to get filtered cases based on the selected shade
  const filteredCases = useMemo(() => {
    if (!selectedShade) {
      // No filter applied - show all cases
      return cases;
    } else if (selectedShade === ALL_OTHER_SHADES) {
      // For "Other Shades", get the top 6 shades to exclude them
      const shadeCounts: Record<string, number> = {};
      cases.forEach(c => { shadeCounts[c.shade] = (shadeCounts[c.shade] || 0) + 1 });
      
      const topShades = Object.entries(shadeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([shade]) => shade);
      
      // Return cases that aren't in the top shades, sorted by shade
      const otherShadesCases = cases.filter(c => !topShades.includes(c.shade));
      // Sort by shade alphabetically for easier finding
      return otherShadesCases.sort((a, b) => a.shade.localeCompare(b.shade));
    } else {
      // Regular filtering for a specific shade
      return cases.filter(c => c.shade === selectedShade);
    }
  }, [cases, selectedShade]);

  // Handle changes to selectedShade (when tiles are clicked)
  useEffect(() => {
    if (selectedShade === null) {
      // When filter is cleared, clear all selections
      setSelectedIds([]);
      setActiveSelectionShade(null);
    } 
    else if (selectedShade === ALL_OTHER_SHADES) {
      // For Other Shades: Just filter, don't auto-select
      setSelectedIds([]);
      setActiveSelectionShade(null);
    } 
    else {
      // For Top 6 Shades: Auto-select all cases of this shade
      const matchingCaseIds = cases
        .filter(c => c.shade === selectedShade)
        .map(c => c.caseId);
      
      setSelectedIds(matchingCaseIds);
      setActiveSelectionShade(selectedShade);
    }
  }, [selectedShade, cases, setSelectedIds]);

  // Handle individual case toggle
  const toggleCase = (caseId: string) => {
    const caseItem = cases.find(c => c.caseId === caseId);
    if (!caseItem) return;

    // If we're in "Other Shades" view
    if (selectedShade === ALL_OTHER_SHADES) {
      if (selectedIds.includes(caseId)) {
        // Deselecting a case
        const newSelection = selectedIds.filter(id => id !== caseId);
        setSelectedIds(newSelection);
        
        // If no cases left selected, reset activeSelectionShade
        if (newSelection.length === 0) {
          setActiveSelectionShade(null);
        }
      } else {
        // Selecting a case - check if compatible with existing selections
        if (selectedIds.length === 0) {
          // First selection - establish the active shade
          setActiveSelectionShade(caseItem.shade);
          setSelectedIds([caseId]);
        } else {
          // Check if same shade as existing selections
          const existingCase = cases.find(c => c.caseId === selectedIds[0]);
          if (existingCase && existingCase.shade === caseItem.shade) {
            setSelectedIds([...selectedIds, caseId]);
          }
          // Ignore if different shade (handled by UI disabling)
        }
      }
    }
    // If we're in Top 6 Shade view or unfiltered view
    else {
      if (selectedIds.includes(caseId)) {
        // Deselecting a case
        const newSelection = selectedIds.filter(id => id !== caseId);
        setSelectedIds(newSelection);
        
        // If all cases are deselected, clear the filter
        if (newSelection.length === 0) {
          setSelectedShade(null);
          setActiveSelectionShade(null);
        }
      } else if (selectedShade === null) {
        // Selecting first case from unfiltered view:
        // Filter to that case's shade and select all matching cases
        setSelectedShade(caseItem.shade);
        // Auto-selection will happen in the selectedShade useEffect
      } else {
        // Add to existing selection (should be same shade due to filtering)
        setSelectedIds([...selectedIds, caseId]);
      }
    }
  };

  // Function to determine if a case is selectable
  const isSelectable = (caseItem: CamCase) => {
    // If not in "Other Shades" or no filter, all visible cases are selectable
    if (selectedShade !== ALL_OTHER_SHADES) return true;
    
    // In "Other Shades" view, check compatible shade
    if (selectedIds.length === 0) {
      // No cases selected yet, all are selectable
      return true;
    } else {
      // Must match shade of already selected cases
      const firstSelectedCase = cases.find(c => c.caseId === selectedIds[0]);
      return firstSelectedCase?.shade === caseItem.shade;
    }
  };

  return (
    <div className="space-y-3">
      {filteredCases.map((c) => (
        <CaseCard
          key={c.caseId}
          caseData={c}
          isSelected={selectedIds.includes(c.caseId)}
          isSelectable={isSelectable(c)}
          onToggle={() => toggleCase(c.caseId)}
          activeSelectionShade={activeSelectionShade}
        />
      ))}
      {filteredCases.length === 0 && (
        <div className="text-center py-8 text-textSecondary">
          No cases available for the selected shade.
        </div>
      )}
    </div>
  );
};

export default CaseList; 