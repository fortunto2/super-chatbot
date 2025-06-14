// System health check for image generation
import { imageWebsocketStore } from '@/lib/websocket/image-websocket-store';
import { imageMonitor } from './image-debug';

export interface SystemHealthReport {
  timestamp: number;
  websocket: {
    isConnected: boolean;
    totalHandlers: number;
    connectionHandlers: number;
    activeProjects: string[];
    currentUrl: string | null;
  };
  monitoring: {
    totalRequests: number;
    duplicateImages: number;
    mixedUpImages: number;
    recentErrors: number;
  };
  issues: string[];
  recommendations: string[];
}

export function performSystemHealthCheck(): SystemHealthReport {
  const websocketDebug = imageWebsocketStore.getDebugInfo();
  const monitoringDebug = imageMonitor.getDebugReport();
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check WebSocket health
  if (!websocketDebug.isConnected && websocketDebug.totalHandlers > 0) {
    issues.push('WebSocket disconnected but handlers exist');
    recommendations.push('Check network connection and restart WebSocket');
  }
  
  if (websocketDebug.totalHandlers > 8) {
    issues.push('Too many WebSocket handlers detected');
    recommendations.push('Consider cleaning up old handlers');
  }
  
  // Check for image mix-ups
  if (monitoringDebug.duplicateImages.length > 0) {
    issues.push(`${monitoringDebug.duplicateImages.length} duplicate images detected`);
    recommendations.push('Check for race conditions in image assignment');
  }
  
  if (monitoringDebug.mixedUpImages.length > 0) {
    issues.push(`${monitoringDebug.mixedUpImages.length} mixed-up images detected`);
    recommendations.push('Verify project isolation is working correctly');
  }
  
  // Check for recent errors
  const recentErrors = monitoringDebug.recentRequests.filter(
    req => req.status.includes('error') || req.status.includes('failed')
  ).length;
  
  if (recentErrors > 2) {
    issues.push(`${recentErrors} recent errors detected`);
    recommendations.push('Check API connectivity and authentication');
  }
  
  return {
    timestamp: Date.now(),
    websocket: {
      isConnected: websocketDebug.isConnected,
      totalHandlers: websocketDebug.totalHandlers,
      connectionHandlers: websocketDebug.connectionHandlers,
      activeProjects: websocketDebug.activeProjects,
      currentUrl: websocketDebug.currentUrl
    },
    monitoring: {
      totalRequests: monitoringDebug.totalRequests,
      duplicateImages: monitoringDebug.duplicateImages.length,
      mixedUpImages: monitoringDebug.mixedUpImages.length,
      recentErrors
    },
    issues,
    recommendations
  };
}

// Console helper function
export function logSystemHealth() {
  const report = performSystemHealthCheck();
  
  console.group('🔍 Image Generation System Health Check');
  console.log('📊 Report:', report);
  
  if (report.issues.length > 0) {
    console.group('⚠️ Issues Found:');
    report.issues.forEach(issue => console.warn(issue));
    console.groupEnd();
    
    console.group('💡 Recommendations:');
    report.recommendations.forEach(rec => console.info(rec));
    console.groupEnd();
  } else {
    console.log('✅ No issues detected');
  }
  
  console.groupEnd();
  
  return report;
}

// Auto-check function that can be called periodically
export function startPeriodicHealthCheck(intervalMs: number = 30000) {
  if (typeof window === 'undefined') return;
  
  const interval = setInterval(() => {
    const report = performSystemHealthCheck();
    
    // Only log if there are issues
    if (report.issues.length > 0) {
      console.warn('🚨 Image system health issues detected:', report.issues);
    }
  }, intervalMs);
  
  // Store interval ID for cleanup
  (window as any).imageHealthCheckInterval = interval;
  
  return () => clearInterval(interval);
}

// Stop periodic health check
export function stopPeriodicHealthCheck() {
  if (typeof window !== 'undefined' && (window as any).imageHealthCheckInterval) {
    clearInterval((window as any).imageHealthCheckInterval);
    delete (window as any).imageHealthCheckInterval;
  }
} 