import { CamCase, Puck, MillLogEntry, Mill } from '../types';
import { MATERIAL_LOOKUP } from './seed';

// Helper functions
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Weighted random choice - allows some values to be more likely than others
const weightedRandomChoice = <T,>(items: T[], weights: number[]): T => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1]; // Fallback
};

// Distribution of shade usage (more common shades get higher weights)
const SHADE_WEIGHTS: Record<string, number> = {
  'A1': 18,
  'A2': 20,
  'A3': 16,
  'A3.5': 12,
  'B1': 14,
  'B2': 10,
  'B3': 8,
  'C1': 6,
  'C2': 5,
  'C3': 4,
  'D2': 3,
  'D3': 2,
  'D4': 1,
  'OM1': 1,
  'OM3': 1,
  'B4': 1,
  'C4': 1,
  'A4': 1,
};

// Distribution for thickness
const THICKNESS_WEIGHTS = {
  '14mm': 65, // 65% chance for 14mm
  '20mm': 35, // 35% chance for 20mm
};

// Function to generate a random date within the past 5 weeks
const generateRandomDate = (startDate: Date, endDate: Date) => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
};

// Function to generate a list of puck IDs (for tracking which pucks were used)
const generatePuckIDs = (count: number, startingId: number = 1000): string[] => {
  const puckIds: string[] = [];
  for (let i = 0; i < count; i++) {
    puckIds.push(`PUCK-${(startingId + i).toString().padStart(6, '0')}`);
  }
  return puckIds;
};

// Function to generate historical cases (completed cases from the past 5 weeks)
export const generateHistoricalCases = (count: number): CamCase[] => {
  const cases: CamCase[] = [];
  const doctorNames = [
    'Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Jones',
    'Dr. Miller', 'Dr. Davis', 'Dr. Garcia', 'Dr. Rodriguez', 'Dr. Wilson',
    'Dr. Martinez', 'Dr. Anderson', 'Dr. Taylor', 'Dr. Thomas', 'Dr. Moore'
  ];
  
  const officeNames = [
    'Smile Care Dental', 'Healthy Teeth Clinic', 'Bright Smiles Center',
    'Premier Dental Lab', 'Happy Tooth Office', 'Downtown Dental',
    'Riverfront Dentistry', 'Lakeside Dental Studio', 'Mountain View Dental',
    'Ocean Breeze Dentistry', 'City Center Dental', 'Parkside Dental Group',
    'Valley Dental Associates', 'Sunshine Dental Care', 'Golden State Dentistry'
  ];
  
  const shades = Object.keys(SHADE_WEIGHTS);
  const shadeWeightValues = Object.values(SHADE_WEIGHTS);
  
  for (let i = 0; i < count; i++) {
    // Use a distinct prefix for historical case IDs to avoid conflicts
    const caseId = `HIST-${(i + 1).toString().padStart(4, '0')}`;
    
    // Generate 1-6 units per case with a distribution that favors 1-3 units
    const unitWeights = [45, 30, 15, 5, 3, 2]; // Weights for 1-6 units
    const units = weightedRandomChoice([1, 2, 3, 4, 5, 6], unitWeights);
    
    // Generate tooth numbers
    const toothNumbers: number[] = [];
    while (toothNumbers.length < units) {
      const num = randomInt(1, 32);
      if (!toothNumbers.includes(num)) {
        toothNumbers.push(num);
      }
    }
    
    // Select a shade with weighted probability
    const shade = weightedRandomChoice(shades, shadeWeightValues);
    
    const stlFiles = toothNumbers.map(
      (tooth) => `${caseId}|Crown|${tooth}|${shade}.stl`
    );
    
    cases.push({
      caseId,
      doctorName: randomChoice(doctorNames),
      officeName: randomChoice(officeNames),
      shade,
      units,
      toothNumbers,
      stlFiles,
      status: 'completed' // Always mark historical cases as completed
    });
  }
  
  return cases;
};

