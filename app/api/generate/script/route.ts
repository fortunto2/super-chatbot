import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { auth } from '@/app/(auth)/auth';
import { validateOperationBalance, deductOperationBalance } from '@/lib/utils/tools-balance';

export async function POST(req: NextRequest) {
  try {
    // Check authentication first
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();

    // Validate user balance before proceeding
    const userId = session.user.id;
    
    // Determine if it's a long script (estimate from prompt length)
    const multipliers: string[] = [];
    if (prompt && prompt.length > 200) {
      multipliers.push('long-form');
    }

    const balanceValidation = await validateOperationBalance(
      userId, 
      'script-generation', 
      'basic-script', 
      multipliers
    );

    if (!balanceValidation.valid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient balance',
          details: balanceValidation.error,
          requiredCredits: balanceValidation.cost
        },
        { status: 402 } // Payment Required
      );
    }

    console.log(`💳 User ${userId} has sufficient balance for script generation (${balanceValidation.cost} credits)`);

  // Системный промпт для генерации сценария
  const systemPrompt = `
You are a professional scriptwriter AI. Generate a detailed scenario in Markdown format based on the user's prompt. 
- Structure the script with headings (scenes, acts, etc.)
- Use lists for actions or dialogues
- Make the script clear, creative, and easy to edit
- Output only valid Markdown
`;

  const userPrompt = `PROMPT: ${prompt}\n\nWrite a full scenario in Markdown.`;

    const result = await generateText({
      model: myProvider.languageModel('artifact-model'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 1200,
    });
    console.log("RESULT: SCRIPT GENERATION SUCCESS" );

    // Deduct balance after successful generation
    try {
      await deductOperationBalance(
        userId,
        'script-generation',
        'basic-script',
        multipliers,
        {
          prompt: prompt.substring(0, 100), // First 100 chars for logging
          scriptLength: result.text.length,
          timestamp: new Date().toISOString()
        }
      );
      console.log(`💳 Balance deducted for user ${userId} after successful script generation`);
    } catch (balanceError) {
      console.error('⚠️ Failed to deduct balance after script generation:', balanceError);
      // Continue with response - script was generated successfully
    }

    return NextResponse.json({ 
      script: result.text,
      creditsUsed: balanceValidation.cost,
      success: true
    });
  } catch (error) {
    console.error('💥 Script API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate script', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 