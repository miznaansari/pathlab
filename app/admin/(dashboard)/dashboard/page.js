import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Badge
} from "@mui/material";
import {
  People as PeopleIcon,
  AppRegistration as RegisterIcon,
  Assignment as ReportIcon,
  SupervisorAccount as DoctorIcon,
  CheckCircle as CheckedIcon,
  PendingActions as PendingIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Ensure user is admin
  const admin = await requireAdmin("admin:view");

  // Fetch counts from DB
  const totalRegistrations = await prisma.registration.count({ where: { workspaceId: admin.workspaceId, isDeleted: false } });
  const pendingRegistrations = await prisma.registration.count({ where: { status: "Pending", workspaceId: admin.workspaceId, isDeleted: false } });
  const completedRegistrations = await prisma.registration.count({ where: { status: "Completed", workspaceId: admin.workspaceId, isDeleted: false } });
  const totalDoctors = await prisma.doctor.count({ where: { workspaceId: admin.workspaceId } });

  // Fetch recent registrations
  const recentRegistrations = await prisma.registration.findMany({
    where: { workspaceId: admin.workspaceId, isDeleted: false },
    orderBy: { date: "desc" },
    take: 5,
    include: {
      refBy: true,
      tests: {
        include: {
          test: true,
        },
      },
    },
  });

  // Calculate total billing amount (sum of totalAmount + collectionCharge)
  const billingSummary = await prisma.registration.aggregate({
    where: { workspaceId: admin.workspaceId, isDeleted: false },
    _sum: {
      totalAmount: true,
      collectionCharge: true,
      receivedAmount: true,
    },
  });

  const totalBilling = Number(billingSummary._sum.totalAmount || 0) + Number(billingSummary._sum.collectionCharge || 0);
  const totalCollected = Number(billingSummary._sum.receivedAmount || 0);

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const statCards = [
    {
      title: "Total Registrations",
      value: totalRegistrations,
      icon: <RegisterIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
      bgColor: "#ccfbf1",
    },
    {
      title: "Pending Reports",
      value: pendingRegistrations,
      icon: <PendingIcon sx={{ fontSize: 32, color: "#d97706" }} />,
      bgColor: "#fef3c7",
    },
    {
      title: "Completed Tests",
      value: completedRegistrations,
      icon: <CheckedIcon sx={{ fontSize: 32, color: "#16a34a" }} />,
      bgColor: "#dcfce7",
    },
    {
      title: "Active Doctors",
      value: totalDoctors,
      icon: <DoctorIcon sx={{ fontSize: 32, color: "#2563eb" }} />,
      bgColor: "#dbeafe",
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          Welcome back, {admin.name}!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Here is the current overview of your laboratory operations, patient registrations, and accounts.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card variant="outlined">
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: stat.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Financials & Quick Links & Recent items */}
      <Grid container spacing={4}>
        {/* Left column: Financials summary and Quick links */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Revenue Card */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUpIcon color="primary" /> Financial Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Total Invoiced Billing:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{totalBilling.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Total Cash Collected:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>₹{totalCollected.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Due Balance:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                  ₹{(totalBilling - totalCollected).toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Operations */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Quick Operations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Link href="/admin/registration" style={{ textDecoration: "none" }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: "space-between", py: 1 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    New Patient Registration
                  </Button>
                </Link>
                <Link href="/admin/test-report" style={{ textDecoration: "none" }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: "space-between", py: 1 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Manage Test Reports
                  </Button>
                </Link>
                <Link href="/admin/doctor-summary" style={{ textDecoration: "none" }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: "space-between", py: 1 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Dr. Referral Summaries
                  </Button>
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Recent registrations */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Recent Patient Registrations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Latest registrations generated in the system
                  </Typography>
                </Box>
                <Link href="/admin/test-report" style={{ textDecoration: "none" }}>
                  <Button variant="text" size="small">
                    View All
                  </Button>
                </Link>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Reg Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reg No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ref. By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRegistrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No recent registrations. Use 'New Patient Registration' to add one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentRegistrations.map((reg) => (
                        <TableRow key={reg.id} hover>
                          <TableCell>{formatDate(reg.date)}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>{reg.regNo}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{reg.title} {reg.name}</TableCell>
                          <TableCell>{reg.refBy ? reg.refBy.name : "-NA-"}</TableCell>
                          <TableCell>
                            <Badge
                              badgeContent={reg.status}
                              color={reg.status === "Completed" ? "success" : "warning"}
                              sx={{
                                "& .MuiBadge-badge": {
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  height: 16,
                                  minWidth: 55
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
