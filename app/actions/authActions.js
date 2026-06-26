"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";

/**
 * Handles credentials registration for Customers (Users).
 */
export async function registerAction(formData) {
  try {
    const name = formData.name?.trim();
    const email = formData.email?.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // Simple validations
    if (!name || !email || !password || !confirmPassword) {
      return { success: false, message: "All fields are required" };
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" };
    }

    if (password.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long" };
    }

    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email address" };
    }

    // Check duplicate in Customer User table
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: "Email is already registered" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create customer user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: "credentials",
        roleId: 2, // Customer role
        isEmailVerified: false,
        isApproved: false,
        verificationToken: token,
        verificationTokenExpires: expires,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, token);
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError);
      return {
        success: true,
        message: "Registration successful! (Warning: Verification email could not be sent. Please check SMTP config).",
      };
    }

    return {
      success: true,
      message: "Registration successful! A verification link has been sent to your email.",
    };
  } catch (error) {
    console.error("Register action error:", error);
    return { success: false, message: "An unexpected error occurred during registration." };
  }
}

/**
 * Handles credentials login for Customers (Users).
 */
export async function loginAction(formData) {
  try {
    const email = formData.email?.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      return { success: false, message: "Email and password are required" };
    }

    // Find in Customer User table
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    // If registered with google but trying to log in with password
    if (user.provider === "google" && !user.password) {
      return {
        success: false,
        message: "This account was registered with Google. Please use Google Sign-In.",
      };
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password || "");
    if (!isPasswordMatch) {
      return { success: false, message: "Invalid email or password" };
    }

    // Check email verification
    if (!user.isEmailVerified) {
      // Regenerate token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: token,
          verificationTokenExpires: expires,
        },
      });

      try {
        await sendVerificationEmail(user.email, token);
      } catch (mailErr) {
        console.error("Resend verification email failed:", mailErr);
      }

      return {
        success: false,
        status: "unverified",
        message: "Please verify your email. A new verification email has been sent.",
      };
    }

    // Check user approval status
    if (user.rejected) {
      return {
        success: false,
        message: "Your registration request has been rejected by the administrator.",
      };
    }

    if (!user.isApproved) {
      return {
        success: false,
        status: "pending_approval",
        message: "Your account is waiting for admin approval.",
      };
    }

    // Establish Customer Session
    const cookieStore = await cookies();
    const headerStore = await headers();
    const ipAddress = headerStore.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headerStore.get("user-agent") || "unknown";
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

    // Set Customer session_token cookie
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: false, // Set to false to support local HTTP network testing on mobile devices
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return {
      success: true,
      message: "Login successful!",
      redirect: "/dashboard",
    };
  } catch (error) {
    console.error("Login action error:", error);
    return { success: false, message: "An unexpected error occurred during login." };
  }
}

/**
 * Handles credentials login for Administrators.
 */
export async function adminLoginAction(formData) {
  try {
    const email = formData.email?.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      return { success: false, message: "Email and password are required" };
    }

    // Find in Admin table
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return { success: false, message: "Invalid email or password" };
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, admin.password || "");
    if (!isPasswordMatch) {
      return { success: false, message: "Invalid email or password" };
    }

    // Check approval/verification for Admin (Seeded admin is pre-approved)
    if (!admin.isEmailVerified) {
      return { success: false, message: "Admin email must be verified first." };
    }

    if (!admin.isApproved) {
      return { success: false, message: "Admin account is waiting for approval." };
    }

    // Establish Admin Session
    const cookieStore = await cookies();
    const headerStore = await headers();
    const ipAddress = headerStore.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headerStore.get("user-agent") || "unknown";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const token = signToken({ id: admin.id, email: admin.email, roleId: admin.roleId });

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Set admin_session_token cookie
    cookieStore.set("admin_session_token", token, {
      httpOnly: true,
      secure: false, // Set to false to support local HTTP network testing on mobile devices
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return {
      success: true,
      message: "Admin login successful!",
      redirect: "/admin/dashboard",
    };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, message: "An unexpected error occurred during Admin login." };
  }
}

/**
 * Handles logout for both User (Customer) and Admin.
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    
    // Clear user session if exists
    const userToken = cookieStore.get("session_token")?.value;
    if (userToken) {
      await prisma.userSession.delete({
        where: { token: userToken },
      }).catch(() => {});
      cookieStore.delete("session_token");
    }

    // Clear admin session if exists
    const adminToken = cookieStore.get("admin_session_token")?.value;
    if (adminToken) {
      await prisma.adminSession.delete({
        where: { token: adminToken },
      }).catch(() => {});
      cookieStore.delete("admin_session_token");
    }

    return { success: true, redirect: "/auth/login" };
  } catch (error) {
    console.error("Logout action error:", error);
    return { success: false, message: "Failed to log out cleanly." };
  }
}
