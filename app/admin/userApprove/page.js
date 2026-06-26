import React from "react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import UserApproveTable from "./UserApproveTable";

export const dynamic = "force-dynamic";

export default async function AdminUserApprovePage() {
  // Ensure user is authenticated and has admin privileges
  await requireUser("admin:view");

  // Fetch all registered users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      role: true,
    },
  });

  // Strip password fields before rendering client-side
  const safeUsers = users.map((user) => {
    const { password, verificationToken, ...safe } = user;
    return safe;
  });

  return (
    <div className="flex-1 bg-mesh bg-[#030712] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <UserApproveTable initialUsers={safeUsers} />
      </div>
    </div>
  );
}
