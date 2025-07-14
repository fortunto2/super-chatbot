import { tool } from 'ai';
import { z } from 'zod';
import { getAvailableImageModels, configureSuperduperAI } from '@/lib/config/superduperai-client';
import { getStyles } from '@/lib/ai/api/get-styles';
import { SHOT_SIZES } from '@/lib/config/video-constants';

export const diagnoseImageGeneration = tool({
  description: 'Diagnose image generation issues by checking available models, styles, and configuration compatibility',
  parameters: z.object({
    checkModels: z.boolean().optional().describe('Check available image models'),
    checkStyles: z.boolean().optional().describe('Check available styles'),
    checkShotSizes: z.boolean().optional().describe('Check shot size enum values'),
    modelName: z.string().optional().describe('Specific model to check availability'),
    styleName: z.string().optional().describe('Specific style to check availability'),
  }),
  execute: async ({ checkModels = true, checkStyles = true, checkShotSizes = true, modelName, styleName }) => {
    const results: string[] = [];
    
    try {
      // Configure SuperDuperAI first
      configureSuperduperAI();
      results.push('✅ SuperDuperAI configuration loaded');
      
      // Check models
      if (checkModels) {
        try {
          const models = await getAvailableImageModels();
          results.push(`📊 Available image models: ${models.length}`);
          
          const modelsList = models.map(m => `  - ${m.name} (${m.label || 'No label'}) - ${m.type} - Source: ${m.source}`);
          results.push('🔧 Models list:');
          results.push(...modelsList);
          
          // Check specific model
          if (modelName) {
            const specificModel = models.find(m => m.name === modelName);
            if (specificModel) {
              results.push(`✅ Model "${modelName}" found:`, JSON.stringify(specificModel, null, 2));
            } else {
              results.push(`❌ Model "${modelName}" NOT found. Available models: ${models.map(m => m.name).join(', ')}`);
            }
          }
          
          // Check for comfyui/flux specifically (common issue)
          const fluxModel = models.find(m => m.name === 'comfyui/flux');
          if (fluxModel) {
            results.push('✅ comfyui/flux model available');
          } else {
            results.push('❌ comfyui/flux model NOT available - this may cause ROLLBACK issues');
            const alternatives = models.filter(m => m.name.includes('flux')).map(m => m.name);
            if (alternatives.length > 0) {
              results.push(`🔄 Alternative FLUX models: ${alternatives.join(', ')}`);
            }
          }
          
        } catch (error) {
          results.push(`❌ Error loading models: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Check styles
      if (checkStyles) {
        try {
          const stylesResponse = await getStyles();
          if ('error' in stylesResponse) {
            results.push(`❌ Error loading styles: ${stylesResponse.error}`);
          } else {
            results.push(`📊 Available styles: ${stylesResponse.items.length}`);
            
            const stylesList = stylesResponse.items.slice(0, 10).map(s => `  - ${s.name} (${s.title || 'No title'})`);
            results.push('🎨 Styles (first 10):');
            results.push(...stylesList);
            
            // Check specific style
            if (styleName) {
              const specificStyle = stylesResponse.items.find(s => s.name === styleName);
              if (specificStyle) {
                results.push(`✅ Style "${styleName}" found`);
              } else {
                results.push(`❌ Style "${styleName}" NOT found`);
              }
            }
            
            // Check for realistic style specifically
            const realisticStyle = stylesResponse.items.find(s => s.name === 'realistic');
            if (realisticStyle) {
              results.push('✅ "realistic" style available');
            } else {
              results.push('❌ "realistic" style NOT available - this may cause ROLLBACK issues');
            }
          }
        } catch (error) {
          results.push(`❌ Error loading styles: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Check shot sizes
      if (checkShotSizes) {
        results.push(`📊 Available shot sizes: ${SHOT_SIZES.length}`);
        const shotSizesList = SHOT_SIZES.map(s => `  - ID: "${s.id}", Label: "${s.label}"`);
        results.push('📐 Shot sizes:');
        results.push(...shotSizesList);
        
        // Check medium shot specifically (from logs)
        const mediumShot = SHOT_SIZES.find(s => s.id === 'medium_shot' || s.label === 'Medium Shot');
        if (mediumShot) {
          results.push(`✅ Medium shot found: ID="${mediumShot.id}", Label="${mediumShot.label}"`);
        } else {
          results.push('❌ Medium shot NOT found in shot sizes list');
        }
      }
      
      return {
        success: true,
        diagnostics: results.join('\n'),
        summary: `Diagnostic completed. Found ${checkModels ? 'models' : ''} ${checkStyles ? 'styles' : ''} ${checkShotSizes ? 'shot-sizes' : ''}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown diagnostic error',
        diagnostics: results.join('\n')
      };
    }
  },
}); 