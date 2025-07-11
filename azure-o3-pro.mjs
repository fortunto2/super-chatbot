import { AzureOpenAI } from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output, argv, exit } from "node:process";
import dotenv from "dotenv";

dotenv.config();

// Можно также использовать dotenv для переменных окружения
const endpoint   = "https://info-m1wjhthz-eastus2.openai.azure.com/openai/";
const apiKey     = process.env.AZURE_OPENAI_API_KEY;
const deployment = "o3-pro";
const apiVersion = "2025-04-01-preview";

if (!apiKey) {
  console.error("AZURE_OPENAI_API_KEY environment variable is not set.");
  process.exit(1);
}

const client = new AzureOpenAI({
  apiKey,
  baseURL: endpoint,
  apiVersion,
});

const systemPrompt = `You are an expert AI software engineer working on the Super Chatbot project. 
Your primary goal is to design and implement robust, maintainable, and scalable solutions using Domain-Driven Design (DDD) principles. 
You strictly follow the AI-First Development Methodology (see: /docs/development/ai-development-methodology.md and AGENTS.md), which includes a two-phase process: 
(1) Implementation Planning (with detailed architecture, API, and testing strategy), and 
(2) Code Implementation (with AICODE comments for memory and reasoning, see: AGENTS.md, section 'AICODE Comment System for AI Memory'). 
You always document complex logic, architectural decisions, and open questions using the AICODE-NOTE, AICODE-TODO, and AICODE-ASK comment system.

You work in a Next.js 15, TypeScript, and OpenAPI-driven codebase with strict separation of concerns, typed proxy architecture (see: AGENTS.md, section 'Typed Proxy Architecture'), and secure internal API routes. 
You use Server Components by default, Client Components only when necessary, and always follow established project structure and coding conventions. 
All code and comments must be in English. 
You leverage SuperDuperAI API via internal typed proxy endpoints, never exposing tokens to the frontend.

When generating code, always:
- Use DDD patterns: aggregate roots, value objects, repositories, and clear domain boundaries.
- Plan before coding: outline architecture, data flow, and integration points.
- Add AICODE-NOTE for all non-trivial logic and architectural choices.
- Use AICODE-TODO for future improvements and AICODE-ASK for open questions.
- Ensure type safety, error handling, and testability.
- Prefer explicit, self-documenting code and clear separation of domain, application, and infrastructure layers.

You are proactive in identifying edge cases, potential improvements, and maintainability issues. 
You always strive for clarity, extensibility, and alignment with the project's long-term vision.

If you need to generate structured output (e.g., JSON), always use JSON Schema and validate that the output matches the required structure.

Context: The project is a multi-modal AI platform for text, image, and video generation, with a strong focus on maintainability, security, and developer experience. 
All architectural and implementation decisions must be justified and documented for future AI agents and human collaborators.`;

function printHelp() {
  console.log(`Super Chatbot o3-pro CLI\n------------------------\nUsage:\n  pnpm exec node azure-o3-pro-demo.mjs           # interactive mode\n  pnpm exec node azure-o3-pro-demo.mjs -i "your question"\n  pnpm exec node azure-o3-pro-demo.mjs --input "your question"\n  pnpm exec node azure-o3-pro-demo.mjs -h\n\nOptions:\n  -i, --input   Provide a single question via command line\n  -h, --help    Show this help message\n\nIn interactive mode:\n  - Type your question and press Enter\n  - Type 'exit' or press Enter on empty line to quit\n`);
}

async function askO3Pro(userInput) {
  const response = await client.responses.create({
    model: deployment,
    input: [
      { role: "developer", content: systemPrompt },
      { role: "user", content: userInput }
    ],
    text: {
      format: {
        name: "main",
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            code: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["code", "explanation"],
          additionalProperties: false
        }
      }
    }
  });
  const outputText = response.output?.[0]?.text;
  if (outputText) {
    try {
      const parsed = JSON.parse(outputText);
      console.log(`\n--- CODE ---\n${parsed.code}`);
      console.log(`\n--- EXPLANATION ---\n${parsed.explanation}\n`);
    } catch (e) {
      console.log("\n[Raw output]:\n", outputText);
    }
  } else {
    console.log("[No output received]");
  }
}

async function main() {
  // Parse CLI args
  const args = argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    exit(0);
  }
  const inputIdx = args.findIndex(arg => arg === "-i" || arg === "--input");
  if (inputIdx !== -1 && args[inputIdx + 1]) {
    const userInput = args[inputIdx + 1];
    await askO3Pro(userInput);
    return;
  }

  // Interactive mode
  const rl = readline.createInterface({ input, output });
  console.log("Super Chatbot o3-pro CLI (type /help for instructions)");
  while (true) {
    const userInput = (await rl.question("> ")).trim();
    if (!userInput || userInput.toLowerCase() === "exit") break;
    if (userInput === "/help") {
      printHelp();
      continue;
    }
    await askO3Pro(userInput);
  }
  rl.close();
}

main().catch(console.error);