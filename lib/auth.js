import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "d60155b93198cdce275efee6b4a242c75a4dc372e9a2be74cfd34208a546ccf9";

export function signToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function requireUser(requiredPermission = null) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  // Verify JWT
  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/auth/login");
  }

  // Fetch session from DB
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    }
    redirect("/auth/login");
  }

  const user = session.user;

  // Check if email verified and admin approved
  if (!user.isEmailVerified || !user.isApproved || user.rejected) {
    redirect("/auth/login");
  }

  // Check permissions dynamically
  if (requiredPermission) {
    const hasPermission = user.role.permissions.some(
      (p) => p.permission === requiredPermission
    );
    if (!hasPermission) {
      redirect("/auth/login?error=unauthorized");
    }
  }

  return user;
}