// Generate historical mill logs (entries of pucks being moved in/out of mills over 5 weeks)
export const generateHistoricalMillLogs = (
  cases: CamCase[],
  millConfigs: Mill[],
  puckIds: string[]
): MillLogEntry[] => {
  const logs: MillLogEntry[] = [];
  const now = new Date();
  const fiveWeeksAgo = new Date(now.getTime() - (35 * 24 * 60 * 60 * 1000));
  
  // Group cases by day, targeting ~100 units per day for 35 days
  const casesByDay: CamCase[][] = Array(35).fill(null).map(() => []);
  const totalDays = 35;
  
  // Distribute cases to achieve ~100 units per day
  let caseIndex = 0;
  let dayIndex = 0;
  let unitsForCurrentDay = 0;
  
  while (caseIndex < cases.length) {
    const currentCase = cases[caseIndex];
    
    // If adding this case would exceed daily target of ~100-120 units, move to next day
    if (unitsForCurrentDay + currentCase.units > randomInt(95, 120) && dayIndex < totalDays - 1) {
      dayIndex++;
      unitsForCurrentDay = 0;
    }
    
    casesByDay[dayIndex].push(currentCase);
    unitsForCurrentDay += currentCase.units;
    caseIndex++;
  }
  
  // Map of puckId to its current state (in storage, in mill, used up)
  const puckStatus: Record<string, { 
    location: string; 
    status: 'in_storage' | 'in_mill' | 'retired';
    shade: string;
    thickness: string;
    materialId: number;
    jobsDone: number;
  }> = {};
  
  // Initialize all pucks as in storage
  puckIds.forEach((puckId, index) => {
    // Determine the puck's shade and thickness
    const shade = weightedRandomChoice(Object.keys(SHADE_WEIGHTS), Object.values(SHADE_WEIGHTS));
    const thickness = weightedRandomChoice(
      Object.keys(THICKNESS_WEIGHTS), 
      Object.values(THICKNESS_WEIGHTS)
    );
    
    // Find matching material ID
    const material = MATERIAL_LOOKUP.find(m => m.shade === shade && m.thickness === thickness);
    const materialId = material ? material.materialId : MATERIAL_LOOKUP[0].materialId;
    
    puckStatus[puckId] = {
      location: `R1-${String.fromCharCode(65 + (index % 7))}-${String.fromCharCode(65 + (Math.floor(index / 7) % 7))}-${(index % 9) + 1}`,
      status: 'in_storage',
      shade,
      thickness,
      materialId,
      jobsDone: 0
    };
  });
  
  // Process each day's cases
  casesByDay.forEach((dayCases, day) => {
    if (dayCases.length === 0) return;
    
    // Calculate date for this day
    const dayDate = new Date(fiveWeeksAgo.getTime() + (day * 24 * 60 * 60 * 1000));
    
    // Group cases by shade for efficient puck usage
    const casesByShade: Record<string, CamCase[]> = {};
    dayCases.forEach(c => {
      if (!casesByShade[c.shade]) casesByShade[c.shade] = [];
      casesByShade[c.shade].push(c);
    });
    
    // Process each shade group
    Object.entries(casesByShade).forEach(([shade, casesOfShade]) => {
      // Find suitable pucks for this shade
      const availablePucks = Object.entries(puckStatus)
        .filter(([_, data]) => data.status === 'in_storage' && data.shade === shade)
        .map(([id, _]) => id);
      
      // If no pucks available, we need to create new ones (this is simplified)
      if (availablePucks.length === 0) {
        // Normally we'd create a new puck, but we'll just pick a random one for simplicity
        const randomPuckId = Object.keys(puckStatus).find(id => puckStatus[id].status === 'in_storage');
        if (randomPuckId) {
          const thickness = puckStatus[randomPuckId].thickness;
          const material = MATERIAL_LOOKUP.find(m => m.shade === shade && m.thickness === thickness);
          if (material) {
            puckStatus[randomPuckId].shade = shade;
            puckStatus[randomPuckId].materialId = material.materialId;
          }
        }
      }
      
      // Break cases into mill batches (mills have limited capacity)
      const millBatches: CamCase[][] = [];
      let currentBatch: CamCase[] = [];
      let currentBatchUnits = 0;
      
      casesOfShade.forEach(c => {
        // If adding this case would exceed reasonable mill capacity, start a new batch
        if (currentBatchUnits + c.units > randomInt(12, 16)) {
          if (currentBatch.length > 0) {
            millBatches.push([...currentBatch]);
            currentBatch = [];
            currentBatchUnits = 0;
          }
        }
        
        currentBatch.push(c);
        currentBatchUnits += c.units;
      });
      
      // Add the last batch if not empty
      if (currentBatch.length > 0) {
        millBatches.push(currentBatch);
      }
      
      // Assign each batch to a mill
      millBatches.forEach(batch => {
        // Choose a random mill
        const mill = randomChoice(millConfigs);
        const millId = mill.id;
        
        // Find a puck to use (try to match shade first, or grab any available one)
        let puckId = Object.entries(puckStatus)
          .find(([_, data]) => data.status === 'in_storage' && data.shade === shade)
          ?.[0];
        
        // If no matching shade, use any puck
        if (!puckId) {
          puckId = Object.entries(puckStatus)
            .find(([_, data]) => data.status === 'in_storage')
            ?.[0];
        }
        
        // Skip if no pucks available
        if (!puckId) return;
        
        // Create timestamp within the day
        const hours = randomInt(8, 17); // 8am to 5pm
        const minutes = randomInt(0, 59);
        const seconds = randomInt(0, 59);
        const timestamp = new Date(dayDate);
        timestamp.setHours(hours, minutes, seconds);
        
        // Get the puck's data
        const puckData = puckStatus[puckId];
        const previousLocation = puckData.location;
        const newLocation = `${millId}-${mill.model === 'A52' ? '1' : randomChoice(mill.slots).slotName}`;
        
        // Create log entry for moving puck to mill
        logs.push({
          logId: `log-${logs.length + 1}`,
          timestamp: timestamp.toISOString(),
          puckId,
          previousLocation,
          newLocation,
          caseIds: batch.map(c => c.caseId),
          technicianName: randomChoice(['Tech A', 'Tech B', 'Tech C', 'Tech D']),
          lastJobTriggered: false,
          notes: `Milling ${batch.reduce((sum, c) => sum + c.units, 0)} units`
        });
        
        // Update puck status
        puckData.location = newLocation;
        puckData.status = 'in_mill';
        
        // Create timestamp for job completion (2-6 hours later)
        const completionHours = randomInt(2, 6);
        const completionTimestamp = new Date(timestamp.getTime() + (completionHours * 60 * 60 * 1000));
        
        // Increment jobs done
        puckData.jobsDone += 1;
        
        // Determine if this job uses up the puck (approximately every 3-5 jobs)
        const puckDepleted = puckData.jobsDone >= randomInt(3, 5);
        
        // Create log entry for job completion / puck depletion
        logs.push({
          logId: `log-${logs.length + 1}`,
          timestamp: completionTimestamp.toISOString(),
          puckId,
          previousLocation: newLocation,
          newLocation: puckDepleted ? 'retired' : 'R1-A-A-1', // Generic storage location on return
          caseIds: batch.map(c => c.caseId),
          technicianName: randomChoice(['Tech A', 'Tech B', 'Tech C', 'Tech D']),
          lastJobTriggered: puckDepleted,
          notes: puckDepleted ? 'Puck depleted after job' : 'Job completed'
        });
        
        // Update puck status
        if (puckDepleted) {
          puckData.status = 'retired';
          puckData.location = 'retired';
        } else {
          puckData.status = 'in_storage';
          puckData.location = 'R1-A-A-1'; // Generic storage location on return
        }
      });
    });
  });
  
  return logs;
};

