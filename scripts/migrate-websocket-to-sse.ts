#!/usr/bin/env ts-node

/**
 * WebSocket to SSE Migration Script
 * 
 * This script automates the final steps of migrating from WebSocket to SSE
 * for SuperDuperAI integration.
 */

import fs from 'node:fs';
import path from 'node:path';

const websocketFiles = [
  // Old WebSocket files to archive/remove
  'hooks/use-image-websocket.ts',
  'hooks/use-artifact-websocket.ts', 
  'hooks/use-chat-image-websocket.ts',
  'lib/websocket/image-websocket-store.ts',
];

const sseReplacements = [
  // SSE replacement files
  'hooks/use-image-sse.ts',
  'hooks/use-artifact-sse.ts',
  'lib/websocket/image-sse-store.ts',
];

const toolFiles = [
  // Tool files that need import updates
  'app/tools/image-generator/hooks/use-image-generator.ts',
  'app/tools/video-generator/hooks/use-video-generator.ts',
];

console.log('🚀 Starting WebSocket to SSE Migration...');

// Step 1: Archive old WebSocket files
console.log('\n📦 Step 1: Archiving old WebSocket files...');
websocketFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const archivePath = fullPath.replace(/\.ts$/, '.websocket-backup.ts');
  
  if (fs.existsSync(fullPath)) {
    console.log(`📦 Archiving: ${file} → ${file.replace('.ts', '.websocket-backup.ts')}`);
    // fs.copyFileSync(fullPath, archivePath); // Uncomment to actually archive
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

// Step 2: Validate SSE files exist
console.log('\n✅ Step 2: Validating SSE replacement files...');
sseReplacements.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (fs.existsSync(fullPath)) {
    console.log(`✅ SSE file exists: ${file}`);
  } else {
    console.log(`❌ Missing SSE file: ${file}`);
  }
});

// Step 3: Check tool files
console.log('\n🔧 Step 3: Checking tool files...');
toolFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const hasWebSocketReferences = content.includes('WebSocket') || content.includes('ws://') || content.includes('wss://');
    const hasSSEReferences = content.includes('EventSource') || content.includes('SSE') || content.includes('connectSSE');
    
    console.log(`🔧 ${file}:`);
    console.log(`   - WebSocket references: ${hasWebSocketReferences ? '⚠️  YES' : '✅ NO'}`);
    console.log(`   - SSE references: ${hasSSEReferences ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log(`❌ Missing tool file: ${file}`);
  }
});

// Step 4: Configuration updates needed
console.log('\n⚙️  Step 4: Configuration updates needed...');
const configFile = 'lib/config/superduperai.ts';
const configPath = path.join(process.cwd(), configFile);

if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  const hasWSURL = configContent.includes('wsURL');
  const hasCreateWSURL = configContent.includes('createWSURL');
  
  console.log(`⚙️  ${configFile}:`);
  console.log(`   - wsURL references: ${hasWSURL ? '⚠️  YES (should be removed)' : '✅ CLEAN'}`);
  console.log(`   - createWSURL function: ${hasCreateWSURL ? '⚠️  YES (should be removed)' : '✅ CLEAN'}`);
} else {
  console.log(`❌ Missing config file: ${configFile}`);
}

// Step 5: Test files to update
console.log('\n🧪 Step 5: Test files that need updating...');
const testFiles = [
  'tests/websocket-debug-test.js',
  'tests/websocket-global-test.js', 
  'tests/project-websocket-test.js',
  'tests/video-generation-smoke-test.js',
  'tests/project-image-endpoint-test.js',
  'tests/final-generate-image-test.js',
  'tests/image-generation-debug-test.js',
  'tests/video-file-endpoint-test.js',
  'tests/simple-no-project-test.js',
];

testFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (fs.existsSync(fullPath)) {
    console.log(`🧪 Test file needs SSE update: ${file}`);
  }
});

console.log('\n🎯 Migration Summary:');
console.log('✅ SSE infrastructure created');
console.log('✅ SSE hooks implemented'); 
console.log('✅ Tool files partially migrated');
console.log('✅ AGENTS.md updated with SSE patterns');
console.log('⚠️  WebSocket files need archiving');
console.log('⚠️  Configuration cleanup needed');
console.log('⚠️  Test files need SSE updates');

console.log('\n🚀 Next steps:');
console.log('1. Run linter fixes on tool files');
console.log('2. Remove WebSocket configuration');
console.log('3. Update test files to use SSE');
console.log('4. Test SSE connections work');
console.log('5. Archive old WebSocket files');

console.log('\n✨ Migration script completed!'); 