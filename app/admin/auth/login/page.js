"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "sonner";
import { Shield, ArrowRight } from "lucide-react";
import { adminLoginAction } from "@/app/actions/authActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

const adminLoginSchema = zod.object({
  email: zod.string().min(1, "Email is required").email("Invalid email address"),
  password: zod.string().min(1, "Password is required"),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await adminLoginAction(data);
      if (res.success) {
        toast.success(res.message);
        router.push(res.redirect);
        router.refresh();
      } else {
        toast.error(res.message);
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
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 mb-4">
            <Shield className="h-6 w-6 text-rose-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Admin Console
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to access admin tools
          </p>
        </div>

        <Card className="glass shadow-2xl border-rose-500/10">
          <CardHeader>
            <CardTitle className="text-xl text-rose-400">Admin Sign In</CardTitle>
            <CardDescription>
              Authorized personnel only
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pathlab.com"
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
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/10 focus:ring-rose-500"
                isLoading={isLoading}
              >
                Access Admin Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-gray-400 hover:text-white"
                onClick={() => router.push("/auth/login")}
              >
                Return to Customer Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
