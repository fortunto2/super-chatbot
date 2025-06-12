# Image Generation Debugging Guide

## Overview

This guide covers debugging and monitoring tools for the image generation system to help identify and resolve issues like image mix-ups, race conditions, and WebSocket problems.

## Recent Improvements

### 🔧 Major Fixes Applied

1. **Project ID Normalization**

   - Fixed critical issue where WebSocket sends `project.{id}` but handlers expect clean `{id}`
   - Automatic normalization of project IDs in all event processing
   - Strict validation with clean project ID matching

2. **Project-Specific Handler Isolation**

   - Each project now has its own isolated set of event handlers
   - Prevents cross-project event contamination
   - Maximum 3 handlers per project to prevent accumulation

3. **Unique Request Tracking**

   - Every image generation request gets a unique `requestId`
   - Format: `img_{timestamp}_{random}`
   - Used for precise event filtering and debugging

4. **Improved WebSocket Management**

   - Synchronous project cleanup to prevent race conditions
   - Better handler lifecycle management
   - Debounced connection attempts
   - Aggressive cleanup for React Strict Mode

5. **Enhanced Validation**

   - Strict project and request ID validation
   - Image assignment validation with mix-up detection
   - Comprehensive error logging

6. **Monitoring and Debug Tools**
   - Real-time monitoring of image requests
   - Automatic detection of duplicate/mixed-up images
   - System health checks
   - Browser console helpers

## Debug Tools

### 1. Quick Console Commands

The system automatically exposes debug helpers in the browser console:

```javascript
// Quick system health check
imageSystem.health();

// Debug information
imageSystem.debug();

// WebSocket status
imageSystem.ws();

// Force cleanup
imageSystem.cleanup();

// Test project ID validation
imageSystem.testProjectId("fa8e1835-a9af-44ad-9ce9-8df7fa92fd22");

// Handler distribution
imageSystem.handlers();

// Monitor for issues (30 seconds)
imageSystem.monitor(30000);
```

### 2. Image Monitor

Monitor all image generation requests and detect issues:

```javascript
// In browser console
import { getImageDebugInfo } from "@/lib/utils/image-debug";

// Get current debug info
const debugInfo = getImageDebugInfo();
console.log(debugInfo);

// Check for image mix-ups
console.log("Mixed up images:", debugInfo.mixedUpImages);
console.log("Duplicate images:", debugInfo.duplicateImages);
```

### 3. System Health Check

Check overall system health:

```javascript
// In browser console
import { logSystemHealth } from "@/lib/utils/image-system-check";

// Run health check
const report = logSystemHealth();

// Start periodic monitoring (every 30 seconds)
import { startPeriodicHealthCheck } from "@/lib/utils/image-system-check";
const stopCheck = startPeriodicHealthCheck(30000);

// Stop monitoring
stopCheck();
```

### 4. WebSocket Store Debug

Inspect WebSocket connection state:

```javascript
// In browser console
import { imageWebsocketStore } from "@/lib/websocket/image-websocket-store";

// Get detailed debug info
const wsDebug = imageWebsocketStore.getDebugInfo();
console.log("WebSocket Debug:", wsDebug);

// Force cleanup if needed
imageWebsocketStore.forceCleanup();
```

## Common Issues and Solutions

### Issue 1: Project ID Mismatch (FIXED)

**Symptoms:**

- Events ignored with message: `Event for different project (project.xxx vs xxx)`
- Images not updating despite WebSocket connection

**Root Cause:**

- WebSocket events contain `project.{id}` format
- Handlers expect clean `{id}` format
- Mismatch caused all events to be ignored

**Solution Applied:**

- Automatic project ID normalization in WebSocket store
- Clean ID extraction: `project.fa8e1835...` → `fa8e1835...`
- Normalized event data passed to handlers

**Debugging:**

```javascript
// Test project ID normalization
imageSystem.testProjectId("project.fa8e1835-a9af-44ad-9ce9-8df7fa92fd22");
```

### Issue 2: Handler Accumulation (FIXED)

**Symptoms:**

- Multiple handlers for same project
- Duplicate event processing
- Memory leaks

**Solution Applied:**

- Maximum 3 handlers per project
- Aggressive cleanup on unmount
- Force cleanup when limits exceeded

**Debugging:**

```javascript
// Check handler distribution
imageSystem.handlers();

// Force cleanup if needed
imageSystem.cleanup();
```

### Issue 3: React Strict Mode Issues (FIXED)

**Symptoms:**

- Multiple mount/unmount cycles
- Handler accumulation during development

**Solution Applied:**

- Immediate cleanup without timeouts
- Handler limit detection and force cleanup
- Proper dependency arrays in useEffect

## Console Commands for Quick Debugging

The system automatically exposes helpers in the browser console:

```javascript
// Quick system status
imageSystem.health();

// Debug project validation
imageSystem.testProjectId("your-project-id");

// Monitor for 1 minute
const stopMonitoring = imageSystem.monitor(60000);

// Clean everything
imageSystem.cleanup();
```

## Troubleshooting Steps

1. **Open browser console**
2. **Quick health check**: `imageSystem.health()`
3. **Check project validation**: `imageSystem.testProjectId('your-project-id')`
4. **Inspect handlers**: `imageSystem.handlers()`
5. **Monitor for issues**: `imageSystem.monitor(30000)`
6. **Force cleanup if needed**: `imageSystem.cleanup()`

## Performance Impact

The monitoring system is designed to be lightweight:

- Maximum 50 requests tracked in memory
- Maximum 3 handlers per project
- Automatic cleanup of old data
- Minimal CPU overhead for validation
- Only logs issues when detected
- Console helpers only loaded in development

## Future Improvements

Potential areas for enhancement:

- Persistent logging to server
- Real-time dashboard for monitoring
- Automated issue resolution
- Performance metrics collection
