"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/mail";

/**
 * Approves a registered customer user.
 */
export async function approveUserAction(userId) {
  try {
    // Verify admin permission
    await requireAdmin("admin:approve");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        rejected: false,
      },
    });

    // Send notification email
    try {
      await sendApprovalEmail(updatedUser.email);
    } catch (mailError) {
      console.error("Failed to send approval email:", mailError);
    }

    return { success: true, message: `User ${updatedUser.name} has been approved successfully.` };
  } catch (error) {
    console.error("Approve user error:", error);
    return { success: false, message: "Failed to approve user. Ensure you are logged in as admin." };
  }
}

/**
 * Rejects a registered customer user.
 */
export async function rejectUserAction(userId) {
  try {
    // Verify admin permission
    await requireAdmin("admin:reject");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        rejected: true,
        isApproved: false,
      },
    });

    // Send notification email
    try {
      await sendRejectionEmail(updatedUser.email);
    } catch (mailError) {
      console.error("Failed to send rejection email:", mailError);
    }

    return { success: true, message: `User ${updatedUser.name} has been rejected.` };
  } catch (error) {
    console.error("Reject user error:", error);
    return { success: false, message: "Failed to reject user. Ensure you are logged in as admin." };
  }
}

/**
 * Fetches all registered customer users for the admin dashboard.
 */
export async function getUsersAction() {
  try {
    // Verify admin view permission
    await requireAdmin("admin:view");

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        role: true,
      },
    });

    // Strip sensitive fields
    const safeUsers = users.map((u) => {
      const { password, verificationToken, ...safe } = u;
      return safe;
    });

    return { success: true, users: safeUsers };
  } catch (error) {
    console.error("Get users action error:", error);
    return { success: false, message: "Failed to load users list." };
  }
}

/**
 * Changes a customer user's role.
 */
export async function changeUserRoleAction(userId, roleId) {
  try {
    // Verify admin permission
    await requireAdmin("admin:approve");

    const parsedRoleId = parseInt(roleId);

    // Verify role exists in UserRole table
    const roleExists = await prisma.userRole.findUnique({
      where: { id: parsedRoleId },
    });

    if (!roleExists) {
      return { success: false, message: "Invalid role selected" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Update role in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: parsedRoleId,
      },
      include: {
        role: true,
      },
    });

    return {
      success: true,
      message: `Updated role of ${updatedUser.name} to ${updatedUser.role?.name || "Customer"}.`,
      user: {
        id: updatedUser.id,
        roleId: updatedUser.roleId,
        role: updatedUser.role,
      },
    };
  } catch (error) {
    console.error("Change user role error:", error);
    return { success: false, message: "Failed to change user role." };
  }
}
