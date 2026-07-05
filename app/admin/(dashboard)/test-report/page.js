"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Badge,
  Tooltip,
  ButtonGroup,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  Alert,
  Stack
} from "@mui/material";
import {
  Search as SearchIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  RestartAlt as ResetIcon,
  MoreVert as ActionsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from "@mui/icons-material";
import {
  getRegistrations,
  deleteRegistration,
  getRegistrationSamples,
  saveSampleDetails,
  getRegistrationTestParameters,
  savePatientResults,
  saveTestParameters
} from "@/app/actions/registrationActions";

export default function TestReportPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 10); // default last 10 days
    return d.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [search, setSearch] = useState("");

  // Popover Anchor for Actions Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);

  // Sample Management Dialog
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false);
  const [sampleRows, setSampleRows] = useState([]);
  const [sampleSaving, setSampleSaving] = useState(false);

  // Result Entry Dialog
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultRegDetails, setResultRegDetails] = useState(null);
  const [resultTests, setResultTests] = useState([]);
  const [resultValues, setResultValues] = useState({}); // { [paramId]: value }
  const [reportNotes, setReportNotes] = useState("");
  const [resultSaving, setResultSaving] = useState(false);

  // Parameter Configurator Dialog
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configTest, setConfigTest] = useState(null);
  const [configParams, setConfigParams] = useState([]);

  // Toast notifications
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getRegistrations({
        startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
        search: search || undefined
      });
      if (res.success) {
        setRegistrations(res.registrations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    setStartDate(d.toISOString().substring(0, 10));
    setEndDate(new Date().toISOString().substring(0, 10));
    setSearch("");
    setTimeout(() => loadData(), 50);
  };

  // Toast Helpers
  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // Actions Menu Event Handlers
  const handleOpenMenu = (event, reg) => {
    setAnchorEl(event.currentTarget);
    setSelectedReg(reg);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const triggerAction = (actionName) => {
    handleCloseMenu();
    showToast(`Action "${actionName}" triggered for patient ${selectedReg.name}`, "info");
  };

  // Edit Registration
  const handleEditRegistration = () => {
    handleCloseMenu();
    if (selectedReg) {
      router.push(`/admin/registration?edit=${selectedReg.id}`);
    }
  };

  // Delete Registration
  const handleDeleteRegistration = async () => {
    handleCloseMenu();
    if (!window.confirm(`Are you sure you want to delete patient registration ${selectedReg.regNo} (${selectedReg.name})?`)) {
      return;
    }
    try {
      const res = await deleteRegistration(selectedReg.id);
      if (res.success) {
        showToast(res.message, "success");
        loadData();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to delete registration", "error");
    }
  };

  // Print Report
  const handlePrintReport = () => {
    handleCloseMenu();
    window.print();
  };

  // --- SAMPLE MANAGEMENT ---
  const handleOpenSampleManagement = async () => {
    const regId = selectedReg.id;
    handleCloseMenu();
    try {
      const res = await getRegistrationSamples(regId);
      if (res.success) {
        const rows = res.registration.tests.map((rt) => ({
          testId: rt.test.id,
          testName: rt.test.name,
          sampleStatus: rt.sampleStatus,
          sampleBarcode: rt.sampleBarcode || selectedReg.barcode?.replace(/^,\s*/, "")?.split(" ")?.[0] || "",
          sampleRemark: rt.sampleRemark || "",
          sendTo: rt.sendTo || "-NA-",
          expense: rt.expense || 0,
          assessNo: rt.assessNo || "",
          pathologist: rt.pathologist || "-NA-",
          collectedBy: rt.collectedBy || "-NA-",
          product: rt.product || "-NA-"
        }));
        setSampleRows(rows);
        setSampleDialogOpen(true);
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to load sample details", "error");
    }
  };

  const handleSampleRowChange = (index, field, value) => {
    const updated = [...sampleRows];
    updated[index][field] = value;
    setSampleRows(updated);
  };

  const handleSaveSamples = async () => {
    setSampleSaving(true);
    try {
      const res = await saveSampleDetails(selectedReg.id, sampleRows);
      if (res.success) {
        showToast(res.message, "success");
        setSampleDialogOpen(false);
        loadData();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to save sample details", "error");
    } finally {
      setSampleSaving(false);
    }
  };

  // --- RESULT ENTRY ---
  const handleOpenResultEntry = async () => {
    const regId = selectedReg.id;
    handleCloseMenu();
    try {

      // 2. Fetch test parameters
      const res = await getRegistrationTestParameters(regId);
      if (res.success) {
        setResultRegDetails(res.registration);

        // Map tests and their parameters
        const tests = res.registration.tests.map(rt => rt.test);
        setResultTests(tests);

        // Map current result values
        const values = {};
        res.registration.results.forEach((r) => {
          values[r.testParameterId] = r.value;
        });
        setResultValues(values);
        setReportNotes(res.registration.remark || "");
        setResultDialogOpen(true);
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to load result parameters", "error");
    }
  };

  const handleResultValueChange = (paramId, val) => {
    setResultValues({
      ...resultValues,
      [paramId]: val
    });
  };

  const handleSaveResults = async () => {
    setResultSaving(true);
    try {
      // Map result values into array structure
      const resultsData = Object.keys(resultValues).map(paramId => ({
        testParameterId: parseInt(paramId),
        value: resultValues[paramId]
      }));

      const res = await savePatientResults(resultRegDetails.id, resultsData, reportNotes);
      if (res.success) {
        showToast(res.message, "success");
        setResultDialogOpen(false);
        loadData();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to save results", "error");
    } finally {
      setResultSaving(false);
    }
  };

  // Helper to determine active normal range based on age/gender
  const getReferenceRange = (param, reg) => {
    const isBaby = reg.ageUnit !== "Year" || reg.age < 12;
    if (isBaby) {
      return {
        rangeStr: param.normalRangeBaby || param.normalRangeDefault || "Normal",
        min: param.minValBaby,
        max: param.maxValBaby
      };
    }
    if (reg.gender === "Male") {
      return {
        rangeStr: param.normalRangeMale || param.normalRangeDefault || "Normal",
        min: param.minValMale,
        max: param.maxValMale
      };
    }
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "Normal",
      min: param.minValFemale,
      max: param.maxValFemale
    };
  };

  // Helper to check if result is out of range
  const isOutOfRange = (val, min, max) => {
    if (val === "" || val === undefined || val === null) return false;
    const num = parseFloat(val);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return true;
    if (max !== null && num > max) return true;
    return false;
  };

  // --- PARAMETER CONFIGURATOR ---
  const handleOpenConfigurator = (test) => {
    setConfigTest(test);
    // Clone parameters list
    const params = test.parameters.map((p) => ({
      id: p.id,
      name: p.name,
      minValMale: p.minValMale !== null ? String(p.minValMale) : "",
      maxValMale: p.maxValMale !== null ? String(p.maxValMale) : "",
      normalRangeMale: p.normalRangeMale || "",
      minValFemale: p.minValFemale !== null ? String(p.minValFemale) : "",
      maxValFemale: p.maxValFemale !== null ? String(p.maxValFemale) : "",
      normalRangeFemale: p.normalRangeFemale || "",
      minValBaby: p.minValBaby !== null ? String(p.minValBaby) : "",
      maxValBaby: p.maxValBaby !== null ? String(p.maxValBaby) : "",
      normalRangeBaby: p.normalRangeBaby || "",
      normalRangeDefault: p.normalRangeDefault || "",
      unit: p.unit || "-NA-"
    }));
    setConfigParams(params);
    setConfigDialogOpen(true);
  };

  const handleConfigParamChange = (index, field, value) => {
    const updated = [...configParams];
    updated[index][field] = value;
    setConfigParams(updated);
  };

  const handleAddConfigParam = () => {
    setConfigParams([
      ...configParams,
      {
        name: "",
        minValMale: "",
        maxValMale: "",
        normalRangeMale: "",
        minValFemale: "",
        maxValFemale: "",
        normalRangeFemale: "",
        minValBaby: "",
        maxValBaby: "",
        normalRangeBaby: "",
        normalRangeDefault: "Normal / Negative",
        unit: "-NA-"
      }
    ]);
  };

  const handleRemoveConfigParam = (index) => {
    const updated = [...configParams];
    updated.splice(index, 1);
    setConfigParams(updated);
  };

  const handleSaveConfigParameters = async () => {
    try {
      const res = await saveTestParameters(configTest.id, configParams);
      if (res.success) {
        showToast(res.message, "success");
        setConfigDialogOpen(false);

        // Re-load result entry details to show updated parameters
        if (resultRegDetails) {
          const freshParams = await getRegistrationTestParameters(resultRegDetails.id);
          if (freshParams.success) {
            setResultRegDetails(freshParams.registration);
            setResultTests(freshParams.registration.tests.map(rt => rt.test));
          }
        }
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to update parameters setup", "error");
    }
  };

  // Helper to format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }) + " " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  // Helper to format expected report date
  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit"
    }) + " " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header section with export utilities */}
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          Patient Test Reports
        </Typography>

        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Print List">
            <Button startIcon={<PrintIcon />}>Print</Button>
          </Tooltip>
          <Tooltip title="Email Export">
            <Button startIcon={<EmailIcon />}>Email</Button>
          </Tooltip>
          <Tooltip title="Download Excel">
            <Button startIcon={<DownloadIcon />}>Excel</Button>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Filters Toolbar Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Box component="form" onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="From Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="To Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Search Patient"
                  placeholder="Name, Reg No, Mobile..."
                  fullWidth
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton size="small" type="submit">
                        <SearchIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }} sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" fullWidth size="small" type="submit" startIcon={<SearchIcon />}>
                  Filter
                </Button>
                <IconButton color="secondary" onClick={handleResetFilters} title="Reset filters">
                  <ResetIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Registrations List Table */}
      <TableContainer component={Paper} variant="outlined">
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading test reports...
            </Typography>
          </Box>
        ) : (
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: "#e2e8f0" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>SLNO</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Reg.Date</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Reg.No</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Pat.ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Test ID(s)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Patient Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Age</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Mobile No</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Rpt.Time</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No patient registrations found in this date range.
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg, idx) => {
                  const testCodes = reg.tests.map((t) => t.test.code).join(", ");
                  const testNamesTooltip = reg.tests.map((t) => t.test.name).join("\n");

                  return (
                    <TableRow
                      key={reg.id}
                      sx={{
                        "&:hover": { bgcolor: "rgba(15, 118, 110, 0.04)" },
                        transition: "background-color 0.2s"
                      }}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(reg.date).split(" ")[0]}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>{reg.regNo}</TableCell>
                      <TableCell>{reg.labId}</TableCell>
                      <TableCell>
                        <Tooltip title={<pre style={{ fontFamily: "inherit" }}>{testNamesTooltip}</pre>}>
                          <Typography variant="body2" sx={{ cursor: "help", textDecoration: "underline dotted", fontSize: "0.82rem" }}>
                            {testCodes.length > 15 ? testCodes.substring(0, 15) + "..." : testCodes || "-"}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {reg.title} {reg.name}
                      </TableCell>
                      <TableCell>{reg.gender}</TableCell>
                      <TableCell>{reg.age.toFixed(2)} {reg.ageUnit.charAt(0)}</TableCell>
                      <TableCell>{reg.mobileNo}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatTimeOnly(reg.expRptDate)}</TableCell>
                      <TableCell sx={{ fontStyle: "italic", fontSize: "0.75rem" }}>
                        {reg.barcode ? reg.barcode.replace(/^,\s*/, "") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          badgeContent={reg.status}
                          color={reg.status === "Completed" ? "success" : "warning"}
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              height: 18,
                              minWidth: 65
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => handleOpenMenu(e, reg)}
                        >
                          <ActionsIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* --- DOUBLE-COLUMN ACTIONS MENU POPOVER --- */}
      {selectedReg && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          PaperProps={{
            sx: { p: 2.5, width: 450, borderRadius: 2, boxShadow: 8 }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary", display: "flex", justifyContent: "space-between" }}>
            <span>Patient: {selectedReg.name}</span>
            <span style={{ fontSize: "0.75rem", color: "gray" }}>Reg: {selectedReg.regNo}</span>
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {/* Left Column */}
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Assign Collection")}>» Assign Collection</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6, fontWeight: 700, color: "primary.main" }} onClick={handleOpenSampleManagement}>■ Sample Management</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Add / Edit product")}>+ Add / Edit product</Button>
                <Divider sx={{ my: 0.5 }} />
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6, fontWeight: 700, color: "primary.main" }} onClick={handleOpenResultEntry}>» Result Entry</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Show Result")}>≡ Show Result</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={handlePrintReport}>⏏ Report Print</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Print Barcode")}>Print Barcode</Button>
                <Divider sx={{ my: 0.5 }} />
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Money Receipt")}>₹ Money Receipt</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Receipt inplace")}>₹ Receipt inplace</Button>
                <Divider sx={{ my: 0.5 }} />
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6, color: "error.main" }} onClick={() => triggerAction("Cancel")}>✕ Cancel</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6, color: "error.main" }} onClick={handleDeleteRegistration}>Delete</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={handleEditRegistration}>Edit</Button>
                <Divider sx={{ my: 0.5 }} />
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Edit Inplace")}>Edit Inplace</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Receipt All")}>₹ Receipt All</Button>
              </Box>
            </Grid>

            {/* Vertical Line Divider */}
            <Divider orientation="vertical" flexItem sx={{ mx: -0.5 }} />

            {/* Right Column */}
            <Grid size={{ xs: 5.8 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pl: 1 }}>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Add / Edit reminder")}>Add / Edit reminder</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Upload Report")}>Upload Report</Button>
                <Divider sx={{ my: 0.5 }} />
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Register Again")}>Register Again</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Assign Branch")}>Assign Branch</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Transfer Patient")}>Transfer Patient</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Report Download")}>Report Download</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Compare Result")}>Compare Result</Button>
                <Divider sx={{ my: 0.5 }} />
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Mark Urgent")}>Mark Urgent</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Extra Details")}>Extra Details</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Delhivery Note")}>Delhivery Note</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Upload Document")}>Upload Document</Button>
                <Divider sx={{ my: 0.5 }} />
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Form F")}>Form F</Button>
                <Button size="small" variant="text" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", py: 0.6 }} onClick={() => triggerAction("Worksheet")}>Worksheet</Button>
              </Box>
            </Grid>
          </Grid>
        </Popover>
      )}

      {/* --- SAMPLE MANAGEMENT DIALOG --- */}
      <Dialog
        open={sampleDialogOpen}
        onClose={() => setSampleDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            🖋 Sample Management <span style={{ fontSize: "0.8rem", fontWeight: 400, opacity: 0.8 }}>(Status and barcode registration)</span>
          </Typography>
          <IconButton onClick={() => setSampleDialogOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 2 }}>
          {selectedReg && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2"><strong>Patient:</strong> {selectedReg.title} {selectedReg.name} / {selectedReg.age.toFixed(2)} {selectedReg.ageUnit} / {selectedReg.gender}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2"><strong>Partner:</strong> Main Lab Group <strong>Address:</strong> Local branch office</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Wing</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Test Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Barcode</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Sample Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Remark</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Send to</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Expense</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Assess. no</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Pathologist</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Collected By</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Product</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleRows.map((row, idx) => (
                  <TableRow key={row.testId}>
                    <TableCell>-NA-</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>{row.testName}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.sampleBarcode}
                        onChange={(e) => handleSampleRowChange(idx, "sampleBarcode", e.target.value)}
                        variant="outlined"
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.sampleStatus}
                        onChange={(e) => handleSampleRowChange(idx, "sampleStatus", e.target.value)}
                        sx={{ width: 110, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Accepted">Accepted</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.sampleRemark}
                        onChange={(e) => handleSampleRowChange(idx, "sampleRemark", e.target.value)}
                        placeholder="Remark"
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.sendTo}
                        onChange={(e) => handleSampleRowChange(idx, "sendTo", e.target.value)}
                        sx={{ width: 100, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Main Lab">Main Lab</MenuItem>
                        <MenuItem value="Branch Lab">Branch Lab</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.expense}
                        onChange={(e) => handleSampleRowChange(idx, "expense", e.target.value)}
                        sx={{ width: 70, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.assessNo}
                        onChange={(e) => handleSampleRowChange(idx, "assessNo", e.target.value)}
                        sx={{ width: 80, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.pathologist}
                        onChange={(e) => handleSampleRowChange(idx, "pathologist", e.target.value)}
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Dr. Ahmadi">Dr. Ahmadi</MenuItem>
                        <MenuItem value="Dr. ANAND KUMAR">Dr. ANAND KUMAR</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.collectedBy}
                        onChange={(e) => handleSampleRowChange(idx, "collectedBy", e.target.value)}
                        sx={{ width: 110, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Anima Lab">Anima Lab</MenuItem>
                        <MenuItem value="Staff">Staff</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>-NA-</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSampleDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
          <Button
            onClick={handleSaveSamples}
            variant="contained"
            size="small"
            startIcon={sampleSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={sampleSaving}
          >
            Save Samples
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- TEST RESULT ENTRY DIALOG --- */}
      {resultRegDetails && (
        <Dialog
          open={resultDialogOpen}
          onClose={() => setResultDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              🧪 Test Result of Patient : {resultRegDetails.name} / Age: {resultRegDetails.age.toFixed(2)} {resultRegDetails.ageUnit} / {resultRegDetails.gender} / Reg No: {resultRegDetails.regNo}
            </Typography>
            <IconButton onClick={() => setResultDialogOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2, mt: 1 }}>
            {/* Header info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Barcode</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.barcode?.replace(/^,\s*/, "") || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Mobile No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.mobileNo}</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>All Departments</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Referred By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Self</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Loop through each test and render its parameters */}
            {resultTests.map((test) => {
              const params = test.parameters || [];
              return (
                <Box key={test.id} sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", borderLeft: "4px solid", pl: 1, borderColor: "primary.main" }}>
                      {test.name} ({test.code})
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => handleOpenConfigurator(test)}
                      sx={{ textTransform: "none", py: 0.3 }}
                    >
                      Configure Parameters
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />

                  {params.length === 0 ? (
                    <Box sx={{ p: 3, border: "1px dashed", borderColor: "grey.300", borderRadius: 1, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        No parameters configured for this test yet.
                      </Typography>
                      <Button size="small" variant="contained" onClick={() => handleOpenConfigurator(test)}>
                        Add/Configure Parameters
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "grey.100" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, width: 60 }}>S/No</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Test Parameter</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Normal Value</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 250 }}>Result</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 80 }}>Order</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {params.map((param, index) => {
                            const ref = getReferenceRange(param, resultRegDetails);
                            const val = resultValues[param.id] || "";
                            const isAbnormal = isOutOfRange(val, ref.min, ref.max);

                            return (
                              <TableRow key={param.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{param.name}</TableCell>
                                <TableCell>{ref.rangeStr}</TableCell>
                                <TableCell>{param.unit}</TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={val}
                                    onChange={(e) => handleResultValueChange(param.id, e.target.value)}
                                    error={isAbnormal}
                                    sx={{
                                      "& .MuiInputBase-root": {
                                        bgcolor: isAbnormal ? "rgba(239, 68, 68, 0.15)" : "inherit"
                                      },
                                      "& .MuiInputBase-input": {
                                        py: 0.5,
                                        fontSize: "0.85rem",
                                        fontWeight: isAbnormal ? 700 : 500
                                      }
                                    }}
                                    InputProps={{
                                      endAdornment: isAbnormal && (
                                        <Tooltip title="Out of normal range!">
                                          <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                        </Tooltip>
                                      )
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{param.order}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              );
            })}

            {/* Note/Remark editor */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Report Remarks / Summary Note</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Enter overall review comment, findings summary or notes..."
                variant="outlined"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setResultDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
            <Button
              onClick={handleSaveResults}
              variant="contained"
              size="small"
              startIcon={resultSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={resultSaving}
            >
              Save Results & Complete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* --- PARAMETER CONFIGURATOR DIALOG --- */}
      {configTest && (
        <Dialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              ⚙ Configure Parameters : {configTest.name}
            </Typography>
            <IconButton onClick={() => setConfigDialogOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Setup the sub-fields and normal reference ranges for Male, Female, and Baby groups.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddConfigParam}
                sx={{ textTransform: "none" }}
              >
                Add Field
              </Button>
            </Box>

            {configParams.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center", border: "1px dashed", borderColor: "grey.300", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No parameters defined. Click "Add Field" to define parameters.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2} sx={{ maxHeight: 450, overflowY: "auto", pr: 1 }}>
                {configParams.map((param, index) => (
                  <Card variant="outlined" key={index} sx={{ p: 2, position: "relative" }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveConfigParam(index)}
                      sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Parameter Name"
                          size="small"
                          fullWidth
                          value={param.name}
                          onChange={(e) => handleConfigParamChange(index, "name", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 3 }}>
                        <TextField
                          label="Unit"
                          size="small"
                          fullWidth
                          value={param.unit}
                          onChange={(e) => handleConfigParamChange(index, "unit", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 3 }}>
                        <TextField
                          label="Default Normal Text"
                          size="small"
                          fullWidth
                          value={param.normalRangeDefault}
                          onChange={(e) => handleConfigParamChange(index, "normalRangeDefault", e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }} sx={{ my: 0.5 }}><Divider /></Grid>

                      {/* Male Ranges */}
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>Male Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValMale} onChange={(e) => handleConfigParamChange(index, "minValMale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValMale} onChange={(e) => handleConfigParamChange(index, "maxValMale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} value={param.normalRangeMale} onChange={(e) => handleConfigParamChange(index, "normalRangeMale", e.target.value)} />
                      </Grid>

                      {/* Female Ranges */}
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "secondary.main" }}>Female Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValFemale} onChange={(e) => handleConfigParamChange(index, "minValFemale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValFemale} onChange={(e) => handleConfigParamChange(index, "maxValFemale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} value={param.normalRangeFemale} onChange={(e) => handleConfigParamChange(index, "normalRangeFemale", e.target.value)} />
                      </Grid>

                      {/* Baby Ranges */}
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main" }}>Baby/Child Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValBaby} onChange={(e) => handleConfigParamChange(index, "minValBaby", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValBaby} onChange={(e) => handleConfigParamChange(index, "maxValBaby", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} value={param.normalRangeBaby} onChange={(e) => handleConfigParamChange(index, "normalRangeBaby", e.target.value)} />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfigDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
            <Button onClick={handleSaveConfigParameters} variant="contained" size="small" startIcon={<SaveIcon />}>
              Save Parameters Setup
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* --- TOAST ALERTS --- */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
