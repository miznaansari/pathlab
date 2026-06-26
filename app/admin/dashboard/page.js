import React from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions/authActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ShieldAlert, Users, CheckCircle, XCircle, Clock, ArrowRight, LogOut, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Ensure user is admin
  const user = await requireAdmin("admin:view");

  // Fetch counts
  const totalUsers = await prisma.user.count();
  const pendingApprovals = await prisma.user.count({ where: { isApproved: false, rejected: false } });
  const approvedUsers = await prisma.user.count({ where: { isApproved: true } });
  const rejectedUsers = await prisma.user.count({ where: { rejected: true } });

  // Fetch recent signups
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { role: true },
  });

  const handleLogout = async () => {
    "use server";
    const res = await logoutAction();
    if (res.success) {
      redirect(res.redirect);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-blue-600" />
              Admin Portal
            </h1>
            <p className="text-sm text-slate-500">
              Overview of registrations and platform statistics
            </p>
          </div>
          <form action={handleLogout} className="flex gap-3">
            <Link href="/admin/userApprove">
              <Button type="button" variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                Manage Approvals
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button type="submit" variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout Admin
            </Button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Accounts</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">{totalUsers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Approval</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">{pendingApprovals}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Approved Users</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">{approvedUsers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rejected Accounts</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">{rejectedUsers}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions / Info */}
          <div className="space-y-6">
            <Card className="glass shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Quick Operations</CardTitle>
                <CardDescription className="text-slate-500">Frequently used administrator tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/userApprove" className="block">
                  <Button variant="outline" className="w-full justify-between bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                    <span className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-blue-600" />
                      Approval Workspace
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Admin Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div>
                  <span className="font-semibold block text-slate-800">Logged in as:</span>
                  {user.name} ({user.email})
                </div>
                <div>
                  <span className="font-semibold block text-slate-800">Role:</span>
                  <Badge variant="default">{user.role?.name}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Signups */}
          <Card className="glass lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg text-slate-800">Recent Signups</CardTitle>
                <CardDescription className="text-slate-500">Most recently registered users</CardDescription>
              </div>
              <Link href="/admin/userApprove" className="text-xs text-blue-600 font-bold hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {recentUsers.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} />
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {r.role?.name || "Customer"}
                      </Badge>
                      {r.rejected ? (
                        <span className="text-xs text-red-600 font-semibold">Rejected</span>
                      ) : r.isApproved ? (
                        <span className="text-xs text-emerald-600 font-semibold">Approved</span>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
