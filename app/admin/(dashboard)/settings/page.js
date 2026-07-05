"use client";

import React, { useState, useEffect } from "react";
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
  Tooltip
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  OpenInNew as PreviewIcon,
  Info as HelpIcon
} from "@mui/icons-material";
// Server Action imports removed

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    framePdfUrl: "",
    headerMargin: 140,
    footerMargin: 100,
    useFrameDefault: true
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const res = await fetch("/admin/api/settings").then((r) => r.json());
      if (res.success && res.settings) {
        setSettings({
          framePdfUrl: res.settings.framePdfUrl || "",
          headerMargin: res.settings.headerMargin ?? 140,
          footerMargin: res.settings.footerMargin ?? 100,
          useFrameDefault: res.settings.useFrameDefault ?? true
        });
      } else if (res.error) {
        showToast(res.error, "error");
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

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

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
        ⚙️ System & Report Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure letterhead frame overlays, R2 storage connections, and A4 print dimensions.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
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
                <Grid item xs={12} sm={6}>
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

                <Grid item xs={12} sm={6}>
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

                <Grid item xs={12}>
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
        </Grid>
      </Grid>

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
