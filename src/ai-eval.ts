import OpenAI from "openai";
import type { AIEvaluation } from "./types";

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
出力は以下のJSON形式で返してください（JSONのみを返し、他の説明は不要です）:

{
  "summary": "どのような変更が行われたかの自然言語説明",
  "change_types": ["追加", "削除", "内容変更"],
  "impacted_sections": ["header", "footer", "article"],
  "likely_intent": "更新の目的や背景の推測"
}

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
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Azure OpenAI");
    }

    const evaluation: AIEvaluation = JSON.parse(content);
    return evaluation;
  } catch (error) {
    console.error("Azure OpenAI API error:", error);
    throw new Error(`Failed to evaluate differences: ${error}`);
  }
}
