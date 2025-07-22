import { generateObject } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { AISDKExporter } from 'langsmith/vercel';

// Initialize Azure provider
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
});

// Available models with their character limits and capabilities
const MODEL_CONFIG = {
  'gpt-4.1': {
    name: 'GPT-4.1',
    deploymentName: 'gpt-4.1', // Real deployment name in Azure
    maxChars: { short: 500, medium: 1000, long: 2000 },
    maxTokens: { short: 150, medium: 300, long: 600 },
    supportsSystem: true,
    isReasoning: false,
    type: 'chat' // standard chat model
  }
} as const;

// Types for dynamic schema
type BaseVEO3Schema = {
  scene_description: z.ZodString;
  visual_style: z.ZodString;
  camera_movement: z.ZodString;
  main_subject: z.ZodString;
  background_setting: z.ZodString;
  lighting_mood: z.ZodString;
  color_palette: z.ZodString;
};

type ExtendedVEO3Schema = BaseVEO3Schema & {
  audio_cue?: z.ZodString;
  character_speech?: z.ZodOptional<z.ZodArray<z.ZodObject<{
    character_name: z.ZodString;
    dialogue: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
  }>>>;
  character_details?: z.ZodOptional<z.ZodString>;
  action_sequence?: z.ZodOptional<z.ZodString>;
  cinematography_notes?: z.ZodOptional<z.ZodString>;
  safety_compliance?: z.ZodOptional<z.ZodString>;
  total_character_count: z.ZodNumber;
  focus_areas: z.ZodArray<z.ZodString>;
};

// Dynamic schema builder for VEO3 structured outputs
function createVEO3Schema(focusTypes: string[], includeAudio: boolean, hasCharacterSpeech: boolean) {
  // Base schema that's always present
  const baseSchema: ExtendedVEO3Schema = {
    scene_description: z.string().describe('Detailed description of the overall scene, what\'s happening, who\'s involved, and general atmosphere'),
    visual_style: z.string().describe('Overall look and feel - specify if cinematic, realistic, animated, stylized, or surreal'),
    camera_movement: z.string().describe('Specific camera movements - slow pan, static shot, tracking shot, aerial zoom, etc.'),
    main_subject: z.string().describe('Primary person, character, or object that should be the focus of the video'),
    background_setting: z.string().describe('Specific location or environment where scene takes place'),
    lighting_mood: z.string().describe('Type of lighting and emotional tone - golden hour, dramatic shadows, soft lighting, etc.'),
    color_palette: z.string().describe('Dominant colors or tones - bold, pastel, muted, monochrome, warm, cool, etc.'),
    total_character_count: z.number().describe('Total character count of the enhanced prompt'),
    focus_areas: z.array(z.string()).describe('Applied focus types for this enhancement')
  };

  // Conditionally add audio section based on settings
  if (includeAudio) {
    baseSchema.audio_cue = z.string().describe('Detailed sound design: character dialogue, ambient sounds, music, sound effects, voice characteristics');
  }

  // Add character speech extraction if we have characters with speech
  // Make this optional and simpler to avoid token overflow
  if (hasCharacterSpeech) {
    baseSchema.character_speech = z.array(z.object({
      character_name: z.string().describe('Name or identifier of the character'),
      dialogue: z.string().describe('Exact speech/dialogue in original language'),
      language: z.string().optional().describe('Language of the dialogue if specified')
    })).optional().describe('Extracted character speech information for audio processing');
  }

  // Add focus-specific optional fields - make them all optional to save tokens
  if (focusTypes.includes('character')) {
    baseSchema.character_details = z.string().optional().describe('Additional character appearance, expressions, and personality details');
  }

  if (focusTypes.includes('action')) {
    baseSchema.action_sequence = z.string().optional().describe('Detailed breakdown of movements, timing, and dynamic interactions');
  }

  if (focusTypes.includes('cinematic')) {
    baseSchema.cinematography_notes = z.string().optional().describe('Professional filming techniques, composition, and visual effects');
  }

  if (focusTypes.includes('safe')) {
    baseSchema.safety_compliance = z.string().optional().describe('Notes on content safety and family-friendly elements');
  }

  return z.object(baseSchema);
}

