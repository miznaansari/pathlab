import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Missing Google ID token" },
        { status: 400 }
      );
    }

    // Verify token using Google OAuth API
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { success: false, message: "Invalid Google ID token" },
        { status: 400 }
      );
    }

    const payload = await googleRes.json();
    const { email, sub: googleId, name } = payload;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email not provided by Google" },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Register user
      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          provider: "google",
          googleId,
          roleId: 1, // Default roleId = 1 as per registration instructions
          isEmailVerified: true,
          isApproved: false,
        },
      });

      return NextResponse.json({
        success: true,
        status: "registered_pending_approval",
        message: "Registration successful. Please wait until the admin approves your account.",
      });
    }

    // Update existing user with Google ID and provider if not already set
    if (user.provider !== "google") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: "google",
          googleId,
          isEmailVerified: true, // Google accounts are pre-verified
        },
      });
    }

    // Check approval
    if (user.rejected) {
      return NextResponse.json({
        success: false,
        message: "Your registration request has been rejected by the administrator.",
      });
    }

    if (!user.isApproved) {
      return NextResponse.json({
        success: false,
        status: "pending_approval",
        message: "Your account is waiting for admin approval.",
      });
    }

    // Create session
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const token = signToken({ id: user.id, email: user.email, roleId: user.roleId });

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      redirect: user.roleId === 1 ? "/admin/userApprove" : "/dashboard",
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google login API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
