import React from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/authActions";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LogOut, Shield, ShieldCheck, MailCheck, Calendar, Globe, User, Fingerprint } from "lucide-react";

export default async function DashboardPage() {
  // Protect page and load user details
  const user = await requireUser();

  // Load user sessions
  const sessions = await prisma.userSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const handleLogout = async () => {
    "use server";
    const res = await logoutAction();
    if (res.success) {
      redirect(res.redirect);
    }
  };

  return (
    <div className="flex-1 bg-mesh bg-[#030712] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} className="h-16 w-16 text-lg" />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{user.name}</h1>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <form action={handleLogout}>
            <Button type="submit" variant="destructive" className="w-full md:w-auto">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <Card className="glass md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-400" />
                Profile Details
              </CardTitle>
              <CardDescription>Verify your user credentials and states</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/40 space-y-1">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Account Status</span>
                <div className="flex items-center gap-2 mt-1">
                  {user.isApproved ? (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Approved by Admin</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-400">Pending Approval</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/40 space-y-1">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Email Verification</span>
                <div className="flex items-center gap-2 mt-1">
                  {user.isEmailVerified ? (
                    <>
                      <MailCheck className="h-4 w-4 text-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-400">Verified</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-red-400">Not Verified</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/40 space-y-1">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Authentication Provider</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.provider === "google" ? "default" : "secondary"}>
                    {user.provider}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/40 space-y-1">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">User ID</span>
                <div className="flex items-center gap-2 mt-1 text-sm font-mono text-gray-300">
                  <Fingerprint className="h-4 w-4 text-gray-400" />
                  {user.id}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Card */}
          <Card className="glass flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-400" />
                  Role Profile
                </CardTitle>
                <CardDescription>Your privileges on this platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Assigned Role
                  </span>
                  <Badge variant="default" className="text-sm py-1 px-3">
                    {user.role?.name || "Customer"}
                  </Badge>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    Permissions
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.role?.permissions?.map((p) => (
                      <span
                        key={p.id}
                        className="text-xs font-mono bg-gray-900 border border-gray-800 text-gray-300 rounded px-2 py-0.5"
                      >
                        {p.permission}
                      </span>
                    )) || <span className="text-xs text-gray-500">No permissions</span>}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Sessions Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-400" />
              Active Sessions
            </CardTitle>
            <CardDescription>Monitor your active login sessions and devices</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-medium">
                  <th className="py-3 px-4">Browser / OS</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Logged In</th>
                  <th className="py-3 px-4">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {sessions.map((s) => (
                  <tr key={s.id} className="text-gray-300 hover:bg-gray-900/10">
                    <td className="py-3.5 px-4 font-medium max-w-xs truncate" title={s.userAgent}>
                      {s.userAgent?.split(" ")[0] || "Unknown Browser"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{s.ipAddress || "127.0.0.1"}</td>
                    <td className="py-3.5 px-4 flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(s.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