// Function to generate pucks with historical usage data
export const generateHistoricalPucks = (puckIds: string[]): Puck[] => {
  const pucks: Puck[] = [];
  let serialCounter = 5000;
  
  // Create a more realistic material usage distribution
  // For high-usage materials (A1, A2, A3, B1), we want more usage and lower stock
  const materialUsageData: Record<number, { usage: number, idealStock: number }> = {
    // 14mm materials - High usage shades with low stock
    128548: { usage: 15, idealStock: 0 },    // A1 14mm - high usage, critically low stock (out of stock)
    128549: { usage: 18, idealStock: 0 },    // A2 14mm - high usage, critically low stock
    128550: { usage: 14, idealStock: 0 },    // A3 14mm - high usage, out of stock (critical)
    128551: { usage: 10, idealStock: 0 },    // A3.5 14mm - moderate usage, out of stock (critical)
    128553: { usage: 12, idealStock: 0 },    // B1 14mm - high usage, critically low stock
    128554: { usage: 8, idealStock: 0 },     // B2 14mm - moderate usage, out of stock (critical)
    128555: { usage: 7, idealStock: 0 },     // B3 14mm - moderate, low stock
    128556: { usage: 2, idealStock: 1 },     // B4 14mm - low usage, low stock
    128557: { usage: 6, idealStock: 0 },     // C1 14mm - moderate, critically low stock
    128558: { usage: 3, idealStock: 1 },     // C2 14mm - low usage, low stock
    128559: { usage: 4, idealStock: 0 },     // C3 14mm - low, out of stock
    128560: { usage: 1, idealStock: 2 },     // C4 14mm - barely used, normal
    128561: { usage: 3, idealStock: 0 },     // D2 14mm - low, out of stock (critical)
    128562: { usage: 2, idealStock: 1 },     // D3 14mm - barely used, low stock
    128563: { usage: 1, idealStock: 2 },     // D4 14mm - barely used, normal
    128564: { usage: 5, idealStock: 0 },     // OM1 14mm - moderate, out of stock (critical)
    128566: { usage: 3, idealStock: 0 },     // OM3 14mm - low, out of stock
    
    // 20mm materials - Mix of stock levels
    128605: { usage: 11, idealStock: 0 },    // A1 20mm - high usage, out of stock (critical)
    128606: { usage: 10, idealStock: 0 },    // A2 20mm - high usage, out of stock (critical)
    128607: { usage: 8, idealStock: 0 },     // A3 20mm - moderate, out of stock
    128608: { usage: 7, idealStock: 0 },     // A3.5 20mm - moderate, out of stock (critical)
    128609: { usage: 1, idealStock: 2 },     // A4 20mm - barely used, normal
    128610: { usage: 9, idealStock: 0 },     // B1 20mm - moderate, out of stock (critical)
    128611: { usage: 2, idealStock: 1 },     // B2 20mm - low, low stock
    128612: { usage: 4, idealStock: 0 },     // B3 20mm - low, out of stock
    128613: { usage: 1, idealStock: 2 },     // B4 20mm - barely used, normal
    128614: { usage: 5, idealStock: 0 },     // C1 20mm - moderate, out of stock (critical)
    128615: { usage: 2, idealStock: 1 },     // C2 20mm - low, low stock
    128616: { usage: 3, idealStock: 0 },     // C3 20mm - low, out of stock (critical)
    128617: { usage: 1, idealStock: 2 },     // C4 20mm - barely used, normal
    128618: { usage: 2, idealStock: 1 },     // D2 20mm - low, low stock
    128619: { usage: 1, idealStock: 1 },     // D3 20mm - barely used, low stock
    128620: { usage: 1, idealStock: 1 },     // D4 20mm - barely used, low stock
    128621: { usage: 4, idealStock: 0 },     // OM1 20mm - low, out of stock (critical)
    128623: { usage: 1, idealStock: 1 },     // OM3 20mm - barely used, low stock
  };
  
  // Create a flattened array of material IDs based on idealStock
  // This will be used to distribute the generated pucks
  let materialDistribution: number[] = [];
  Object.entries(materialUsageData).forEach(([materialIdStr, data]) => {
    const materialId = parseInt(materialIdStr, 10);
    // Add this material ID to the distribution array based on its idealStock
    for (let i = 0; i < data.idealStock; i++) {
      materialDistribution.push(materialId);
    }
  });
  
  // If we don't have enough materials in the distribution, pad with random materials
  // But weight toward high-usage materials to create realistic scenarios
  const highUsageMaterials = [128548, 128549, 128550, 128553, 128605, 128606, 128607];
  while (materialDistribution.length < puckIds.length * 0.6) {
    materialDistribution.push(highUsageMaterials[Math.floor(Math.random() * highUsageMaterials.length)]);
  }
  
  // Randomly distribute in-storage vs in-mill vs retired status
  // But weight it toward more retired pucks to simulate used inventory
  puckIds.forEach((puckId, index) => {
    // Determine material ID - either from our distribution or random
    let materialId: number;
    let shade: string;
    let thickness: string;
    
    if (index < materialDistribution.length) {
      // Use the pre-determined material distribution
      materialId = materialDistribution[index];
      // Find matching material info
      const material = MATERIAL_LOOKUP.find(m => m.materialId === materialId);
      if (material) {
        shade = material.shade;
        thickness = material.thickness;
      } else {
        // Fallback if material not found
        shade = weightedRandomChoice(Object.keys(SHADE_WEIGHTS), Object.values(SHADE_WEIGHTS));
        thickness = weightedRandomChoice(Object.keys(THICKNESS_WEIGHTS), Object.values(THICKNESS_WEIGHTS));
      }
    } else {
      // For remaining pucks, use random material assignment
      shade = weightedRandomChoice(Object.keys(SHADE_WEIGHTS), Object.values(SHADE_WEIGHTS));
      thickness = weightedRandomChoice(Object.keys(THICKNESS_WEIGHTS), Object.values(THICKNESS_WEIGHTS));
      // Find matching material info
      const material = MATERIAL_LOOKUP.find(m => m.shade === shade && m.thickness === thickness);
      materialId = material ? material.materialId : MATERIAL_LOOKUP[0].materialId;
    }
    
    // Randomize status - adjust weights to create more retired pucks
    const statusRandom = Math.random();
    let status: 'in_storage' | 'in_mill' | 'retired';
    let currentLocation: string;
    
    // 15% in storage (reduced), 5% in mill, 80% retired (increased) - more realistic for high usage scenario
    if (statusRandom < 0.15) {
      status = 'in_storage';
      // Generate a storage location
      const rack = 1;
      const shelf = String.fromCharCode(65 + (index % 7)); // A-G
      const column = String.fromCharCode(65 + (Math.floor(index / 7) % 7)); // A-G
      const slotNumber = (index % 9) + 1;
      currentLocation = `R${rack}-${shelf}-${column}-${slotNumber}`;
    } else if (statusRandom < 0.20) {
      status = 'in_mill';
      const millModels = ['A52', 'DWX', '350i'];
      const millModel = randomChoice(millModels);
      const millNumber = randomInt(1, 2);
      
      if (millModel === 'A52') {
        currentLocation = `A52-${millNumber}-1`;
      } else if (millModel === 'DWX') {
        const slot = String.fromCharCode(65 + randomInt(0, 5)); // A-F
        currentLocation = `DWX-${millNumber}-${slot}`;
      } else {
        currentLocation = `350i-1-${randomInt(1, 12)}`;
      }
    } else {
      status = 'retired';
      currentLocation = 'retired';
    }
    
    pucks.push({
      puckId,
      shrinkageFactor: parseFloat((1.22 + Math.random() * 0.05).toFixed(4)),
      serialNumber: serialCounter++,
      materialId,
      lotNumber: randomInt(100000, 999999),
      shade,
      thickness,
      currentLocation,
      screenshotUrl: '/puck_placeholder.png',
      status
    });
  });
  
  return pucks;
};

