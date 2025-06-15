#!/usr/bin/env tsx

import { spawn } from 'node:child_process';
import { join } from 'node:path';

const tests = [
  'openapi-client-test.ts',
  'media-settings-openapi-test.ts', 
  'media-settings-factory-test.ts'
];

async function runTest(testFile: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n🚀 Running ${testFile}...`);
    console.log('='.repeat(50));
    
    const testPath = join(__dirname, testFile);
    const child = spawn('npx', ['tsx', testPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        SUPERDUPERAI_TOKEN: process.env.SUPERDUPERAI_TOKEN || '9ab6d5b74e654a7887015a4fa2b10e7f',
        SUPERDUPERAI_URL: process.env.SUPERDUPERAI_URL || 'https://dev-editor.superduperai.co'
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} passed`);
        resolve(true);
      } else {
        console.log(`❌ ${testFile} failed with code ${code}`);
        resolve(false);
      }
    });
  });
}

async function runAllTests() {
  console.log('🧪 OpenAPI Integration Test Suite');
  console.log('==================================================');
  
  const results: boolean[] = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('==================================================');
  
  tests.forEach((test, index) => {
    const status = results[index] ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! OpenAPI integration is ready.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

runAllTests(); 