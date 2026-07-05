import React from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LogOut, Calendar, ClipboardList, UserCheck, ShieldCheck, Download, Plus, FileText, FlaskConical, Activity } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  // Handle Logout natively in Server Component
  const handleLogout = async () => {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("session_token");
    redirect("/auth/login");
  };

  // Mock pathlab dashboard reports data
  const dummyLabReports = [
    { id: "REP-9081", testName: "Complete Blood Count (CBC)", date: "2026-06-25", status: "Ready", doctor: "Dr. Rachel Green" },
    { id: "REP-4310", testName: "Lipid Profile (Cholesterol)", date: "2026-06-24", status: "Ready", doctor: "Dr. Rachel Green" },
    { id: "REP-7721", testName: "HbA1c & Blood Glucose", date: "2026-06-26", status: "Processing", doctor: "Dr. Monica Geller" },
    { id: "REP-1025", testName: "Thyroid Profile (T3, T4, TSH)", date: "2026-06-27", status: "Pending Sample", doctor: "Dr. Joey Tribbiani" },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} className="h-16 w-16 text-lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">{user.name}</h1>
                <Badge variant="default" className="text-[10px] py-0.5 bg-blue-50 text-blue-700 border-blue-200">Patient Account</Badge>
              </div>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Book New Test
            </Button>
            <form action={handleLogout} className="flex-1 md:flex-none">
              <Button type="submit" variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {/* Pathlab Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="glass shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Booked Tests</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">4</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Reports Published</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">2</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Samples</p>
                <p className="text-2xl font-extrabold text-slate-950 mt-1">1</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lab Reports Table */}
        <Card className="glass shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Pathological Reports & Test Orders
              </CardTitle>
              <CardDescription className="text-slate-500">Track sample processing and download clinical lab reports</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Test Profile Name</th>
                  <th className="py-3 px-4">Prescribing Doctor</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dummyLabReports.map((report) => (
                  <tr key={report.id} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">{report.id}</td>
                    <td className="py-3.5 px-4 font-medium">{report.testName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{report.doctor}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        {report.date}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {report.status === "Ready" && (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>
                      )}
                      {report.status === "Processing" && (
                        <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Processing</Badge>
                      )}
                      {report.status === "Pending Sample" && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">Pending Sample</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {report.status === "Ready" ? (
                        <Button size="sm" variant="outline" className="h-8 border-slate-300 hover:bg-slate-50 text-slate-700">
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Support Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="glass shadow-sm">
            <CardHeader>
              <CardTitle className="text-md text-slate-800">Support & Inquiries</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>For urgent report collections or sample collection rescheduling, please dial the helpline:</p>
              <p className="font-semibold text-blue-600 text-base">+1 (800) 555-PATH</p>
            </CardContent>
          </Card>

          <Card className="glass shadow-sm">
            <CardHeader>
              <CardTitle className="text-md text-slate-800">Safety & Verification</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-emerald-600 shrink-0" />
              <div>
                <p>All lab processes are NABL certified. Your health data is protected under JWT and verified session policies.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
