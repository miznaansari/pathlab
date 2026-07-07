"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Container,
    Typography,
    Button,
    Grid, // Use Grid2 from MUI 6/9
    TextField,
    Card,
    CardContent,
    Chip,
    IconButton,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ThemeProvider,
    createTheme,
    CssBaseline,
    InputAdornment,
    CircularProgress
} from "@mui/material";
import {
    Menu as MenuIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    PhoneAndroid as PhoneIcon,
    Email as EmailIcon,
    ArrowForward as ArrowForwardIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    SupportAgent as SupportIcon,
    LocalOffer as OfferIcon
} from "@mui/icons-material";
import { toast } from "sonner";

// MUI Theme configured to match the admin dashboard colors
const theme = createTheme({
    palette: {
        primary: {
            main: "#0f766e", // Teal 700
            light: "#14b8a6", // Teal 500
            dark: "#115e59", // Teal 800
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#3b82f6", // Blue 500
        },
        background: {
            default: "#f8fafc", // Slate 50
            paper: "#ffffff",
        },
        text: {
            primary: "#0f172a", // Slate 900
            secondary: "#475569", // Slate 600
        },
    },
    typography: {
        fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
        h1: {
            fontWeight: 800,
        },
        h2: {
            fontWeight: 800,
        },
        h3: {
            fontWeight: 700,
        },
        button: {
            textTransform: "none",
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: "10px 24px",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                },
            },
        },
    },
});

