import { NextResponse } from "next/server";
import OpenAI from "openai";

import {
  aiAssistJsonSchema,
  assistInstructions,
  buildAssistInput,
  coerceAssistResponse,
  createFallbackAssist,
} from "@/lib/ai-assist";
import type { AiAssistRequest } from "@/types/call-center";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let payload: AiAssistRequest;

  try {
    payload = (await request.json()) as AiAssistRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload?.call || !payload?.customer || !payload?.agent || !payload?.routing) {
    return NextResponse.json({ error: "Missing call center context." }, { status: 400 });
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(createFallbackAssist(payload));
  }

  try {
    const client = new OpenAI();
    const response = await client.responses.create({
      model,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: assistInstructions,
        },
        {
          role: "user",
          content: JSON.stringify(buildAssistInput(payload)),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "call_center_ai_assist",
          schema: aiAssistJsonSchema,
          strict: true,
        },
      },
    });

    const parsed = JSON.parse(response.output_text);
    return NextResponse.json(coerceAssistResponse(parsed, payload, model));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error.";
    return NextResponse.json(
      {
        ...createFallbackAssist(payload),
        source: "demo",
        model,
        error: message,
      },
      { status: 200 },
    );
  }
}
