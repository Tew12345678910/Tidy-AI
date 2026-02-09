import { NextRequest, NextResponse } from "next/server";
import { applyPlan, OrganizationPlan } from "@/lib/organizer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan } = body as { plan: OrganizationPlan };

    if (!plan || !plan.operations) {
      return NextResponse.json({ error: "Invalid plan data" }, { status: 400 });
    }

    const result = await applyPlan(plan);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error applying plan:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to apply plan",
      },
      { status: 500 }
    );
  }
}
