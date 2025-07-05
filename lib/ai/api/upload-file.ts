import type { FileTypeEnum } from '@/lib/api';

export const uploadFile = async (file: File, type?: FileTypeEnum) => {
    try {
        console.log('🖼️ Attempting direct file upload...', file);
        const { FileService } = await import('@/lib/api/services/FileService');
     
        const uploadResult = await FileService.fileUpload({
          type,
          formData: {
            payload: file
          }
        });
        
       return uploadResult;
      } catch (uploadError) {
        console.warn('⚠️ Upload failed, trying fallback methods...', uploadError);
        throw new Error('Upload failed', {cause: uploadError});
      }
};
