import { NextRequest } from "next/server";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

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

  return Response.json({ script: result.text });
} 