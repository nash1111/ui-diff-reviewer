import OpenAI from "openai";
import { z } from "zod";
import type { AIEvaluation } from "./types";

/**
 * Zod schema for AI evaluation response with strict validation
 */
const AIEvaluationSchema = z.object({
  summary: z.string().describe("どのような変更が行われたかの自然言語説明"),
  change_types: z.array(z.string()).describe("変更の種類のリスト（例：追加、削除、内容変更）"),
  impacted_sections: z.array(z.string()).describe("影響を受けたセクションのリスト（例：header、footer、article）"),
  likely_intent: z.string().describe("更新の目的や背景の推測"),
});

/**
 * Initialize Azure OpenAI client
 */
function createAzureOpenAIClient(): OpenAI {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

  if (!endpoint || !apiKey || !deployment || !apiVersion) {
    throw new Error(
      "Missing Azure OpenAI configuration. Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT, and AZURE_OPENAI_API_VERSION"
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: `${endpoint}/openai/deployments/${deployment}`,
    defaultQuery: { "api-version": apiVersion },
    defaultHeaders: { "api-key": apiKey },
  });
}

/**
 * Evaluate DOM differences using Azure OpenAI
 */
export async function evaluateDifferences(
  diffDescription: string,
  model?: string
): Promise<AIEvaluation> {
  const client = createAzureOpenAIClient();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

  const prompt = `
以下のDOM差分を読んで、ページ更新の意図を要約してください。

DOM差分:
${diffDescription}
`.trim();

  try {
    const response = await client.chat.completions.create({
      model: model || deployment,
      messages: [
        {
          role: "system",
          content:
            "あなたはWebページの変更を分析するエキスパートです。DOM差分を読み取り、変更の意図を要約してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ai_evaluation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "どのような変更が行われたかの自然言語説明",
              },
              change_types: {
                type: "array",
                items: { type: "string" },
                description: "変更の種類のリスト（例：追加、削除、内容変更）",
              },
              impacted_sections: {
                type: "array",
                items: { type: "string" },
                description: "影響を受けたセクションのリスト（例：header、footer、article）",
              },
              likely_intent: {
                type: "string",
                description: "更新の目的や背景の推測",
              },
            },
            required: ["summary", "change_types", "impacted_sections", "likely_intent"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Azure OpenAI");
    }

    // Parse and validate with Zod for extra type safety
    const parsed = JSON.parse(content);
    const evaluation = AIEvaluationSchema.parse(parsed);
    return evaluation as AIEvaluation;
  } catch (error) {
    console.error("Azure OpenAI API error:", error);
    throw new Error(`Failed to evaluate differences: ${error}`);
  }
}