// Request schema validation
const enhancePromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  customLimit: z.number().min(200).max(10000).default(1000),
  model: z.enum(['gpt-4.1']).default('gpt-4.1'),
  focusType: z.string().optional(), // Can be comma-separated list of focus types
  includeAudio: z.boolean().default(true),
  promptData: z.object({
    characters: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      speech: z.string()
    })).optional(),
    language: z.string().optional()
  }).optional(),
  // New: Moodboard images support
  moodboard: z.object({
    images: z.array(z.object({
      id: z.string(),
      url: z.string().url('Invalid image URL').optional(), // Make URL optional
      base64: z.string().optional(), // Alternative to URL
      tags: z.array(z.enum(['character', 'style', 'background', 'lighting', 'mood', 'action'])),
      description: z.string().optional(),
      weight: z.number().min(0.1).max(1.0).default(1.0) // Influence weight
    })).refine(
      (images) => images.every(img => img.url || img.base64),
      { message: "Each image must have either url or base64" }
    ),
    enabled: z.boolean().default(false)
  }).optional()
});

export async function POST(req: NextRequest) {
  try {
    // Check environment variables (only resource name and API key needed)
    if (!process.env.AZURE_OPENAI_RESOURCE_NAME || !process.env.AZURE_OPENAI_API_KEY) {
      console.error('Missing Azure OpenAI environment variables');
      return NextResponse.json(
        { error: 'Azure OpenAI not configured. Please set AZURE_OPENAI_RESOURCE_NAME and AZURE_OPENAI_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { prompt, customLimit, model, focusType, includeAudio, promptData, moodboard } = enhancePromptSchema.parse(body);
    
    console.log('Enhancement request:', { 
      prompt: prompt.substring(0, 100) + '...', 
      customLimit, 
      model, 
      focusType, 
      includeAudio,
      moodboardEnabled: moodboard?.enabled || false,
      imageCount: moodboard?.images?.length || 0
    });

    // Process focus types
    const focusTypes = focusType ? focusType.split(',').map(type => type.trim()) : [];
    
    // Check if we have characters with speech
    const hasCharacterSpeech = includeAudio && promptData?.characters?.some(char => char.speech.trim()) || false;

    // Process moodboard images
    let moodboardContext = '';
    let moodboardImages: Array<{ type: 'image'; image: string }> = [];
    
    if (moodboard?.enabled && moodboard.images?.length > 0) {
      // Group images by tags for better organization
      const imagesByTag: Record<string, Array<{ id: string; description?: string; weight: number; index: number; tags: string[] }>> = {};
      
      moodboard.images.forEach((img, index) => {
        img.tags.forEach(tag => {
          if (!imagesByTag[tag]) imagesByTag[tag] = [];
          imagesByTag[tag].push({
            ...img,
            index: index + 1
          });
        });
      });
      
      // Build moodboard context for prompt
      const tagDescriptions = {
        character: 'character appearance, expressions, clothing, and personality traits',
        style: 'visual style, artistic approach, cinematography, and overall aesthetic',
        background: 'environments, settings, locations, and background elements',
        lighting: 'lighting conditions, mood, time of day, and atmospheric effects',
        mood: 'emotional tone, atmosphere, and feeling',
        action: 'movements, activities, dynamics, and interactions'
      };
      
      moodboardContext = '\n\nMOODBOARD VISUAL REFERENCES:\n';
      moodboardContext += 'The user has provided visual references to guide the enhancement. PRIORITIZE incorporating these visual elements prominently into the appropriate VEO3 sections:\n\n';
      
      Object.entries(imagesByTag).forEach(([tag, images]) => {
        moodboardContext += `${tag.toUpperCase()} REFERENCES (${images.length} image${images.length > 1 ? 's' : ''}):\n`;
        images.forEach(img => {
          moodboardContext += `- Image ${img.index}${img.description ? `: ${img.description}` : ''} (weight: ${img.weight}) - INTEGRATE PROMINENTLY\n`;
        });
        moodboardContext += `MANDATORY: Incorporate specific visual elements from these references into ${tagDescriptions[tag as keyof typeof tagDescriptions]} sections. Reference the moodboard images directly in your descriptions.\n\n`;
      });
      
      // Prepare images for multimodal API call - ensure we have valid image data
      moodboardImages = moodboard.images
        .filter(img => img.url || img.base64) // Only include images with valid data
        .map(img => ({
          type: 'image' as const,
          image: img.url || `data:image/jpeg;base64,${img.base64}`
        }));
    }

    // Extract character speech for context
    let characterSpeechInfo = '';
    if (hasCharacterSpeech && promptData?.characters) {
      const charactersWithSpeech = promptData.characters.filter(char => char.speech.trim());
      characterSpeechInfo = `\n\nCHARACTER SPEECH CONTEXT:\n${charactersWithSpeech.map(char => 
        `- ${char.name || 'Character'}: "${char.speech}" ${promptData.language ? `(in ${promptData.language})` : ''}`
      ).join('\n')}\n`;
    }

    const modelConfig = MODEL_CONFIG[model];
    // Reduce target by 25% to avoid overruns and give buffer for formatting
    const targetChars = Math.floor(customLimit * 0.75);
    const maxChars = customLimit; // Keep original for response
    // Calculate tokens more generously for structured outputs (roughly 3 chars per token + buffer)
    const maxTokens = Math.min(Math.ceil(customLimit / 2.5) + 500, 4000); // More generous token limit with buffer

    // Create focus-specific instruction
    const focusInstructions = {
      character: 'FOCUS ON CHARACTER: Pay special attention to character development, appearance details, facial expressions, body language, and personality traits. Allocate extra detail budget to character descriptions.',
      action: 'FOCUS ON ACTION: Emphasize dynamic movements, activities, and sequences. Add details about how actions unfold, timing, and physical interactions with the environment.',
      cinematic: 'FOCUS ON CINEMATOGRAPHY: Enhance camera work, lighting, and visual composition with professional filming techniques. Focus on visual storytelling and cinematic quality.',
      safe: 'SAFE CONTENT MODE: Ensure all content strictly complies with Google VEO3 content policies. Focus on family-friendly, educational, artistic content suitable for all audiences.'
    };

    // Build focus instruction
    let focusInstruction = '';
    if (focusTypes.length > 0) {
      const validFocusTypes = focusTypes.filter(type => type in focusInstructions);
      if (validFocusTypes.length > 0) {
        const instructions = validFocusTypes.map(type => focusInstructions[type as keyof typeof focusInstructions]);
        focusInstruction = `\n\nAPPLIED FOCUS STRATEGIES:\n${instructions.join('\n\n')}\n`;
      }
    }

    // Create dynamic schema based on settings
    const veo3Schema = createVEO3Schema(focusTypes, includeAudio, hasCharacterSpeech);

    const enhancementPrompt = `Enhance this VEO3 video prompt using structured output format. Target length: ${targetChars} characters (max: ${maxChars}): "${prompt}"${focusInstruction}${characterSpeechInfo}${moodboardContext}

CRITICAL REQUIREMENTS:
1. LANGUAGE: Write everything in ENGLISH except preserve direct speech in original language
2. LENGTH: Stay under ${targetChars} characters total across all sections
3. STRUCTURE: Use the exact VEO3 format with all required sections
4. QUALITY: Professional video production terminology and specific details
${moodboard?.enabled ? '5. VISUAL REFERENCES: Incorporate visual elements from the provided moodboard images into relevant sections' : ''}

VEO3 ENHANCEMENT GUIDELINES:
- Scene Description: Overall action, participants, atmosphere
- Visual Style: Cinematic look - realistic, animated, stylized, surreal
- Camera Movement: Specific movements - pan, tracking, static, aerial
- Main Subject: Primary focus person/character/object  
- Background Setting: Specific location and environment
- Lighting/Mood: Lighting type and emotional tone
- Color Palette: Dominant colors and visual tones
${includeAudio ? '- Audio Cue: Sound design, dialogue, ambient sounds, music' : ''}

${moodboard?.enabled ? `MOODBOARD INTEGRATION INSTRUCTIONS:
- Analyze the provided ${moodboard.images?.length || 0} reference image(s)
- Extract visual elements relevant to each VEO3 section
- Prioritize images with higher weight values
- Maintain consistency with the original prompt intent
- Use specific visual details from the references
- IMPORTANT: Make direct references to "the moodboard image" or "reference image" in your descriptions
- MANDATORY: Transform at least 30% of each tagged section to reflect the visual references

` : ''}SMART LENGTH DISTRIBUTION:
${focusTypes.includes('character') ? '- Allocate 30% to character descriptions and main subject' : ''}
${focusTypes.includes('action') ? '- Allocate 25% each to scene description and camera movement' : ''}
${focusTypes.includes('cinematic') ? '- Allocate 25% to camera movement, 20% each to visual style and lighting' : ''}
${focusTypes.includes('safe') ? '- Ensure all content is family-friendly and policy-compliant' : ''}

ENHANCEMENT PRINCIPLES:
1. Preserve original intent and core elements
2. Add cinematic and technical details
3. Include vivid sensory descriptions
4. Specify professional video terminology
5. Maintain original style and tone
6. Add cultural context (described in English)
7. Include specific color and lighting details
8. Preserve direct speech in original language
${moodboard?.enabled ? '9. Incorporate visual references from moodboard images' : ''}

Generate a structured enhancement that follows VEO3 format exactly.`;

    // Configure model for structured output
    const modelInstance = azure(modelConfig.deploymentName);
    
    // Prepare messages for multimodal input
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert VEO3 video prompt engineer with structured output capabilities. 

CRITICAL INSTRUCTIONS:
1. Generate content that EXACTLY fits the character limit: ${targetChars} characters
2. Use professional video production terminology
3. Write everything in ENGLISH except preserve direct speech in original language
4. Follow VEO3 structure precisely
5. Apply focus-specific enhancements as requested
6. Include character count tracking
7. Extract character speech information if present
${moodboard?.enabled ? '8. Analyze provided moodboard images and incorporate visual elements' : ''}

FOCUS STRATEGY APPLICATION:
${focusTypes.map(type => `- ${type.toUpperCase()}: ${focusInstructions[type as keyof typeof focusInstructions]}`).join('\n')}

Your output will be automatically formatted for VEO3 usage.`
      },
      {
        role: 'user' as const,
        content: moodboardImages.length > 0 ? [
          { type: 'text' as const, text: enhancementPrompt },
          ...moodboardImages
        ] : enhancementPrompt
      }
    ];
    
    const result = await generateObject({
      model: modelInstance,
      maxTokens: maxTokens,
      temperature: 0.7, // Add some creativity but keep it controlled
      messages,
      schema: veo3Schema,
      // Explicitly specify schema name and description for better LLM guidance
      schemaName: 'VEO3VideoPromptEnhancement',
      schemaDescription: `Enhanced VEO3 video prompt with dynamic structured output. Contains ${includeAudio ? 'audio-enabled' : 'audio-disabled'} sections${hasCharacterSpeech ? ' with character speech extraction' : ''}${focusTypes.length > 0 ? ` and focus enhancements for: ${focusTypes.join(', ')}` : ''}${moodboard?.enabled ? ` with ${moodboard.images?.length || 0} moodboard image references` : ''}. Target length: ${targetChars} characters.`,
      // LangSmith telemetry integration via AI SDK
      experimental_telemetry: AISDKExporter.getSettings({
        runName: 'VEO3_Prompt_Enhancement',
        metadata: {
          user_id: 'veo3_generator',
          prompt_type: 'video_enhancement',
          model_used: model,
          focus_types: focusTypes.join(','),
          character_limit: customLimit,
          has_moodboard: moodboard?.enabled || false
        }
      })
    });

    // Format the structured output back to VEO3 format
    const structuredData = result.object;
    
    // Build the formatted prompt
    let formattedPrompt = `SCENE DESCRIPTION: ${structuredData.scene_description}

VISUAL STYLE: ${structuredData.visual_style}

CAMERA MOVEMENT: ${structuredData.camera_movement}

MAIN SUBJECT: ${structuredData.main_subject}

BACKGROUND SETTING: ${structuredData.background_setting}

LIGHTING/MOOD: ${structuredData.lighting_mood}`;

    // Add audio section if enabled
    if (includeAudio && 'audio_cue' in structuredData) {
      formattedPrompt += `\n\nAUDIO CUE: ${structuredData.audio_cue}`;
    }

    formattedPrompt += `\n\nCOLOR PALETTE: ${structuredData.color_palette}`;

    // Calculate actual character count
    const actualCharCount = formattedPrompt.length;
    
    // Prepare response with structured data and metadata
    const response = {
      enhancedPrompt: formattedPrompt,
      characterCount: actualCharCount,
      characterLimit: maxChars,
      targetCharacters: targetChars,
      model: modelConfig.name,
      focusTypes: structuredData.focus_areas || focusTypes,
      includeAudio,
      metadata: {
        structuredData,
        hasCharacterSpeech,
        speechExtracted: hasCharacterSpeech ? structuredData.character_speech : null,
        focusEnhancements: {
          character: focusTypes.includes('character') ? structuredData.character_details : null,
          action: focusTypes.includes('action') ? structuredData.action_sequence : null,
          cinematic: focusTypes.includes('cinematic') ? structuredData.cinematography_notes : null,
          safe: focusTypes.includes('safe') ? structuredData.safety_compliance : null
        },
        moodboard: moodboard?.enabled ? {
          enabled: true,
          imageCount: moodboard.images?.length || 0,
          tags: [...new Set(moodboard.images?.flatMap(img => img.tags) || [])],
          totalWeight: moodboard.images?.reduce((sum, img) => sum + img.weight, 0) || 0
        } : {
          enabled: false,
          imageCount: 0,
          tags: [],
          totalWeight: 0
        }
      }
    };

    console.log('Enhanced prompt generated:', { 
      actualCharCount, 
      targetChars, 
      focusTypes, 
      includeAudio,
      structuredFields: Object.keys(structuredData)
    });

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Enhancement error:', error);
    
    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    if (error instanceof Error && error.message?.includes('content filter')) {
      return NextResponse.json(
        { error: 'Content was filtered. Please modify your prompt and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to enhance prompt. Please try again.' },
      { status: 500 }
    );
  }
} 