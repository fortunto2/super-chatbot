// Run this in browser console to fix missing thumbnails
// Copy and paste this entire script into browser console

async function fixThumbnail(fileId) {
  try {
    // Get file data
    const fileResponse = await fetch(`/api/file/${fileId}`);
    const fileData = await fileResponse.json();
    
    console.log(`📁 File ${fileId}:`, {
      hasUrl: !!fileData.url,
      hasThumbnail: !!fileData.thumbnail_url,
      url: fileData.url,
      thumbnail_url: fileData.thumbnail_url
    });
    
    if (!fileData.thumbnail_url) {
      console.warn('❌ No thumbnail available for:', fileId);
      return false;
    }
    
    // Update database
    const updateResponse = await fetch(`/api/document?id=${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thumbnailUrl: fileData.thumbnail_url,
        metadata: {
          imageUrl: fileData.url,
          thumbnailUrl: fileData.thumbnail_url,
          fixedAt: new Date().toISOString()
        }
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Fixed thumbnail for:', fileId);
      return true;
    } else {
      console.error('❌ Failed to update:', updateResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Fix specific images
const imagesToFix = [
  'dfa614ca-2952-4459-a619-d7d62b5172ec', // mongoose
  'fda3fa8d-efcc-44c9-b776-10412acb259f', // cityscape
  'e1e9c355-1981-43db-8d60-69e5b44800e2'  // latest cityscape
];

console.log('🔧 Fixing thumbnails for existing images...');

for (const fileId of imagesToFix) {
  await fixThumbnail(fileId);
  await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
}

console.log('🎉 Thumbnail fixing completed! Check gallery now.'); 