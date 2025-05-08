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

  // Add activeSelectionShade to window object so it can be accessed by other components
  useEffect(() => {
    // @ts-ignore - Adding property to window
    window.activeSelectionShade = activeSelectionShade;
  }, [activeSelectionShade]);

  // Function to get filtered cases based on the selected shade
  const getFilteredCases = useMemo(() => {
    if (!selectedShade) {
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

  // Automatically select all cases when a specific shade is selected (excluding Other Shades)
  useEffect(() => {
    if (selectedShade && selectedShade !== ALL_OTHER_SHADES) {
      // Get IDs of cases with the specific shade
      const idsToSelect = cases
        .filter(c => c.shade === selectedShade)
        .map(c => c.caseId);
      
      // Only auto-select all cases when changing shade or when no cases are currently selected
      // This allows users to deselect individual cases while keeping the shade filter active
      if (selectedIds.length === 0 || !selectedIds.every(id => {
        const c = cases.find(c => c.caseId === id);
        return c && c.shade === selectedShade;
      })) {
        setSelectedIds(idsToSelect);
      }
      
      setActiveSelectionShade(selectedShade);
    } else if (selectedShade === ALL_OTHER_SHADES) {
      // For Other Shades, don't reset selections automatically
      // Just ensure activeSelectionShade is consistent with any existing selections
      if (selectedIds.length > 0) {
        const firstCase = cases.find(c => c.caseId === selectedIds[0]);
        if (firstCase) {
          setActiveSelectionShade(firstCase.shade);
        }
      } else {
        setActiveSelectionShade(null);
      }
    } else if (!selectedShade) {
      // When no shade is selected, clear the selection
      setSelectedIds([]);
      setActiveSelectionShade(null);
    }
  }, [selectedShade, cases, setSelectedIds, selectedIds]);

  const toggleSelect = (id: string) => {
    const caseToToggle = cases.find(c => c.caseId === id);
    if (!caseToToggle) return;
    
    // Special handling for Other Shades view - allow selecting any case
    if (selectedShade === ALL_OTHER_SHADES) {
      setSelectedIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(i => i !== id);
        } else {
          // In Other Shades view, we still need to track the shade for the current selection
          if (prev.length === 0) {
            setActiveSelectionShade(caseToToggle.shade);
          } else {
            // Check if the new case's shade matches existing selections
            const firstCase = cases.find(c => c.caseId === prev[0]);
            if (firstCase && firstCase.shade !== caseToToggle.shade) {
              // Cannot mix shades
              console.log(`Cannot select cases with different shades. Active: ${firstCase.shade}, Attempted: ${caseToToggle.shade}`);
              return prev;
            }
          }
          return [...prev, id];
        }
      });
      return;
    }
    
    // Regular shade selection logic (not Other Shades)
    setSelectedIds(prev => {
      // If this case is already selected, just remove it
      if (prev.includes(id)) {
        const newSelection = prev.filter(i => i !== id);
        
        // Only reset activeSelectionShade if no cases are selected anymore
        // But don't reset the selectedShade filter unless explicitly cleared by user
        if (newSelection.length === 0) {
          setActiveSelectionShade(null);
          // We're not resetting selectedShade here, so the filter remains
        }
        
        return newSelection;
      } 
      // Adding a new case
      else {
        // If we don't have an active selection shade yet, set it to this case's shade
        if (!activeSelectionShade) {
          setActiveSelectionShade(caseToToggle.shade);
          return [...prev, id];
        } 
        // If we have an active shade and this case matches it, allow selection
        else if (caseToToggle.shade === activeSelectionShade) {
          return [...prev, id];
        } 
        // Trying to select a case with a different shade - not allowed
        else {
          console.log(`Cannot select cases with different shades. Active: ${activeSelectionShade}, Attempted: ${caseToToggle.shade}`);
          return prev;
        }
      }
    });
  };

  const handleCaseClick = (caseData: CamCase) => {
    // If we're in the "Other Shades" view, just toggle selection directly
    if (selectedShade === ALL_OTHER_SHADES) {
      if (selectedIds.includes(caseData.caseId)) {
        // Already selected - deselect it
        setSelectedIds(prev => prev.filter(id => id !== caseData.caseId));
        
        // Reset activeSelectionShade if no cases left
        if (selectedIds.length <= 1) {
          setActiveSelectionShade(null);
        }
      } else {
        // Not selected - check for shade compatibility
        if (selectedIds.length === 0) {
          // First selection - set the shade
          setActiveSelectionShade(caseData.shade);
          setSelectedIds([caseData.caseId]);
        } else {
          // Verify same shade as existing selections
          const firstCase = cases.find(c => c.caseId === selectedIds[0]);
          if (firstCase && firstCase.shade === caseData.shade) {
            setSelectedIds(prev => [...prev, caseData.caseId]);
          } else {
            console.log(`Cannot select cases with different shades`);
          }
        }
      }
      return;
    }
    
    // If we're not in "Other Shades" view, we want to filter by the clicked case's shade
    // First, set the filter to this shade (or toggle it off if already selected)
    if (selectedShade === caseData.shade) {
      // If already filtered to this shade, clicking again should clear the filter
      setSelectedShade(null);
    } else {
      // Set the filter to the clicked case's shade
      setSelectedShade(caseData.shade);
      
      // No need to call toggleSelect here, as the useEffect hook will handle selection
      // when selectedShade changes
      return;
    }
    
    // Only need to toggle selection if clearing the filter
    toggleSelect(caseData.caseId);
  };

  return (
    <div className="space-y-3">
      {getFilteredCases.map((c) => (
        <CaseCard
          key={c.caseId}
          caseData={c}
          isSelected={selectedIds.includes(c.caseId)}
          onToggle={toggleSelect}
          onCaseClick={handleCaseClick}
          activeSelectionShade={activeSelectionShade}
        />
      ))}
      {getFilteredCases.length === 0 && (
        <div className="text-center py-8 text-textSecondary">
          No cases available for the selected shade.
        </div>
      )}
    </div>
  );
};

export default CaseList; 