// Main function to generate 5 weeks of historical data
export const generateHistoricalData = () => {
  // Constants for volume of data
  const MILL_CONFIG = [
    { id: 'A52-1', model: 'A52' as const, slots: [{ millName: 'A52-1', slotName: '1', occupied: false, puckId: null }] },
    { id: 'A52-2', model: 'A52' as const, slots: [{ millName: 'A52-2', slotName: '1', occupied: false, puckId: null }] },
    { id: 'DWX-1', model: 'DWX' as const, slots: 'ABCDEF'.split('').map(s => ({ millName: 'DWX-1', slotName: s, occupied: false, puckId: null })) },
    { id: 'DWX-2', model: 'DWX' as const, slots: 'ABCDEF'.split('').map(s => ({ millName: 'DWX-2', slotName: s, occupied: false, puckId: null })) },
    { id: '350i-1', model: '350i' as const, slots: Array.from({ length: 12 }, (_, idx) => ({ millName: '350i-1', slotName: (idx + 1).toString(), occupied: false, puckId: null })) }
  ];
  
  // 5 weeks × 7 days × ~100 units/day ÷ avg 3 units/case = ~1167 cases
  const CASE_COUNT = 1200;
  // We need around 300-400 pucks for 5 weeks of activity
  const PUCK_COUNT = 350;
  
  // Generate data
  const puckIds = generatePuckIDs(PUCK_COUNT);
  const historicalCases = generateHistoricalCases(CASE_COUNT);
  const historicalLogs = generateHistoricalMillLogs(historicalCases, MILL_CONFIG, puckIds);
  const historicalPucks = generateHistoricalPucks(puckIds);
  
  return {
    cases: historicalCases,
    logs: historicalLogs,
    pucks: historicalPucks
  };
};

