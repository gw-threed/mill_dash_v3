import { MillLogEntry, Mill } from '../types';

// Get default 5 weeks ago date (used as default)
export const getDefaultStartDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - 35); // 5 weeks = 35 days
  return date;
};

// Group logs by week for date range
export const groupLogsByWeek = (
  logs: MillLogEntry[], 
  startDate: Date = getDefaultStartDate(),
  endDate: Date = new Date()
): Record<string, MillLogEntry[]> => {
  const result: Record<string, MillLogEntry[]> = {};
  
  // Calculate the number of weeks in the range (rounded up)
  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekCount = Math.ceil(daysDifference / 7);
  
  // Initialize the weeks
  for (let i = 0; i < weekCount; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    
    // Ensure we don't go beyond the end date
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > endDate) {
      weekEnd.setTime(endDate.getTime());
    }
    
    const weekLabel = `Week ${i + 1}: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    result[weekLabel] = [];
  }
  
  // Filter logs within the date range
  const rangeLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
  
  // Group logs by week
  rangeLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    
    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      // Adjust if weekEnd exceeds endDate
      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime());
      }
      
      if (logDate >= weekStart && logDate <= weekEnd) {
        const weekLabel = `Week ${i + 1}: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
        result[weekLabel].push(log);
        break;
      }
    }
  });
  
  return result;
};

// Calculate mill utilization stats
export interface MillUtilization {
  millId: string;
  totalJobs: number;
  totalUnits: number;
  avgJobTime: number; // in hours
  utilization: number; // percentage
}

// Analyze mill performance over a date range, broken down by weeks
export const analyzeMillPerformance = (
  logs: MillLogEntry[], 
  mills: Mill[],
  startDate: Date = getDefaultStartDate(),
  endDate: Date = new Date()
): Record<string, MillUtilization[]> => {
  const weeklyLogs = groupLogsByWeek(logs, startDate, endDate);
  const result: Record<string, MillUtilization[]> = {};
  
  Object.entries(weeklyLogs).forEach(([weekLabel, weekLogs]) => {
    const millStats: Record<string, {
      jobsStarted: number;
      jobsCompleted: number;
      totalUnits: number;
      totalMillTime: number; // in milliseconds
    }> = {};
    
    // Initialize stats for each mill
    mills.forEach(mill => {
      millStats[mill.id] = {
        jobsStarted: 0,
        jobsCompleted: 0,
        totalUnits: 0,
        totalMillTime: 0
      };
    });
    
    // Group logs by puck to track job durations
    const puckJobs: Record<string, {
      millId: string;
      startTime: Date;
      endTime: Date | null;
      caseIds: string[];
    }> = {};
    
    // Process logs chronologically
    const orderedLogs = [...weekLogs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    orderedLogs.forEach(log => {
      // When a puck is moved to a mill, it starts a job
      if (log.newLocation.includes('A52') || 
          log.newLocation.includes('DWX') || 
          log.newLocation.includes('350i')) {
        const millId = log.newLocation.split('-')[0] + '-' + log.newLocation.split('-')[1];
        
        if (millStats[millId]) {
          millStats[millId].jobsStarted++;
          
          // Track job start
          puckJobs[log.puckId] = {
            millId,
            startTime: new Date(log.timestamp),
            endTime: null,
            caseIds: log.caseIds
          };
        }
      }
      // When a puck is moved out of a mill, it completes a job
      else if ((log.previousLocation.includes('A52') || 
               log.previousLocation.includes('DWX') || 
               log.previousLocation.includes('350i')) &&
               !log.newLocation.includes('A52') && 
               !log.newLocation.includes('DWX') && 
               !log.newLocation.includes('350i')) {
        
        const millId = log.previousLocation.split('-')[0] + '-' + log.previousLocation.split('-')[1];
        
        if (millStats[millId] && puckJobs[log.puckId] && puckJobs[log.puckId].startTime) {
          millStats[millId].jobsCompleted++;
          millStats[millId].totalUnits += log.caseIds.length;
          
          // Calculate job duration
          const endTime = new Date(log.timestamp);
          puckJobs[log.puckId].endTime = endTime;
          const duration = endTime.getTime() - puckJobs[log.puckId].startTime.getTime();
          millStats[millId].totalMillTime += duration;
        }
      }
    });
    
    // Calculate utilization metrics
    const weekUtilization: MillUtilization[] = mills.map(mill => {
      const stats = millStats[mill.id];
      const avgJobTime = stats.jobsCompleted > 0 
        ? stats.totalMillTime / stats.jobsCompleted / (1000 * 60 * 60) // convert to hours 
        : 0;
      
      // Calculate utilization: Time mill was in use / total time in week
      // Assuming 8-hour workdays, 5 days a week
      const totalWorkHours = 8 * 5; // 40 hours per week
      const millUtilizationHours = stats.totalMillTime / (1000 * 60 * 60);
      const utilization = Math.min(100, (millUtilizationHours / totalWorkHours) * 100);
      
      return {
        millId: mill.id,
        totalJobs: stats.jobsCompleted,
        totalUnits: stats.totalUnits,
        avgJobTime,
        utilization
      };
    });
    
    result[weekLabel] = weekUtilization;
  });
  
  return result;
};

// Analyze mill performance aggregated over the entire date range
export const analyzeAggregateMillPerformance = (
  logs: MillLogEntry[], 
  mills: Mill[],
  startDate: Date = getDefaultStartDate(),
  endDate: Date = new Date()
): MillUtilization[] => {
  // Filter logs within the date range
  const rangeLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });

  const millStats: Record<string, {
    jobsStarted: number;
    jobsCompleted: number;
    totalUnits: number;
    totalMillTime: number; // in milliseconds
  }> = {};
  
  // Initialize stats for each mill
  mills.forEach(mill => {
    millStats[mill.id] = {
      jobsStarted: 0,
      jobsCompleted: 0,
      totalUnits: 0,
      totalMillTime: 0
    };
  });
  
  // Group logs by puck to track job durations
  const puckJobs: Record<string, {
    millId: string;
    startTime: Date;
    endTime: Date | null;
    caseIds: string[];
  }> = {};
  
  // Process logs chronologically
  const orderedLogs = [...rangeLogs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  orderedLogs.forEach(log => {
    // When a puck is moved to a mill, it starts a job
    if (log.newLocation.includes('A52') || 
        log.newLocation.includes('DWX') || 
        log.newLocation.includes('350i')) {
      const millId = log.newLocation.split('-')[0] + '-' + log.newLocation.split('-')[1];
      
      if (millStats[millId]) {
        millStats[millId].jobsStarted++;
        
        // Track job start
        puckJobs[log.puckId] = {
          millId,
          startTime: new Date(log.timestamp),
          endTime: null,
          caseIds: log.caseIds
        };
      }
    }
    // When a puck is moved out of a mill, it completes a job
    else if ((log.previousLocation.includes('A52') || 
             log.previousLocation.includes('DWX') || 
             log.previousLocation.includes('350i')) &&
             !log.newLocation.includes('A52') && 
             !log.newLocation.includes('DWX') && 
             !log.newLocation.includes('350i')) {
      
      const millId = log.previousLocation.split('-')[0] + '-' + log.previousLocation.split('-')[1];
      
      if (millStats[millId] && puckJobs[log.puckId] && puckJobs[log.puckId].startTime) {
        millStats[millId].jobsCompleted++;
        millStats[millId].totalUnits += log.caseIds.length;
        
        // Calculate job duration
        const endTime = new Date(log.timestamp);
        puckJobs[log.puckId].endTime = endTime;
        const duration = endTime.getTime() - puckJobs[log.puckId].startTime.getTime();
        millStats[millId].totalMillTime += duration;
      }
    }
  });
  
  // Calculate utilization metrics
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalWorkDays = Math.min(totalDays, Math.floor(totalDays / 7) * 5 + Math.min(totalDays % 7, 5));
  
  return mills.map(mill => {
    const stats = millStats[mill.id];
    const avgJobTime = stats.jobsCompleted > 0 
      ? stats.totalMillTime / stats.jobsCompleted / (1000 * 60 * 60) // convert to hours 
      : 0;
    
    // Calculate utilization: Time mill was in use / total time in period
    // Assuming 8-hour workdays, 5 days a week
    const totalWorkHours = 8 * totalWorkDays;
    const millUtilizationHours = stats.totalMillTime / (1000 * 60 * 60);
    const utilization = Math.min(100, (millUtilizationHours / totalWorkHours) * 100);
    
    return {
      millId: mill.id,
      totalJobs: stats.jobsCompleted,
      totalUnits: stats.totalUnits,
      avgJobTime,
      utilization
    };
  });
};

