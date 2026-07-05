import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET() {
  try {
    const admin = await requireAdmin("admin:view");
    const doctors = await prisma.doctor.findMany({
      where: { workspaceId: admin.workspaceId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, doctors: serializeData(doctors) });
  } catch (error) {
    console.error("Workspace Doctors GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
