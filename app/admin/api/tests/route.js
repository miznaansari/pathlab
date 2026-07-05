import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET() {
  try {
    await requireAdmin("admin:view");
    const tests = await prisma.test.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, tests: serializeData(tests) });
  } catch (error) {
    console.error("Workspace Tests GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
