#!/usr/bin/env node

/**
 * Document Thumbnail Smoke Test
 * Ensures updateDocumentThumbnail function exists and can be called.
 */

const { updateDocumentThumbnail } = require('../lib/db/queries');

(async () => {
  try {
    const promise = updateDocumentThumbnail({
      id: 'test-id',
      userId: 'user-id',
      thumbnailUrl: 'https://example.com/thumb.png',
    });
    if (!promise || typeof promise.then !== 'function') {
      throw new Error('updateDocumentThumbnail did not return a promise');
    }
    console.log('✅ updateDocumentThumbnail callable');
  } catch (err) {
    console.error('❌ Smoke test failed:', err.message);
    process.exitCode = 1;
  }
})();
