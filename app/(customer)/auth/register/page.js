"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { UserPlus, ArrowRight } from "lucide-react";
import { registerAction } from "@/app/actions/authActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";

const registerSchema = zod
  .object({
    name: zod.string().min(2, "Name must be at least 2 characters"),
    email: zod.string().min(1, "Email is required").email("Invalid email address"),
    password: zod
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: zod.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await registerAction(data);
      if (res.success) {
        toast.success(res.message);
        setStatusMessage({
          type: "success",
          title: "Registration Pending Email Verification",
          text: res.message,
        });
      } else {
        toast.error(res.message);
        setStatusMessage({
          type: "danger",
          title: "Registration Failed",
          text: res.message,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-mesh bg-[#030712]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mb-4">
            <UserPlus className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign up to get started with Pathlab
          </p>
        </div>

        {statusMessage && (
          <Alert
            variant={statusMessage.type === "success" ? "success" : "danger"}
            title={statusMessage.title}
            className="mb-6"
          >
            {statusMessage.text}
          </Alert>
        )}

        <Card className="glass shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Register</CardTitle>
            <CardDescription>
              Provide your details below to sign up
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  {...register("name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign Up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-sm text-center text-gray-400 mt-2">
                Already have an account?{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push("/auth/login")}
                >
                  Sign In
                </Button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