// Analyze usage by material over a date range
export interface MaterialUsage {
  shade: string;
  thickness: string;
  totalJobs: number;
  totalUnits: number;
  pucksUsed: number;
}

export const analyzeMaterialUsage = (
  logs: MillLogEntry[], 
  pucks: any[],
  startDate: Date = getDefaultStartDate(),
  endDate: Date = new Date()
): MaterialUsage[] => {
  // Filter logs within the date range
  const rangeLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
  
  // Track which pucks were retired
  const retiredPucks = new Set<string>();
  
  // Track material usage by shade-thickness
  const materialUsage: Record<string, {
    shade: string;
    thickness: string;
    totalJobs: number;
    totalUnits: number;
    pucksUsed: Set<string>;
  }> = {};
  
  // Find logs where pucks were used in mills
  rangeLogs.forEach(log => {
    // Check if this log involves moving a puck to a mill
    if (log.newLocation.includes('A52') || 
        log.newLocation.includes('DWX') || 
        log.newLocation.includes('350i')) {
      
      // Find the puck data
      const puck = pucks.find(p => p.puckId === log.puckId);
      
      if (puck) {
        const materialKey = `${puck.shade}-${puck.thickness}`;
        
        // Initialize if this material hasn't been tracked yet
        if (!materialUsage[materialKey]) {
          materialUsage[materialKey] = {
            shade: puck.shade,
            thickness: puck.thickness,
            totalJobs: 0,
            totalUnits: 0,
            pucksUsed: new Set<string>()
          };
        }
        
        // Track the job
        materialUsage[materialKey].totalJobs++;
        materialUsage[materialKey].pucksUsed.add(puck.puckId);
        materialUsage[materialKey].totalUnits += log.caseIds.length;
      }
    }
    
    // Track retired pucks
    if (log.newLocation === 'retired' || log.lastJobTriggered) {
      retiredPucks.add(log.puckId);
    }
  });
  
  // Convert to array and sort by total jobs (highest first)
  return Object.values(materialUsage)
    .map(usage => ({
      shade: usage.shade,
      thickness: usage.thickness,
      totalJobs: usage.totalJobs,
      totalUnits: usage.totalUnits,
      pucksUsed: usage.pucksUsed.size
    }))
    .sort((a, b) => b.totalJobs - a.totalJobs);
}; 