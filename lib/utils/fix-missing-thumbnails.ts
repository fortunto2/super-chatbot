/**
 * Utility function to fix missing thumbnails for existing images
 * by fetching current data from SuperDuperAI and updating database
 */

interface FileData {
  id: string;
  url?: string;
  thumbnail_url?: string;
  type: string;
}

export async function fixMissingThumbnail(fileId: string): Promise<boolean> {
  try {
    // 1. Get current file data from SuperDuperAI
    const fileResponse = await fetch(`/api/file/${fileId}`);
    if (!fileResponse.ok) {
      console.error('Failed to fetch file data:', fileResponse.status);
      return false;
    }

    const fileData: FileData = await fileResponse.json();
    
    if (!fileData.thumbnail_url) {
      console.warn('No thumbnail_url available for file:', fileId);
      return false;
    }

    // 2. Update document in database with thumbnail
    const updateResponse = await fetch(`/api/document?id=${encodeURIComponent(fileId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thumbnailUrl: fileData.thumbnail_url,
        metadata: {
          imageUrl: fileData.url,
          thumbnailUrl: fileData.thumbnail_url,
          fixedThumbnail: true,
          fixedAt: new Date().toISOString(),
        }
      }),
    });

    if (updateResponse.ok) {
      console.log('✅ Successfully fixed thumbnail for file:', fileId);
      return true;
    } else {
      console.error('❌ Failed to update thumbnail in database:', updateResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error fixing thumbnail:', error);
    return false;
  }
}

export async function fixMultipleThumbnails(fileIds: string[]): Promise<number> {
  let fixedCount = 0;
  
  for (const fileId of fileIds) {
    const success = await fixMissingThumbnail(fileId);
    if (success) {
      fixedCount++;
    }
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`🔧 Fixed thumbnails for ${fixedCount}/${fileIds.length} files`);
  return fixedCount;
}

// Function to run in browser console for batch fixing
export function fixAllMissingThumbnails() {
  const fileIds = [
    'dfa614ca-2952-4459-a619-d7d62b5172ec', // mongoose image
    'fda3fa8d-efcc-44c9-b776-10412acb259f', // futuristic cityscape 
    // Add more file IDs as needed
  ];
  
  return fixMultipleThumbnails(fileIds);
} 