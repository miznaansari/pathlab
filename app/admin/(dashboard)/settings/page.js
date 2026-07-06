"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  OpenInNew as PreviewIcon,
  Info as HelpIcon,
  Person as PersonIcon,
  Science as TestIcon,
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import { useSearchParams, useRouter } from "next/navigation";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (tab && ["profile", "tests", "pdf"].includes(tab)) {
      setActiveSection(tab);
    }
  }, [tab]);

  // PDF Settings states
  const [settings, setSettings] = useState({
    framePdfUrl: "",
    headerMargin: 140,
    footerMargin: 100,
    useFrameDefault: true
  });

  // Profile states
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Test Management states
  const [testsList, setTestsList] = useState([]);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [testPage, setTestPage] = useState(1);
  const [testTotalPages, setTestTotalPages] = useState(1);
  const [testTotalCount, setTestTotalCount] = useState(0);
  const [testsLoading, setTestsLoading] = useState(false);

  const [openAddTestDialog, setOpenAddTestDialog] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestCode, setNewTestCode] = useState("");
  const [newTestPrice, setNewTestPrice] = useState("");
  const [isAddingTest, setIsAddingTest] = useState(false);

  const [openEditPriceDialog, setOpenEditPriceDialog] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [editingName, setEditingName] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/admin/api/settings").then((r) => r.json());
        if (res.success && res.settings) {
          setSettings({
            framePdfUrl: res.settings.framePdfUrl || "",
            headerMargin: res.settings.headerMargin ?? 140,
            footerMargin: res.settings.footerMargin ?? 100,
            useFrameDefault: res.settings.useFrameDefault ?? true
          });
          setProfileName(res.settings.name || "");
          setProfileEmail(res.settings.email || "");
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load settings data.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Fetch tests dynamically with page and search query
  const fetchTests = async (page = 1, search = "") => {
    setTestsLoading(true);
    try {
      const res = await fetch(`/admin/api/tests?page=${page}&limit=20&search=${encodeURIComponent(search)}`).then((r) => r.json());
      if (res.success && res.tests) {
        setTestsList(res.tests);
        if (res.pagination) {
          setTestPage(res.pagination.page);
          setTestTotalPages(res.pagination.totalPages);
          setTestTotalCount(res.pagination.totalCount);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch tests.", "error");
    } finally {
      setTestsLoading(false);
    }
  };

  // Trigger test fetch on page or search change (with debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTests(1, testSearchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [testSearchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= testTotalPages) {
      fetchTests(newPage, testSearchQuery);
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // PDF letterhead actions
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please upload a valid PDF file.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/admin/api/settings/upload-frame", {
        method: "POST",
        body: formData,
      }).then((r) => r.json());
      if (res.success && res.url) {
        handleInputChange("framePdfUrl", res.url);
        showToast("Letterhead frame PDF uploaded successfully!", "success");
      } else {
        showToast(res.error || "Failed to upload file.", "error");
      }
    } catch (err) {
      showToast("An error occurred during file upload.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleClearFrame = () => {
    handleInputChange("framePdfUrl", "");
    showToast("Template frame URL cleared. Click Save to apply changes.", "info");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/admin/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).then((r) => r.json());
      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.error || "Failed to save settings.", "error");
      }
    } catch (err) {
      showToast("An error occurred while saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Profile actions
  const handleProfileUpdate = async () => {
    if (!profileName.trim()) {
      showToast("Name is required.", "error");
      return;
    }

    if (oldPassword && (!newPassword || !confirmPassword)) {
      showToast("Please fill in both new password fields.", "error");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await fetch("/admin/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          oldPassword: oldPassword || null,
          newPassword: newPassword || null,
          confirmPassword: confirmPassword || null,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "Profile updated successfully!", "success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(res.message || "Failed to update profile.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while updating profile.", "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Test management actions
  const handleAddTest = async () => {
    if (!newTestName.trim()) {
      showToast("Test name is required.", "error");
      return;
    }
    if (!newTestPrice || isNaN(parseFloat(newTestPrice))) {
      showToast("Please enter a valid price.", "error");
      return;
    }

    setIsAddingTest(true);
    try {
      const res = await fetch("/admin/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTestName.trim(),
          code: newTestCode.trim() || null,
          price: parseFloat(newTestPrice),
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "Test added successfully!", "success");
        fetchTests(testPage, testSearchQuery);
        setOpenAddTestDialog(false);
        setNewTestName("");
        setNewTestCode("");
        setNewTestPrice("");
      } else {
        showToast(res.message || "Failed to add test.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while adding test.", "error");
    } finally {
      setIsAddingTest(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!editingTest) return;
    if (!editingName.trim()) {
      showToast("Test name is required.", "error");
      return;
    }
    if (!editingPrice || isNaN(parseFloat(editingPrice))) {
      showToast("Please enter a valid price.", "error");
      return;
    }

    setIsUpdatingPrice(true);
    try {
      const res = await fetch("/admin/api/tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: editingTest.id,
          price: parseFloat(editingPrice),
          name: editingName.trim(),
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "Test updated successfully!", "success");
        fetchTests(testPage, testSearchQuery);
        setOpenEditPriceDialog(false);
        setEditingTest(null);
        setEditingPrice("");
        setEditingName("");
      } else {
        showToast(res.message || "Failed to update test details.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while updating test details.", "error");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress size={45} />
        <Typography variant="body2" color="text.secondary">
          Loading system configurations...
        </Typography>
      </Box>
    );
  }

  // Tests list is paginated and filtered on server-side
  const filteredTests = testsList;

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
        ⚙️ System Settings & Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your profile, set custom test prices, configure letterhead frame PDFs, and adjust system defaults.
      </Typography>

      {activeSection === "profile" && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              👤 Update Profile Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Modify your login name and manage your account password.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3} sx={{ maxWidth: 600 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email Address"
                  fullWidth
                  size="small"
                  value={profileEmail}
                  disabled
                  helperText="Login email cannot be changed."
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Your Name"
                  fullWidth
                  size="small"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, mb: 1, color: "text.primary" }}>
                  Change Password (Optional)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  size="small"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password to make password updates"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  size="small"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  size="small"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleProfileUpdate}
                startIcon={updatingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={updatingProfile}
                sx={{ px: 4 }}
              >
                {updatingProfile ? "Updating..." : "Update Profile"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeSection === "tests" && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  🔬 Test Price & Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create new tests or override baseline pricing specifically for your lab workspace.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddTestDialog(true)}
              >
                Add Custom Test
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Search Bar */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search tests by name or test code..."
              value={testSearchQuery}
              onChange={(e) => setTestSearchQuery(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Tests Table */}
            {testsLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
                <CircularProgress size={35} />
                <Typography variant="body2" color="text.secondary">Fetching tests...</Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }}>Test Code</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }}>Test Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="right">Default Price (₹)</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="right">Your Price (₹)</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="center">Scope</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            No tests found matching search filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTests.map((test) => (
                          <TableRow key={test.id} hover>
                            <TableCell sx={{ fontMono: "true", fontSize: "0.75rem", fontWeight: 600 }}>{test.code}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{test.name}</TableCell>
                            <TableCell align="right" sx={{ color: "text.secondary" }}>₹{Number(test.globalPrice).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: test.isCustomized ? "success.main" : "text.primary" }}>
                              ₹{Number(test.price).toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              {test.isCustomized ? (
                                <Typography variant="caption" sx={{ bgcolor: "success.50", color: "success.700", border: "1px solid", borderColor: "success.200", px: 1, py: 0.2, borderRadius: 1, fontWeight: 700 }}>
                                  Workspace Custom
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ bgcolor: "grey.100", color: "grey.700", border: "1px solid", borderColor: "grey.300", px: 1, py: 0.2, borderRadius: 1, fontWeight: 500 }}>
                                  Global Default
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Modify Price">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setEditingTest(test);
                                    setEditingPrice(String(test.price));
                                    setEditingName(test.name);
                                    setOpenEditPriceDialog(true);
                                  }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination Controls */}
                {testTotalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, flexWrap: "wrap", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {(testPage - 1) * 20 + 1} - {Math.min(testPage * 20, testTotalCount)} of {testTotalCount} tests
                    </Typography>
                    <Pagination
                      count={testTotalPages}
                      page={testPage}
                      onChange={(e, page) => handlePageChange(page)}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "pdf" && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
              📄 PDF Letterhead / Frame Overlay
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a background A4 PDF that contains your pre-printed branding, logo header, and contact footer.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Current Frame Template URL
              </Typography>
              
              {settings.framePdfUrl ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "rgba(15, 118, 110, 0.05)", border: "1px solid", borderColor: "primary.light", borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1, fontStyle: "italic", wordBreak: "break-all", fontWeight: 500, color: "primary.dark" }}>
                    {settings.framePdfUrl}
                  </Typography>
                  <Tooltip title="Preview PDF Template">
                    <IconButton component="a" href={settings.framePdfUrl} target="_blank" color="primary" size="small">
                      <PreviewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear Template">
                    <IconButton onClick={handleClearFrame} color="error" size="small">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Box sx={{ p: 2, border: "2px dashed", borderColor: "grey.300", borderRadius: 3, textAlign: "center", bgcolor: "grey.50" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No background frame PDF configured. Reports will generate on blank white pages.
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                    disabled={uploading}
                    sx={{ textTransform: "none" }}
                  >
                    {uploading ? "Uploading..." : "Upload Letterhead PDF"}
                    <input
                      type="file"
                      hidden
                      accept="application/pdf"
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Header Margin (Top Space)
                  </Typography>
                  <Tooltip title="Height in points (pt) to leave blank at the top of the page for your letterhead logo & header (e.g. 1 inch = 72pt).">
                    <IconButton size="small"><HelpIcon sx={{ fontSize: "1rem" }} /></IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={settings.headerMargin}
                  onChange={(e) => handleInputChange("headerMargin", parseInt(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 0 } }}
                  placeholder="e.g. 140"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Footer Margin (Bottom Space)
                  </Typography>
                  <Tooltip title="Height in points (pt) to leave blank at the bottom of the page for your letterhead footer (e.g. 1.4 inches = 100pt).">
                    <IconButton size="small"><HelpIcon sx={{ fontSize: "1rem" }} /></IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={settings.footerMargin}
                  onChange={(e) => handleInputChange("footerMargin", parseInt(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 0 } }}
                  placeholder="e.g. 100"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.useFrameDefault}
                      onChange={(e) => handleInputChange("useFrameDefault", e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Use Letterhead Frame by Default
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        When checked, the PDF print/export button will default to overlaying reports on the template frame.
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={saving || uploading}
                sx={{ px: 4 }}
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Test Dialog */}
      <Dialog open={openAddTestDialog} onClose={() => setOpenAddTestDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Custom Test</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1.5 }}>
            <TextField
              label="Test Name"
              fullWidth
              size="small"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              required
            />
            <TextField
              label="Test Code (Optional)"
              fullWidth
              size="small"
              value={newTestCode}
              onChange={(e) => setNewTestCode(e.target.value)}
              placeholder="Will be auto-generated if left empty"
            />
            <TextField
              label="Test Price (₹)"
              type="number"
              fullWidth
              size="small"
              value={newTestPrice}
              onChange={(e) => setNewTestPrice(e.target.value)}
              required
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddTestDialog(false)} color="inherit" disabled={isAddingTest}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTest}
            variant="contained"
            disabled={isAddingTest || !newTestName.trim() || !newTestPrice}
          >
            {isAddingTest ? <CircularProgress size={24} /> : "Add Test"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Test Price Dialog */}
      <Dialog open={openEditPriceDialog} onClose={() => setOpenEditPriceDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Test Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1.5 }}>
            <TextField
              label="Test Name"
              fullWidth
              size="small"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              required
            />
            {editingTest && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                Test Code: <strong>{editingTest.code || "N/A"}</strong>
              </Typography>
            )}
            <TextField
              label="Custom Workspace Price (₹)"
              type="number"
              fullWidth
              size="small"
              value={editingPrice}
              onChange={(e) => setEditingPrice(e.target.value)}
              required
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEditPriceDialog(false)} color="inherit" disabled={isUpdatingPrice}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePrice}
            variant="contained"
            disabled={isUpdatingPrice || !editingPrice || !editingName.trim()}
          >
            {isUpdatingPrice ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress size={45} />
        <Typography variant="body2" color="text.secondary">
          Loading system configurations...
        </Typography>
      </Box>
    }>
      <SettingsContent />
    </Suspense>
  );
}
