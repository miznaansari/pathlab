"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Check, X, ShieldAlert, Clock, ShieldCheck, LogOut } from "lucide-react";
import { approveUserAction, rejectUserAction } from "@/app/actions/adminActions";
import { logoutAction } from "@/app/actions/authActions";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";

export default function UserApproveTable({ initialUsers = [] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingActionId, setPendingActionId] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.success) {
      toast.success("Logged out successfully");
      router.push(res.redirect);
      router.refresh();
    }
  };

  const handleApprove = async (userId) => {
    setPendingActionId({ id: userId, type: "approve" });
    startTransition(async () => {
      try {
        const res = await approveUserAction(userId);
        if (res.success) {
          toast.success(res.message);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, isApproved: true, rejected: false } : u
            )
          );
        } else {
          toast.error(res.message);
        }
      } catch (error) {
        toast.error("Failed to approve user.");
      } finally {
        setPendingActionId(null);
      }
    });
  };

  const handleReject = async (userId) => {
    setPendingActionId({ id: userId, type: "reject" });
    startTransition(async () => {
      try {
        const res = await rejectUserAction(userId);
        if (res.success) {
          toast.success(res.message);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, isApproved: false, rejected: true } : u
            )
          );
        } else {
          toast.error(res.message);
        }
      } catch (error) {
        toast.error("Failed to reject user.");
      } finally {
        setPendingActionId(null);
      }
    });
  };

  // Filtering logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    let status = "pending";
    if (user.isApproved) status = "approved";
    if (user.rejected) status = "rejected";

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (user) => {
    if (user.rejected) {
      return (
        <Badge variant="danger" className="flex items-center gap-1 w-fit">
          <X className="h-3 w-3" /> Rejected
        </Badge>
      );
    }
    if (user.isApproved) {
      return (
        <Badge variant="success" className="flex items-center gap-1 w-fit">
          <Check className="h-3 w-3" /> Approved
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-rose-500" />
            User Approvals
          </h1>
          <p className="text-sm text-gray-400">
            Manage incoming registration requests and permissions
          </p>
        </div>
        <Button variant="outline" className="border-gray-800 text-gray-300 hover:bg-gray-900" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout Admin
        </Button>
      </div>

      {/* Filters Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-gray-900/50 border-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <Card className="glass overflow-hidden shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} />
                      <div>
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {user.role?.name || "Customer"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.isEmailVerified ? (
                      <Badge variant="default" className="bg-indigo-950/40 text-indigo-400 border border-indigo-900/50">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="bg-red-950/40 text-red-400 border border-red-900/50">
                        Unverified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!user.isApproved && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => handleApprove(user.id)}
                          isLoading={
                            pendingActionId?.id === user.id &&
                            pendingActionId?.type === "approve"
                          }
                        >
                          Approve
                        </Button>
                      )}
                      {!user.rejected && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id)}
                          isLoading={
                            pendingActionId?.id === user.id &&
                            pendingActionId?.type === "reject"
                          }
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No users found matching filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
