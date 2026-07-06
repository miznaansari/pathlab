import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireSuperAdmin();

    const workspaces = await prisma.workspace.findMany({
      where: { isDeleted: false },
      include: {
        admins: {
          select: { id: true, name: true, email: true, isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = await Promise.all(
      workspaces.map(async (ws) => {
        const regToday = await prisma.registration.count({
          where: {
            workspaceId: ws.id,
            date: { gte: startOfToday },
            isDeleted: false,
          },
        });

        const reg7Days = await prisma.registration.count({
          where: {
            workspaceId: ws.id,
            date: { gte: startOf7DaysAgo },
            isDeleted: false,
          },
        });

        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          isActive: ws.isActive,
          createdAt: ws.createdAt.toISOString(),
          admins: ws.admins,
          stats: {
            today: regToday,
            last7Days: reg7Days,
          },
        };
      })
    );

    return NextResponse.json({ success: true, workspaces: stats });
  } catch (error) {
    console.error("SuperAdmin Workspaces GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requireSuperAdmin();
    const body = await req.json().catch(() => ({}));

    const name = body.name?.trim();
    const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: "Name and slug are required." });
    }

    const existing = await prisma.workspace.findFirst({ where: { slug, isDeleted: false } });
    if (existing) {
      return NextResponse.json({ success: false, error: "A workspace with this slug already exists." });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: "Workspace created successfully!", workspace });
  } catch (error) {
    console.error("SuperAdmin Workspace POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