// Function to get current pucks in storage based on usage patterns
export const getPucksInStorage = () => {
  // Create a more realistic material usage distribution
  // For high-usage materials (A1, A2, A3, B1), we want lower stock
  const materialUsageData: Record<number, { usage: number, currentStock: number }> = {
    // 14mm materials
    128548: { usage: 15, currentStock: 0 },    // A1 14mm - high usage, no stock (critical)
    128549: { usage: 18, currentStock: 0 },    // A2 14mm - high usage, no stock (critical)
    128550: { usage: 14, currentStock: 0 },    // A3 14mm - high usage, no stock (critical)
    128551: { usage: 10, currentStock: 0 },    // A3.5 14mm - moderate usage, no stock (critical)
    128553: { usage: 12, currentStock: 0 },    // B1 14mm - high usage, no stock (critical)
    128554: { usage: 8, currentStock: 0 },     // B2 14mm - moderate usage, no stock (critical)
    128555: { usage: 7, currentStock: 1 },     // B3 14mm - moderate, critically low stock
    128556: { usage: 2, currentStock: 3 },     // B4 14mm - low usage, adequate stock
    128557: { usage: 6, currentStock: 0 },     // C1 14mm - moderate, no stock (critical)
    128558: { usage: 3, currentStock: 2 },     // C2 14mm - low usage, low stock
    128559: { usage: 4, currentStock: 1 },     // C3 14mm - low, critically low stock
    128560: { usage: 1, currentStock: 4 },     // C4 14mm - barely used, adequate stock
    128561: { usage: 3, currentStock: 0 },     // D2 14mm - low, no stock (critical)
    128562: { usage: 2, currentStock: 1 },     // D3 14mm - barely used, critically low stock
    128563: { usage: 1, currentStock: 3 },     // D4 14mm - barely used, adequate stock
    128564: { usage: 5, currentStock: 0 },     // OM1 14mm - moderate, no stock (critical)
    128566: { usage: 3, currentStock: 0 },     // OM3 14mm - low, no stock (critical)
    
    // 20mm materials
    128605: { usage: 11, currentStock: 0 },    // A1 20mm - high usage, no stock (critical)
    128606: { usage: 10, currentStock: 0 },    // A2 20mm - high usage, no stock (critical)
    128607: { usage: 8, currentStock: 0 },     // A3 20mm - moderate, no stock (critical)
    128608: { usage: 7, currentStock: 0 },     // A3.5 20mm - moderate, no stock (critical)
    128609: { usage: 1, currentStock: 3 },     // A4 20mm - barely used, adequate stock
    128610: { usage: 9, currentStock: 0 },     // B1 20mm - moderate, no stock (critical)
    128611: { usage: 2, currentStock: 1 },     // B2 20mm - low, critically low stock
    128612: { usage: 4, currentStock: 0 },     // B3 20mm - low, no stock (critical)
    128613: { usage: 1, currentStock: 2 },     // B4 20mm - barely used, low stock
    128614: { usage: 5, currentStock: 0 },     // C1 20mm - moderate, no stock (critical)
    128615: { usage: 2, currentStock: 1 },     // C2 20mm - low, critically low stock
    128616: { usage: 3, currentStock: 0 },     // C3 20mm - low, no stock (critical)
    128617: { usage: 1, currentStock: 2 },     // C4 20mm - barely used, low stock
    128618: { usage: 2, currentStock: 0 },     // D2 20mm - low, no stock (critical)
    128619: { usage: 1, currentStock: 1 },     // D3 20mm - barely used, critically low stock
    128620: { usage: 1, currentStock: 1 },     // D4 20mm - barely used, critically low stock
    128621: { usage: 4, currentStock: 0 },     // OM1 20mm - low, no stock (critical)
    128623: { usage: 1, currentStock: 0 },     // OM3 20mm - barely used, no stock (critical)
  };
  
  // Generate new pucks based on currentStock values
  const pucksInStorage: Record<string, Puck> = {};
  let puckIdCounter = 5000;
  let serialCounter = 8000;
  
  Object.entries(materialUsageData).forEach(([materialIdStr, data]) => {
    const materialId = parseInt(materialIdStr, 10);
    const material = MATERIAL_LOOKUP.find(m => m.materialId === materialId);
    
    if (!material) return;
    
    // Generate the specified number of pucks for this material
    for (let i = 0; i < data.currentStock; i++) {
      const puckId = `PUCK-${(puckIdCounter++).toString().padStart(6, '0')}`;
      
      // Generate random storage location
      const rack = 1;
      const shelf = String.fromCharCode(65 + randomInt(0, 6)); // A-G
      const column = String.fromCharCode(65 + randomInt(0, 6)); // A-G
      const slotNumber = randomInt(1, 9);
      const currentLocation = `R${rack}-${shelf}-${column}-${slotNumber}`;
      
      pucksInStorage[puckId] = {
        puckId,
        shrinkageFactor: parseFloat((1.22 + Math.random() * 0.05).toFixed(4)),
        serialNumber: serialCounter++,
        materialId,
        lotNumber: randomInt(100000, 999999),
        shade: material.shade,
        thickness: material.thickness,
        currentLocation,
        screenshotUrl: '/puck_placeholder.png',
        status: 'in_storage'
      };
    }
  });
  
  return pucksInStorage;
};

