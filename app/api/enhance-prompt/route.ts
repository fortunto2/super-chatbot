import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

interface EnhancementRequest {
  originalPrompt: string;
  mediaType?: 'image' | 'video' | 'text' | 'general';
  enhancementLevel?: 'basic' | 'detailed' | 'creative';
  targetAudience?: string;
  includeNegativePrompt?: boolean;
  modelHint?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancementRequest = await request.json();
    
    console.log('🚀 API: enhance-prompt called with:', body);

    if (!body.originalPrompt) {
      return NextResponse.json(
        { error: 'originalPrompt is required' },
        { status: 400 }
      );
    }

    // Set defaults
    const {
      originalPrompt,
      mediaType = 'general',
      enhancementLevel = 'detailed',
      targetAudience,
      includeNegativePrompt = false,
      modelHint,
    } = body;

    // Build system prompt based on media type and enhancement level
    const systemPrompt = buildSystemPrompt(mediaType, enhancementLevel, modelHint);
    
    // Build user prompt with context
    const userPrompt = buildUserPrompt(
      originalPrompt, 
      mediaType, 
      enhancementLevel, 
      targetAudience, 
      includeNegativePrompt
    );

    console.log('🔄 Calling LLM for prompt enhancement...');
    
    const result = await generateText({
      model: myProvider.languageModel('artifact-model'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    console.log('✅ LLM response received:', result.text);

    // Parse the enhanced prompt from LLM response
    const parsedResult = parseEnhancementResult(result.text, originalPrompt);

    const finalResult = {
      originalPrompt,
      enhancedPrompt: parsedResult.enhancedPrompt,
      negativePrompt: parsedResult.negativePrompt,
      mediaType,
      enhancementLevel,
      modelHint,
      improvements: parsedResult.improvements,
      reasoning: parsedResult.reasoning,
      usage: {
        copyPrompt: 'Copy the enhanced prompt to use in image/video generation tools',
        negativePrompt: parsedResult.negativePrompt ? 'Use the negative prompt to avoid unwanted elements' : undefined
      }
    };

    console.log('✅ API: Prompt enhancement completed:', finalResult);
    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('❌ API: Error enhancing prompt:', error);
    return NextResponse.json(
      { 
        error: `Failed to enhance prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fallback: true
      },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(mediaType: string, enhancementLevel: string, modelHint?: string): string {
  const basePrompt = `You are a professional prompt engineering expert specializing in improving prompts for AI generation. Your task is to enhance user prompts to achieve the best possible results.

CORE RESPONSIBILITIES:
1. Translate non-English text to English while preserving meaning and intent
2. Apply prompt engineering best practices (specificity, clarity, quality keywords)
3. Optimize for the target media type and AI model
4. Structure prompts for maximum effectiveness

ENHANCEMENT PRINCIPLES:
- Keep the original creative intent intact
- Add technical and quality descriptors
- Include appropriate style and composition terms
- Ensure compatibility with target AI models
- Use professional terminology when appropriate`;

  const mediaSpecificGuidance = {
    image: `
IMAGE GENERATION FOCUS:
- Add photography/artistic quality terms (e.g., "professional photography", "high resolution", "sharp focus")
- Include composition guidance (e.g., "excellent composition", "rule of thirds", "dramatic lighting")
- Specify visual style and mood descriptors
- Add technical camera/lens terminology when relevant
- Include quality markers like "masterpiece", "award-winning", "trending on artstation"`,

    video: `
VIDEO GENERATION FOCUS:
- Add cinematography terms (e.g., "cinematic quality", "professional cinematography", "smooth motion")
- Include camera movement and framing guidance
- Specify visual style and mood for motion
- Add production quality terms (e.g., "Hollywood production", "IMAX quality")
- Include temporal aspects like pacing and rhythm`,

    general: `
GENERAL ENHANCEMENT FOCUS:
- Improve clarity and specificity
- Add professional quality terms
- Enhance structure and flow
- Remove ambiguity while preserving creativity`
  };

  const levelGuidance = {
    basic: 'Apply minimal enhancements - focus on translation, basic cleanup, and essential quality terms.',
    detailed: 'Apply comprehensive enhancements - add professional terminology, improve structure, include quality descriptors.',
    creative: 'Apply maximum enhancements - add artistic language, advanced composition terms, creative direction guidance.'
  };

  let modelOptimization = '';
  if (modelHint) {
    modelOptimization = `
MODEL OPTIMIZATION for ${modelHint}:
- Tailor the prompt style to work best with this specific AI model
- Use terminology and structure that this model responds well to
- Include model-specific quality triggers and style guidance`;
  }

  return `${basePrompt}

${mediaSpecificGuidance[mediaType as keyof typeof mediaSpecificGuidance] || mediaSpecificGuidance.general}

ENHANCEMENT LEVEL: ${levelGuidance[enhancementLevel as keyof typeof levelGuidance]}${modelOptimization}

OUTPUT FORMAT:
Provide your response as a JSON object with these fields:
{
  "enhancedPrompt": "the improved prompt text",
  "negativePrompt": "what to avoid (if requested)",
  "improvements": ["list of improvements made"],
  "reasoning": "brief explanation of enhancement strategy"
}`;
}

function buildUserPrompt(
  originalPrompt: string, 
  mediaType: string, 
  enhancementLevel: string, 
  targetAudience?: string, 
  includeNegativePrompt?: boolean
): string {
  let prompt = `Please enhance this prompt for ${mediaType} generation:

ORIGINAL PROMPT: "${originalPrompt}"

REQUIREMENTS:
- Enhancement level: ${enhancementLevel}
- Media type: ${mediaType}`;

  if (targetAudience) {
    prompt += `\n- Target audience: ${targetAudience}`;
  }

  if (includeNegativePrompt) {
    prompt += `\n- Include negative prompt to avoid unwanted elements`;
  }

  prompt += `\n\nPlease enhance this prompt following your expertise in prompt engineering. Translate any non-English text to English while preserving the creative intent. Apply appropriate enhancements for the specified media type and level.`;

  return prompt;
}

function parseEnhancementResult(llmResponse: string, originalPrompt: string) {
  try {
    // Try to parse as JSON first
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        enhancedPrompt: parsed.enhancedPrompt || originalPrompt,
        negativePrompt: parsed.negativePrompt || undefined,
        improvements: parsed.improvements || ['LLM enhancement applied'],
        reasoning: parsed.reasoning || 'Enhanced using AI prompt engineering'
      };
    }
    
    // Fallback: extract enhanced prompt from text
    const lines = llmResponse.split('\n').filter(line => line.trim());
    let enhancedPrompt = originalPrompt;
    
    // Look for enhanced prompt indicators
    for (const line of lines) {
      if (line.toLowerCase().includes('enhanced') || 
          line.toLowerCase().includes('improved') ||
          line.toLowerCase().includes('prompt:')) {
        const promptText = line.replace(/^[^:]*:?\s*/, '').trim();
        if (promptText.length > 10) {
          enhancedPrompt = promptText;
          break;
        }
      }
    }
    
    return {
      enhancedPrompt,
      negativePrompt: undefined,
      improvements: ['LLM enhancement applied'],
      reasoning: 'Enhanced using AI prompt engineering'
    };
    
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    return {
      enhancedPrompt: originalPrompt,
      negativePrompt: undefined,
      improvements: ['Enhancement failed, returned original'],
      reasoning: 'Error in processing enhancement'
    };
  }
} 