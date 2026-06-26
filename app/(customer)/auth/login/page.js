"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, ShieldAlert } from "lucide-react";
import { loginAction } from "@/app/actions/authActions";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";

const loginSchema = zod.object({
  email: zod.string().min(1, "Email is required").email("Invalid email address"),
  password: zod.string().min(1, "Password is required"),
});

export default function LoginPage() {
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

  // Handle redirect queries from email verification or authorization
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

  const onSubmit = async (data) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await loginAction(data);
      if (res.success) {
        toast.success(res.message);
        router.push(res.redirect);
        router.refresh();
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
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setStatusMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

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
        } else {
          router.push(data.redirect);
          router.refresh();
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
      }
    } catch (error) {
      console.error(error);
      toast.error("Google Authentication failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-mesh bg-[#030712]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mb-4">
            <Mail className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to access your Pathlab account
          </p>
        </div>

        {statusMessage && (
          <Alert
            variant={statusMessage.type === "success" ? "success" : "warning"}
            title={statusMessage.title}
            className="mb-6"
          >
            {statusMessage.text}
          </Alert>
        )}

        <Card className="glass shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials or use Google Auth
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign In with Credentials
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="relative w-full flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-800" />
                </div>
                <span className="relative bg-transparent px-3 text-xs uppercase text-gray-500 font-semibold">
                  Or continue with
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-gray-900 hover:bg-gray-800 border-gray-800 text-white"
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

              <p className="text-sm text-center text-gray-400 mt-2">
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
      </div>
    </div>
  );
}
