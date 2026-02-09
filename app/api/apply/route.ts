/**
 * API Route: /api/apply
 * 
 * Legacy route - redirects to /api/execute
 * Kept for backward compatibility
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Please use /api/execute instead.",
      message: "The API has been upgraded to a 3-phase workflow: /api/scan → /api/plan → /api/execute"
    },
    { status: 410 }
  );
}
