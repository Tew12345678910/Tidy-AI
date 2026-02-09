import { NextResponse } from "next/server";
import { checkOllamaConnection } from "@/lib/ollama";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await checkOllamaConnection();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
