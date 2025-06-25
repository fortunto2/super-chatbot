// Debugging utilities for image generation to help track issues

export interface ImageGenerationDebugInfo {
  projectId: string;
  requestId?: string;
  status: string;
  timestamp: number;
  imageUrl?: string;
  error?: string;
}

class ImageGenerationMonitor {
  private requests = new Map<string, ImageGenerationDebugInfo>();
  private maxRequests = 50; // Keep last 50 requests for debugging

  logRequest(info: ImageGenerationDebugInfo) {
    const key = `${info.projectId}_${info.requestId || 'no-id'}`;
    
    // Clean up old requests if we exceed limit
    if (this.requests.size >= this.maxRequests) {
      const oldestKey = Array.from(this.requests.keys())[0];
      if (oldestKey) {
        this.requests.delete(oldestKey);
      }
    }
    
    this.requests.set(key, {
      ...info,
      timestamp: Date.now()
    });
    
    console.log(`🔍 Image request logged:`, info);
  }

  getRequest(projectId: string, requestId?: string): ImageGenerationDebugInfo | undefined {
    const key = `${projectId}_${requestId || 'no-id'}`;
    return this.requests.get(key);
  }

  getAllRequests(): ImageGenerationDebugInfo[] {
    return Array.from(this.requests.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  detectDuplicateImages(): Array<{ imageUrl: string; requests: ImageGenerationDebugInfo[] }> {
    const imageMap = new Map<string, ImageGenerationDebugInfo[]>();
    
    for (const request of this.requests.values()) {
      if (request.imageUrl) {
        if (!imageMap.has(request.imageUrl)) {
          imageMap.set(request.imageUrl, []);
        }
        imageMap.get(request.imageUrl)?.push(request);
      }
    }
    
    // Return only images that appear in multiple requests
    return Array.from(imageMap.entries())
      .filter(([_, requests]) => requests.length > 1)
      .map(([imageUrl, requests]) => ({ imageUrl, requests }));
  }

  detectMixedUpImages(): Array<{
    projectId: string;
    suspiciousRequests: ImageGenerationDebugInfo[];
  }> {
    const projectMap = new Map<string, ImageGenerationDebugInfo[]>();
    
    for (const request of this.requests.values()) {
      if (!projectMap.has(request.projectId)) {
        projectMap.set(request.projectId, []);
      }
      projectMap.get(request.projectId)?.push(request);
    }
    
    const issues = [];
    for (const [projectId, requests] of projectMap.entries()) {
      const suspiciousRequests = requests.filter(req => 
        req.imageUrl && 
        // Check if this imageUrl appears in other projects
        Array.from(this.requests.values()).some(other => 
          other.projectId !== projectId && other.imageUrl === req.imageUrl
        )
      );
      
      if (suspiciousRequests.length > 0) {
        issues.push({ projectId, suspiciousRequests });
      }
    }
    
    return issues;
  }

  getDebugReport(): {
    totalRequests: number;
    duplicateImages: Array<{ imageUrl: string; requests: ImageGenerationDebugInfo[] }>;
    mixedUpImages: Array<{ projectId: string; suspiciousRequests: ImageGenerationDebugInfo[] }>;
    recentRequests: ImageGenerationDebugInfo[];
  } {
    return {
      totalRequests: this.requests.size,
      duplicateImages: this.detectDuplicateImages(),
      mixedUpImages: this.detectMixedUpImages(),
      recentRequests: this.getAllRequests().slice(0, 10)
    };
  }

  clear() {
    this.requests.clear();
    console.log('🧹 Image generation monitor cleared');
  }
}

// Singleton instance
export const imageMonitor = new ImageGenerationMonitor();

// Helper function to validate image assignments
export function validateImageAssignment(
  receivedProjectId: string,
  expectedProjectId: string,
  imageUrl: string,
  requestId?: string
): boolean {
  const isValid = receivedProjectId === expectedProjectId;
  
  if (!isValid) {
    console.error('🚨 IMAGE MIX-UP DETECTED!', {
      received: receivedProjectId,
      expected: expectedProjectId,
      imageUrl: imageUrl.substring(0, 100),
      requestId
    });
    
    // Log to monitor
    imageMonitor.logRequest({
      projectId: receivedProjectId,
      requestId,
      status: 'mix-up-detected',
      timestamp: Date.now(),
      imageUrl,
      error: `Image assigned to wrong project: expected ${expectedProjectId}, got ${receivedProjectId}`
    });
  }
  
  return isValid;
}

// Helper to get debug info for the console
export function getImageDebugInfo() {
  if (typeof window !== 'undefined') {
    (window as any).imageDebug = imageMonitor.getDebugReport();
    console.log('🔍 Image debug info available in window.imageDebug');
    return (window as any).imageDebug;
  }
  return imageMonitor.getDebugReport();
} 