export const getCurrentStocks = (materialUsages: Record<string, number>, recommendedStocks: Record<string, number>): Record<string, { currentStock: number, recommendedStock: number, status: string }> => {
  const result: Record<string, { currentStock: number, recommendedStock: number, status: string }> = {};
  
  Object.entries(recommendedStocks).forEach(([materialId, recommendedStock]) => {
    // Adjusted distribution to favor low stock scenarios
    let stockRatio = Math.random();  
    let currentStock: number;
    let status: string;
    
    // Create a mix of inventory statuses with bias toward low stock
    if (stockRatio < 0.7) {
      // Low stock (below 50% of recommended) - increased probability from 0.3 to 0.7
      currentStock = Math.floor(recommendedStock * (0.1 + Math.random() * 0.4));
      status = 'low';
    } else if (stockRatio < 0.9) {
      // Normal stock (50% to 120% of recommended) - decreased probability
      currentStock = Math.floor(recommendedStock * (0.5 + Math.random() * 0.7));
      status = 'normal';
    } else {
      // Excess stock (120% to 200% of recommended) - substantially decreased probability
      currentStock = Math.floor(recommendedStock * (1.2 + Math.random() * 0.8));
      status = 'excess';
    }
    
    // Make certain materials consistently low or out of stock
    if (materialId.includes('A1') || materialId.includes('A2') || materialId.includes('B1') || materialId.includes('B2')) {
      // Make high-usage materials critically low or out of stock
      currentStock = Math.floor(recommendedStock * 0.1);
      status = 'low';
    }
    
    if (materialId.includes('A3') || materialId.includes('C1')) {
      // Another set of materials with very low stock
      currentStock = Math.floor(recommendedStock * 0.25);
      status = 'low';
    }
    
    // Keep only a few materials at normal or excess levels for contrast
    if (materialId.includes('D4') || materialId.includes('C4')) {
      // Make rarely used materials have excess stock
      currentStock = Math.floor(recommendedStock * 1.5);
      status = 'excess';
    }
    
    result[materialId] = {
      currentStock,
      recommendedStock,
      status
    };
  });
  
  return result;
};

export default generateHistoricalData; 