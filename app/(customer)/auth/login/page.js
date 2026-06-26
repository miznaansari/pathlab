"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { loginAction } from "@/app/actions/authActions";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";

const loginSchema = zod.object({
  email: zod.string().min(1, "Email is required").email("Invalid email address"),
  password: zod.string().min(1, "Password is required"),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Handle Firebase Sign-in Redirect Result on page mount (Mobile fallback)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setIsGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken();
          await processGoogleSignInToken(idToken);
        } else {
          setIsGoogleLoading(false);
        }
      } catch (error) {
        console.error("Redirect Sign-In error:", error);
        handleGoogleError(error);
        setIsGoogleLoading(false);
      }
    };
    handleRedirectResult();
  }, []);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast.success("Email verified successfully! Please wait for Admin approval.");
      setStatusMessage({
        type: "success",
        title: "Email Verified",
        text: "Your email has been verified. You can log in once the administrator approves your account.",
      });
    }
    if (searchParams.get("error") === "unauthorized") {
      toast.error("Unauthorized access.");
    }
  }, [searchParams]);

  // Processes ID Token received from Google Auth
  const processGoogleSignInToken = async (idToken) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Google Sign-In successful!");
        if (data.status === "registered_pending_approval") {
          setStatusMessage({
            type: "success",
            title: "Registration Successful",
            text: data.message,
          });
          setIsGoogleLoading(false); // Stop loading since we stay here
        } else {
          router.push(data.redirect);
          // Keep isGoogleLoading as true to show the loader until redirect finishes
        }
      } else {
        toast.error(data.message);
        if (data.status === "pending_approval") {
          setStatusMessage({
            type: "warning",
            title: "Pending Approval",
            text: data.message,
          });
        }
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error("Token processing error:", error);
      toast.error("Failed to establish session. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  // Custom error display for Google Auth issues
  const handleGoogleError = (error) => {
    const isStorageError =
      error.message?.includes("missing initial state") ||
      error.code === "auth/web-context-cancelled" ||
      error.code === "auth/network-request-failed";

    if (isStorageError) {
      setStatusMessage({
        type: "warning",
        title: "Mobile Storage / Security Block",
        text: "Google Sign-In is blocked by your browser's third-party tracking/cookie protection or missing authorized domains in Firebase Console. Please add this domain to 'Authorized Domains' in your Firebase settings, disable 'Prevent Cross-Site Tracking' in Safari settings, or use standard credentials.",
      });
      toast.error("Storage partitioned or unauthorized domain.");
    } else {
      toast.error(error.message || "Google Authentication failed.");
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await loginAction(data);
      if (res.success) {
        toast.success(res.message);
        router.push(res.redirect);
        // Keep isLoading as true to show the loader until redirect finishes
      } else {
        toast.error(res.message);
        if (res.status === "unverified") {
          setStatusMessage({
            type: "warning",
            title: "Verification Required",
            text: res.message,
          });
        } else if (res.status === "pending_approval") {
          setStatusMessage({
            type: "warning",
            title: "Pending Approval",
            text: res.message,
          });
        }
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setStatusMessage(null);

    // Detect mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof window !== "undefined" ? window.navigator.userAgent : ""
    );

    try {
      if (isMobileDevice) {
        // Mobile uses Redirect to bypass popup blocks and localStorage iframe issues
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Desktop uses convenient Popup
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        await processGoogleSignInToken(idToken);
      }
    } catch (error) {
      console.error("Google login initiation error:", error);
      handleGoogleError(error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="glass shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-slate-800">Sign In</CardTitle>
        <CardDescription className="text-slate-500">
          Enter your credentials or use Google Auth
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        {statusMessage && (
          <div className="px-6 mb-4">
            <Alert
              variant={statusMessage.type === "success" ? "success" : "warning"}
              title={statusMessage.title}
            >
              {statusMessage.text}
            </Alert>
          </div>
        )}
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-slate-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-slate-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In with Credentials
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="relative w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs uppercase text-slate-400 font-semibold">
              Or continue with
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign In with Google
          </Button>

          <p className="text-sm text-center text-slate-500 mt-2">
            Don't have an account?{" "}
            <Button
              type="button"
              variant="link"
              onClick={() => router.push("/auth/register")}
            >
              Create one
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-mesh">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-blue-50 border border-blue-100 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to access your Pathlab account
          </p>
        </div>

        <Suspense
          fallback={
            <Card className="glass p-8 flex flex-col items-center justify-center gap-4">
              <Loader className="h-8 w-8 text-blue-600" />
              <p className="text-sm text-slate-500">Loading auth environment...</p>
            </Card>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