export default function LandingPage() {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [contactInput, setContactInput] = useState("");
    const [inputType, setInputType] = useState("email"); // "email" or "mobile"
    const [loading, setLoading] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Dynamic input type detector
    useEffect(() => {
        const numericRegex = /^[0-9+()-\s]*$/;
        if (contactInput.trim() === "") {
            setInputType("email");
        } else if (numericRegex.test(contactInput)) {
            setInputType("mobile");
        } else {
            setInputType("email");
        }
    }, [contactInput]);

    // Track window scroll to change header background
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        if (!contactInput.trim()) {
            toast.error("Please enter your email or mobile number.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact: contactInput }),
            }).then((r) => r.json());

            if (res.success) {
                toast.success(res.message);
                setContactInput("");
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const navLinks = [
        { text: "Features", href: "#features" },
        { text: "Benefits", href: "#benefits" },
        { text: "Pricing", href: "#pricing" },
        { text: "Support", href: "#support" },
    ];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>

                {/* Navigation Bar */}
                <AppBar
                    position="fixed"
                    elevation={0}
                    sx={{
                        bgcolor: scrolled ? "rgba(255, 255, 255, 0.9)" : "transparent",
                        backdropFilter: scrolled ? "blur(12px)" : "none",
                        borderBottom: scrolled ? "1px solid rgba(15, 118, 110, 0.1)" : "none",
                        transition: "all 0.3s ease",
                        zIndex: 1100
                    }}
                >
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ justifyContent: "space-between", height: 72 }}>
                            {/* Logo */}
                            <Box
                                component="img"
                                src="/logo/logobg.png"
                                alt="PathLab Logo"
                                sx={{ height: 48, cursor: "pointer", borderRadius: "6px" }}
                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            />

                            {/* Desktop Navigation Links */}
                            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4, alignItems: "center" }}>
                                {navLinks.map((link) => (
                                    <Typography
                                        key={link.text}
                                        component="a"
                                        href={link.href}
                                        sx={{
                                            textDecoration: "none",
                                            color: scrolled ? "text.primary" : "#334155",
                                            fontWeight: 600,
                                            fontSize: "0.95rem",
                                            transition: "color 0.2s",
                                            "&:hover": { color: "primary.main" }
                                        }}
                                    >
                                        {link.text}
                                    </Typography>
                                ))}
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => router.push("/auth/login")}
                                    sx={{ borderColor: "rgba(15, 118, 110, 0.4)", color: scrolled ? "primary.main" : "#334155" }}
                                >
                                    Customer Login
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => router.push("/admin/auth/login")}
                                    endIcon={<ArrowForwardIcon />}
                                >
                                    Admin Console
                                </Button>
                            </Box>

                            {/* Mobile Menu Icon */}
                            <IconButton
                                edge="end"
                                sx={{ display: { xs: "flex", md: "none" }, color: "primary.main" }}
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Toolbar>
                    </Container>
                </AppBar>

                {/* Mobile Navigation Drawer */}
                <Drawer
                    anchor="right"
                    open={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                >
                    <Box sx={{ width: 280, p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                            <Box component="img" src="/logo/logobg.png" alt="Pathlab" sx={{ height: 40, borderRadius: "4px" }} />
                            <IconButton onClick={() => setMobileMenuOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <List sx={{ mb: "auto" }}>
                            {navLinks.map((link) => (
                                <ListItem key={link.text} disablePadding>
                                    <ListItemButton
                                        component="a"
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        sx={{ py: 1.5, borderRadius: 2 }}
                                    >
                                        <ListItemText primary={link.text} primaryTypographyProps={{ fontWeight: 600, color: "text.primary" }} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    router.push("/auth/login");
                                }}
                            >
                                Customer Login
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    router.push("/admin/auth/login");
                                }}
                                endIcon={<ArrowForwardIcon />}
                            >
                                Admin Console
                            </Button>
                        </Box>
                    </Box>
                </Drawer>

                {/* HERO SECTION (100vh) */}
                <Box
                    sx={{
                        minHeight: "100vh",
                        pt: { xs: 12, md: 10 },
                        pb: { xs: 8, md: 6 },
                        display: "flex",
                        alignItems: "center",
                        background: "radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.05) 0%, rgba(255, 255, 255, 0) 60%)",
                        position: "relative"
                    }}
                >
                    <Container maxWidth="lg">
                        <Grid container spacing={6} sx={{ alignItems: "center" }}>
                            {/* Hero Left Content */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ pr: { md: 2 } }}>
                                    <Chip
                                        icon={<OfferIcon sx={{ fontSize: "1rem !important", color: "primary.main" }} />}
                                        label="WELCOME OFFER • 3 DAYS FREE TRIAL"
                                        color="primary"
                                        variant="outlined"
                                        sx={{
                                            px: 1.5,
                                            py: 2,
                                            fontWeight: 700,
                                            color: "primary.main",
                                            borderColor: "rgba(15, 118, 110, 0.2)",
                                            backgroundColor: "rgba(15, 118, 110, 0.03)",
                                            mb: 3
                                        }}
                                    />
                                    <Typography
                                        variant="h1"
                                        sx={{
                                            fontSize: { xs: "2.5rem", sm: "3.2rem", md: "3.6rem" },
                                            lineHeight: 1.15,
                                            color: "text.primary",
                                            mb: 2.5
                                        }}
                                    >
                                        Online Lab Reports Made <Box component="span" sx={{ color: "primary.main" }}>Beautiful</Box> & Simple
                                    </Typography>

                                    <Typography variant="body1" sx={{ fontSize: "1.125rem", color: "text.secondary", mb: 4, lineHeight: 1.6 }}>
                                        Run your diagnostic laboratory workspace with ease. Register patients, input test parameters, and share digital medical reports instantly. High performance, zero limitation.
                                    </Typography>

                                    {/* Interactive Lead Capture Form */}
                                    <Box
                                        component="form"
                                        onSubmit={handleLeadSubmit}
                                        sx={{
                                            p: 1,
                                            borderRadius: "14px",
                                            bgcolor: "#ffffff",
                                            boxShadow: "0 10px 30px rgba(15, 118, 110, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)",
                                            border: "1px solid rgba(15, 118, 110, 0.12)",
                                            display: "flex",
                                            flexDirection: { xs: "column", sm: "row" },
                                            gap: 1.5,
                                            mb: 2
                                        }}
                                    >
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            placeholder="Enter mobile number or email"
                                            value={contactInput}
                                            onChange={(e) => setContactInput(e.target.value)}
                                            slotProps={{
                                                input: {
                                                    disableUnderline: true,
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ pl: 1.5, pr: 0.5 }}>
                                                            {inputType === "mobile" ? (
                                                                <PhoneIcon sx={{ color: "primary.main" }} />
                                                            ) : (
                                                                <EmailIcon sx={{ color: "primary.main" }} />
                                                            )}
                                                        </InputAdornment>
                                                    ),
                                                }
                                            }}
                                            sx={{
                                                justifyContent: "center",
                                                "& .MuiInputBase-input": {
                                                    py: 1.5,
                                                    fontSize: "1rem",
                                                    fontWeight: 500
                                                }
                                            }}
                                        />
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            disabled={loading}
                                            sx={{
                                                py: { xs: 1.8, sm: 1.5 },
                                                px: 4,
                                                whiteSpace: "nowrap",
                                                borderRadius: "10px",
                                                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.2)",
                                                "&:hover": { boxShadow: "0 6px 16px rgba(15, 118, 110, 0.3)" }
                                            }}
                                        >
                                            {loading ? (
                                                <CircularProgress size={24} color="inherit" />
                                            ) : (
                                                "Claim Free Trial"
                                            )}
                                        </Button>
                                    </Box>

                                    <Typography variant="caption" sx={{ display: "block", color: "text.secondary", pl: 1 }}>
                                        🚀 <b>3 Days Free Trial</b> • No Credit Card Required • No limits
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Hero Right Mockup Image */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box
                                    sx={{
                                        position: "relative",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    {/* Decorative glowing gradient blur */}
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            width: "80%",
                                            height: "80%",
                                            bgcolor: "rgba(20, 184, 166, 0.2)",
                                            filter: "blur(70px)",
                                            borderRadius: "50%",
                                            zIndex: 1
                                        }}
                                    />

                                    {/* Main Mockup Card */}
                                    <Card
                                        sx={{
                                            zIndex: 2,
                                            overflow: "hidden",
                                            border: "4px solid rgba(255, 255, 255, 0.9)",
                                            transform: { md: "perspective(1000px) rotateY(-8deg) rotateX(4deg) scale(1.02)" },
                                            transition: "transform 0.4s ease",
                                            "&:hover": {
                                                transform: { md: "perspective(1000px) rotateY(-4deg) rotateX(2deg) scale(1.04)" }
                                            }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src="/landing/test report table.png"
                                            alt="PathLab Dashboard Preview"
                                            sx={{
                                                width: "100%",
                                                height: "auto",
                                                display: "block",
                                                maxHeight: 480,
                                                objectFit: "cover",
                                                objectPosition: "top"
                                            }}
                                        />
                                    </Card>
                                </Box>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* BENEFITS SECTION */}
                <Box id="benefits" sx={{ py: 12, bgcolor: "#ffffff", borderTop: "1px solid rgba(15, 118, 110, 0.05)" }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: "center", mb: 8, maxWidth: 640, mx: "auto" }}>
                            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, mb: 2 }}>
                                Why Diagnostic Labs Love Pathlab
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Designed by medical software experts to eliminate paper bottlenecks and speed up patient test report delivery.
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card variant="outlined" sx={{ height: "100%", bgcolor: "rgba(248, 250, 252, 0.5)", borderColor: "rgba(15, 118, 110, 0.08)" }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box sx={{ p: 2, width: 56, height: 56, borderRadius: 3, bgcolor: "rgba(20, 184, 166, 0.1)", color: "primary.main", mb: 3, display: "flex", alignItems: "center", justifyItems: "center" }}>
                                            <SpeedIcon sx={{ fontSize: 26, mx: "auto" }} />
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                                            Super Fast Report Delivery
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            Instantly record patient details, enter values, and generate PDF lab reports. No lag, no system crashes. Deliver digital results to patients in real-time.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card variant="outlined" sx={{ height: "100%", bgcolor: "rgba(248, 250, 252, 0.5)", borderColor: "rgba(15, 118, 110, 0.08)" }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box sx={{ p: 2, width: 56, height: 56, borderRadius: 3, bgcolor: "rgba(20, 184, 166, 0.1)", color: "primary.main", mb: 3, display: "flex", alignItems: "center", justifyItems: "center" }}>
                                            <CheckCircleIcon sx={{ fontSize: 26, mx: "auto" }} />
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                                            Zero Learning Curve UI
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            A clean and intuitive layout that laboratory technicians can master within 5 minutes. Spend zero time on training, and more time processing medical samples.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card variant="outlined" sx={{ height: "100%", bgcolor: "rgba(248, 250, 252, 0.5)", borderColor: "rgba(15, 118, 110, 0.08)" }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box sx={{ p: 2, width: 56, height: 56, borderRadius: 3, bgcolor: "rgba(20, 184, 166, 0.1)", color: "primary.main", mb: 3, display: "flex", alignItems: "center", justifyItems: "center" }}>
                                            <SecurityIcon sx={{ fontSize: 26, mx: "auto" }} />
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                                            Secure Cloud Platform
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            Your diagnostic lab database is backed up continuously on secure endpoints. Control patient privacy and restrict user accesses with roles and permissions.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* FEATURES SHOWCASE SECTION */}
                <Box id="features" sx={{ py: 12, bgcolor: "background.default" }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: "center", mb: 10, maxWidth: 640, mx: "auto" }}>
                            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, mb: 2 }}>
                                Comprehensive Laboratory Suite
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Explore the powerful tools built directly into our platform designed for diagnostic efficiency.
                            </Typography>
                        </Box>

                        {/* Feature 1 */}
                        <Grid container spacing={6} sx={{ alignItems: "center", mb: 12 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box>
                                    <Typography variant="h3" sx={{ fontSize: "1.8rem", mb: 2, color: "text.primary" }}>
                                        Seamless Patient Registration
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                        Add patient profiles, record age/gender details, select bill modes, assign refering doctors, and capture barcode stickers dynamically. Everything you need on a single, easy-to-use form.
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                                        <CheckCircleIcon sx={{ color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Real-time validation of patient inputs</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5 }}>
                                        <CheckCircleIcon sx={{ color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Custom stickers, barcodes & payment modes</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{ border: "1px solid rgba(15, 118, 110, 0.08)", boxShadow: "0 15px 45px rgba(0,0,0,0.06)" }}>
                                    <Box component="img" src="/landing/register patient.png" alt="Register Patient Screen" sx={{ width: "100%", height: "auto", display: "block" }} />
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Feature 2 */}
                        <Grid container spacing={6} sx={{ alignItems: "center", mb: 12, flexDirection: { xs: "column-reverse", md: "row" } }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{ border: "1px solid rgba(15, 118, 110, 0.08)", boxShadow: "0 15px 45px rgba(0,0,0,0.06)" }}>
                                    <Box component="img" src="/landing/test report table.png" alt="Test Reports Management Screen" sx={{ width: "100%", height: "auto", display: "block" }} />
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ pl: { md: 4 } }}>
                                    <Typography variant="h3" sx={{ fontSize: "1.8rem", mb: 2, color: "text.primary" }}>
                                        Smart Test Parameter Tracking
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                        Manage test tables with precise, customizable parameters. Search, filter, and track statuses of medical reports in a responsive table. Process and update patient findings instantly.
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                                        <CheckCircleIcon sx={{ color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Customize parameters for male, female, or babies</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5 }}>
                                        <CheckCircleIcon sx={{ color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Quick search & print-to-PDF report generation</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Feature 3 */}
                        <Grid container spacing={6} sx={{ alignItems: "center" }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box>
                                    <Typography variant="h3" sx={{ fontSize: "1.8rem", mb: 2, color: "text.primary" }}>
                                        Doctor Referral Summaries
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                        Track all doctor references, calculate referral percentages and incentives, and manage balances in a centralized portal. Accelerate B2B lab growth with transparent sharing tools.
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                                        <CheckCircleIcon sx={{ color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Automated incentive calculations per reference</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5 }}>
                                        <CheckCircleIcon sx={{ color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Easy report summaries ready for billing review</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{ border: "1px solid rgba(15, 118, 110, 0.08)", boxShadow: "0 15px 45px rgba(0,0,0,0.06)" }}>
                                    <Box component="img" src="/landing/doctor referal.png" alt="Doctor Referrals Screen" sx={{ width: "100%", height: "auto", display: "block" }} />
                                </Card>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* PRICING SECTION */}
                <Box id="pricing" sx={{ py: 12, bgcolor: "#ffffff", borderTop: "1px solid rgba(15, 118, 110, 0.05)" }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: "center", mb: 8, maxWidth: 640, mx: "auto" }}>
                            <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, mb: 2 }}>
                                Transparent Pricing Built for Labs
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Activate your account in seconds. Test the full platform for 3 days without any credit card or limitations.
                            </Typography>
                        </Box>

                        <Grid container spacing={4} sx={{ justifyContent: "center" }}>
                            {/* Free Trial Card */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        height: "100%",
                                        borderColor: "rgba(15, 118, 110, 0.12)",
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative"
                                    }}
                                >
                                    <CardContent sx={{ p: 4, flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", mb: 2 }}>
                                            Trial Plan
                                        </Typography>
                                        <Typography variant="h3" sx={{ fontSize: "2.2rem", fontWeight: 800, mb: 1, color: "text.primary" }}>
                                            Free Trial
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            Try it out first.
                                        </Typography>

                                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: "primary.main" }}>
                                            ₹0 <Box component="span" sx={{ fontSize: "1rem", color: "text.secondary", fontWeight: 500 }}>/ 3 Days</Box>
                                        </Typography>

                                        <Box sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)", my: 3 }} />

                                        <List sx={{ p: 0 }}>
                                            {["3 Days Access", "No limitations on features", "Create patient profiles", "Generate reports", "Support team access"].map((feat) => (
                                                <ListItem key={feat} disableGutters sx={{ py: 0.75, display: "flex", gap: 1 }}>
                                                    <CheckCircleIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                                                    <Typography variant="body2" color="text.secondary">{feat}</Typography>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </CardContent>
                                    <Box sx={{ p: 4, pt: 0 }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                        >
                                            Start Free Trial
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>

                            {/* Monthly Card */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        height: "100%",
                                        borderColor: "rgba(15, 118, 110, 0.12)",
                                        display: "flex",
                                        flexDirection: "column"
                                    }}
                                >
                                    <CardContent sx={{ p: 4, flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", mb: 2 }}>
                                            Monthly Plan
                                        </Typography>
                                        <Typography variant="h3" sx={{ fontSize: "2.2rem", fontWeight: 800, mb: 1, color: "text.primary" }}>
                                            Standard
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            Perfect for growing labs.
                                        </Typography>

                                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 3 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                                                ₹399
                                            </Typography>
                                            <Typography variant="body2" sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                                                ₹599
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                / month
                                            </Typography>
                                        </Box>

                                        <Box sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)", my: 3 }} />

                                        <List sx={{ p: 0 }}>
                                            {["Full access", "Unlimited registrations", "All PDF templates", "Doctor Referral summaries", "Email support", "Cloud backups"].map((feat) => (
                                                <ListItem key={feat} disableGutters sx={{ py: 0.75, display: "flex", gap: 1 }}>
                                                    <CheckCircleIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                                                    <Typography variant="body2" color="text.secondary">{feat}</Typography>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </CardContent>
                                    <Box sx={{ p: 4, pt: 0 }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                        >
                                            Subscribe Monthly
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>

                            {/* Yearly Card (Most Popular) */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card
                                    elevation={3}
                                    sx={{
                                        height: "100%",
                                        border: "2px solid #0f766e",
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative",
                                        transform: { md: "scale(1.05)" },
                                        zIndex: 5
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 16,
                                            right: 16,
                                            bgcolor: "primary.main",
                                            color: "primary.contrastText",
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1.5,
                                            boxShadow: "0 2px 8px rgba(15, 118, 110, 0.2)"
                                        }}
                                    >
                                        WELCOME OFFER
                                    </Box>
                                    <CardContent sx={{ p: 4, flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", mb: 2 }}>
                                            Yearly Plan
                                        </Typography>
                                        <Typography variant="h3" sx={{ fontSize: "2.2rem", fontWeight: 800, mb: 1, color: "text.primary" }}>
                                            Premium Value
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            Best offer for labs.
                                        </Typography>

                                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 3 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main" }}>
                                                ₹3,999
                                            </Typography>
                                            <Typography variant="body2" sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                                                ₹5,999
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                / year
                                            </Typography>
                                        </Box>

                                        <Box sx={{ borderBottom: "1px solid rgba(15, 118, 110, 0.1)", my: 3 }} />

                                        <List sx={{ p: 0 }}>
                                            {["Full access", "Save ~₹800 (15%+ off)", "Unlimited registrations", "All PDF templates & custom configs", "Priority 24/7 Phone & Whatsapp support", "Daily database backups"].map((feat) => (
                                                <ListItem key={feat} disableGutters sx={{ py: 0.75, display: "flex", gap: 1 }}>
                                                    <CheckCircleIcon sx={{ color: "primary.main", fontSize: "1.1rem" }} />
                                                    <Typography variant="body2" color="text.secondary">{feat}</Typography>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </CardContent>
                                    <Box sx={{ p: 4, pt: 0 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                        >
                                            Subscribe Yearly
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* FAST SUPPORT SECTION */}
                <Box id="support" sx={{ py: 12, bgcolor: "background.default", borderTop: "1px solid rgba(15, 118, 110, 0.05)" }}>
                    <Container maxWidth="md">
                        <Card variant="outlined" sx={{ border: "1px solid rgba(15, 118, 110, 0.12)", bgcolor: "rgba(255,255,255,0.8)", p: { xs: 2, sm: 4 } }}>
                            <CardContent>
                                <Grid container spacing={4} sx={{ alignItems: "center" }}>
                                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: "center" }}>
                                        <Box sx={{ p: 3, borderRadius: "50%", bgcolor: "rgba(20, 184, 166, 0.08)", color: "primary.main" }}>
                                            <SupportIcon sx={{ fontSize: 64 }} />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <Chip
                                            label="SUPPORT ACTIVE"
                                            color="primary"
                                            size="small"
                                            sx={{ fontWeight: 700, mb: 1.5, bgcolor: "primary.main" }}
                                        />
                                        <Typography variant="h3" sx={{ fontSize: "1.8rem", mb: 2 }}>
                                            Need help setting up your lab workspace?
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3.5, lineHeight: 1.6 }}>
                                            Our expert medical software support team is active 24/7. We can pre-seed your common lab test templates (CBC, Lipid, Thyroid profile etc.) and link your letterhead in under 10 minutes.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            component="a"
                                            href="https://wa.me/911234567890" // Placeholder phone link
                                            target="_blank"
                                            sx={{
                                                bgcolor: "#25d366", // WhatsApp Green
                                                color: "#fff",
                                                "&:hover": { bgcolor: "#128c7e" }
                                            }}
                                        >
                                            Chat with support on WhatsApp
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Container>
                </Box>

                {/* FOOTER */}
                <Box sx={{ bgcolor: "#0f172a", color: "#94a3b8", py: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={4} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box component="img" src="/logo/logobg.png" alt="PathLab Logo" sx={{ height: 48, mb: 2, borderRadius: "6px", filter: "brightness(0.9)" }} />
                                <Typography variant="body2" sx={{ maxWidth: 360, lineHeight: 1.6 }}>
                                    Modern, secure, and professional diagnostic laboratory software for managing patient reports, referral metrics, and data summaries efficiently.
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: "#f8fafc", fontWeight: 700, mb: 2, textTransform: "uppercase" }}>
                                    Product
                                </Typography>
                                <List sx={{ p: 0 }}>
                                    {navLinks.map((link) => (
                                        <ListItem key={link.text} disableGutters sx={{ py: 0.5 }}>
                                            <Typography
                                                component="a"
                                                href={link.href}
                                                sx={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", "&:hover": { color: "#ffffff" } }}
                                            >
                                                {link.text}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: "#f8fafc", fontWeight: 700, mb: 2, textTransform: "uppercase" }}>
                                    Security & Trust
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: "0.875rem" }}>
                                    100% HIPAA compliant data practices. Continuous backup and encrypted records transfer.
                                </Typography>
                            </Grid>
                        </Grid>

                        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", pt: 4, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="caption">
                                © {new Date().getFullYear()} Pathlab. All rights reserved. Authorized personnel console access under license.
                            </Typography>
                            <Box sx={{ display: "flex", gap: 3, mt: { xs: 2, sm: 0 } }}>
                                <Typography component="a" href="#" sx={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.75rem", "&:hover": { color: "#ffffff" } }}>
                                    Privacy Policy
                                </Typography>
                                <Typography component="a" href="#" sx={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.75rem", "&:hover": { color: "#ffffff" } }}>
                                    Terms of Service
                                </Typography>
                            </Box>
                        </Box>
                    </Container>
                </Box>

            </Box>
        </ThemeProvider>
    );
}
