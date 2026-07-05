"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from "@mui/icons-material";
import { useSearchParams, useRouter } from "next/navigation";

export default function RegistrationPage() {
  // Page states
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [billOn, setBillOn] = useState("Patient Rate");
  const [mobileNo, setMobileNo] = useState("");
  const [regDate, setRegDate] = useState(new Date().toISOString().substring(0, 10));
  const [title, setTitle] = useState("Mr.");
  const [name, setName] = useState("");
  const [city, setCity] = useState("-NA-");
  const [age, setAge] = useState("");
  const [ageUnit, setAgeUnit] = useState("Year");
  const [gender, setGender] = useState("Male");
  const [refBy, setRefBy] = useState(null);
  const [secondRef, setSecondRef] = useState(null);
  const [remark, setRemark] = useState("");

  const [selectedTests, setSelectedTests] = useState([]);
  const [testSearchInput, setTestSearchInput] = useState("");

  // Payment states
  const [colType, setColType] = useState("Camp");
  const [expRptDate, setExpRptDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default tomorrow
    return d.toISOString().substring(0, 16);
  });
  const [sampleDate, setSampleDate] = useState(new Date().toISOString().substring(0, 16));
  const [sampleNo, setSampleNo] = useState("");
  const [sampleBy, setSampleBy] = useState("-NA-");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [collectionCharge, setCollectionCharge] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [stickerCount, setStickerCount] = useState(1);

  // Notifications
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Load initial data (doctors & tests)
  useEffect(() => {
    async function loadData() {
      try {
        const [docsRes, testsRes] = await Promise.all([
          fetch("/admin/api/doctors").then((r) => r.json()),
          fetch("/admin/api/tests").then((r) => r.json())
        ]);
        if (docsRes.success) setDoctors(docsRes.doctors);
        if (testsRes.success) {
          const parsedTests = testsRes.tests.map((t) => ({
            ...t,
            price: Number(t.price) || 0,
          }));
          setTests(parsedTests);
        }
      } catch (err) {
        console.error(err);
        showNotification("Failed to load initial data", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load registration data for editing if editId is active
  useEffect(() => {
    if (!editId || doctors.length === 0 || tests.length === 0) return;

    async function fetchReg() {
      setLoading(true);
      try {
        const res = await fetch(`/admin/api/registrations/${parseInt(editId)}`).then((r) => r.json());
        if (res.success) {
          const reg = res.registration;
          setBillOn(reg.billOn);
          setMobileNo(reg.mobileNo);
          setRegDate(new Date(reg.date).toISOString().substring(0, 10));
          setTitle(reg.title);
          setName(reg.name);
          setCity(reg.city);
          setAge(reg.age);
          setAgeUnit(reg.ageUnit);
          setGender(reg.gender);
          setRemark(reg.remark || "");
          setColType(reg.colType);
          if (reg.expRptDate) setExpRptDate(new Date(reg.expRptDate).toISOString().substring(0, 16));
          if (reg.sampleDate) setSampleDate(new Date(reg.sampleDate).toISOString().substring(0, 16));
          setSampleNo(reg.sampleNo || "");
          setSampleBy(reg.sampleBy);
          setPaymentMode(reg.paymentMode);
          setPaymentRefNo(reg.paymentRefNo || "");
          setCollectionCharge(Number(reg.collectionCharge));
          setDiscountPercent(Number(reg.discountPercent));
          setDiscountAmount(Number(reg.discountAmount));
          setReceivedAmount(Number(reg.receivedAmount));
          setStickerCount(reg.stickerCount);

          if (reg.refById) {
            const doc = doctors.find((d) => d.id === reg.refById);
            if (doc) setRefBy(doc);
          }
          if (reg.secondRefId) {
            const doc = doctors.find((d) => d.id === reg.secondRefId);
            if (doc) setSecondRef(doc);
          }

          const testIdsList = reg.tests.map((rt) => rt.testId);
          const mappedTests = tests.filter((t) => testIdsList.includes(t.id));
          setSelectedTests(mappedTests);
        } else {
          showNotification(res.message, "error");
        }
      } catch (err) {
        console.error(err);
        showNotification("Failed to load registration details", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchReg();
  }, [editId, doctors, tests]);

  // Keyboard shortcut F10 for saving
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F10") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    billOn, mobileNo, regDate, title, name, city, age, ageUnit, gender,
    refBy, secondRef, remark, selectedTests, colType, expRptDate, sampleDate,
    sampleNo, sampleBy, paymentMode, paymentRefNo, collectionCharge,
    discountPercent, discountAmount, receivedAmount, stickerCount
  ]);

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    const maleTitles = ["Mr.", "Mast.", "Md.", "Baba (M)", "S/O"];
    const femaleTitles = ["Mrs.", "Ms.", "Miss.", "Sister", "Baby (F)", "W/O", "D/O"];
    
    if (maleTitles.includes(val)) {
      setGender("Male");
    } else if (femaleTitles.includes(val)) {
      setGender("Female");
    }
  };

  // Calculations
  const totalTestsAmount = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const totalBillAmount = totalTestsAmount + Number(collectionCharge);
  const calculatedDue = Math.max(0, totalBillAmount - Number(discountAmount) - Number(receivedAmount));

  // Handle discount updates
  const handleDiscountPercentChange = (val) => {
    const pct = parseFloat(val) || 0;
    setDiscountPercent(pct);
    const amt = parseFloat(((totalTestsAmount * pct) / 100).toFixed(2));
    setDiscountAmount(amt);
  };

  const handleDiscountAmountChange = (val) => {
    const amt = parseFloat(val) || 0;
    setDiscountAmount(amt);
    const pct = totalTestsAmount > 0 ? parseFloat(((amt / totalTestsAmount) * 100).toFixed(2)) : 0;
    setDiscountPercent(pct);
  };

  // Reset form
  const handleReset = () => {
    setMobileNo("");
    setName("");
    setAge("");
    setRefBy(null);
    setSecondRef(null);
    setRemark("");
    setSelectedTests([]);
    setCollectionCharge(0);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setReceivedAmount(0);
    setSampleNo("");
    setPaymentRefNo("");
  };

  // Add selected test
  const handleAddTest = (test) => {
    if (!test) return;
    if (selectedTests.some((t) => t.id === test.id)) {
      showNotification("Test is already added", "warning");
      return;
    }
    const updated = [...selectedTests, test];
    setSelectedTests(updated);

    // Recalculate discount if percentage is set
    const totalAmt = updated.reduce((sum, t) => sum + t.price, 0);
    if (discountPercent > 0) {
      const amt = parseFloat(((totalAmt * discountPercent) / 100).toFixed(2));
      setDiscountAmount(amt);
    }
  };

  // Remove test
  const handleRemoveTest = (id) => {
    const updated = selectedTests.filter((t) => t.id !== id);
    setSelectedTests(updated);

    // Recalculate discount if percentage is set
    const totalAmt = updated.reduce((sum, t) => sum + t.price, 0);
    if (discountPercent > 0) {
      const amt = parseFloat(((totalAmt * discountPercent) / 100).toFixed(2));
      setDiscountAmount(amt);
    }
  };

  // Save Registration
  const handleSave = async () => {
    if (!mobileNo || mobileNo.length < 10) {
      showNotification("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    if (!name) {
      showNotification("Patient name is required", "error");
      return;
    }
    if (!age) {
      showNotification("Patient age is required", "error");
      return;
    }
    if (selectedTests.length === 0) {
      showNotification("At least one test must be selected", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        billOn,
        mobileNo,
        title,
        name,
        city,
        age: parseFloat(age),
        ageUnit,
        gender,
        refById: refBy ? refBy.id : null,
        secondRefById: secondRef ? secondRef.id : null,
        remark,
        colType,
        expRptDate,
        sampleDate,
        sampleNo: sampleNo || null,
        sampleBy,
        paymentMode,
        paymentRefNo: paymentRefNo || null,
        totalAmount: totalTestsAmount,
        collectionCharge: parseFloat(collectionCharge) || 0,
        discountPercent: parseFloat(discountPercent) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        receivedAmount: parseFloat(receivedAmount) || 0,
        dueAmount: calculatedDue,
        stickerCount: parseInt(stickerCount) || 1,
        testIds: selectedTests.map((t) => t.id),
      };

      const res = editId
        ? await fetch(`/admin/api/registrations/${parseInt(editId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((r) => r.json())
        : await fetch("/admin/api/registrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((r) => r.json());

      if (res.success) {
        showNotification(res.message, "success");
        if (editId) {
          setTimeout(() => router.push("/admin/test-report"), 1000);
        } else {
          handleReset();
        }
      } else {
        showNotification(res.message, "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An unexpected error occurred while saving", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Info */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          {editId ? "Edit Patient Registration" : "New Patient Registration"}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {editId ? `Editing Patient ID: ${editId}` : "Autogenerated ID & Reg Number on save"}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Form Panel: Patient Details & Tests */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                Patient Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    label="Bill On"
                    fullWidth
                    size="small"
                    value={billOn}
                    onChange={(e) => setBillOn(e.target.value)}
                  >
                    <MenuItem value="Patient Rate">Patient Rate</MenuItem>
                    <MenuItem value="Camp Rate">Camp Rate</MenuItem>
                    <MenuItem value="Corporate Rate">Corporate Rate</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Mobile No"
                    fullWidth
                    size="small"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    placeholder="Enter 10 digit number"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Lab ID / Reg No"
                    fullWidth
                    size="small"
                    disabled
                    value="Auto Generated"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    select
                    label="Title"
                    fullWidth
                    size="small"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  >
                    <MenuItem value="Mr.">Mr.</MenuItem>
                    <MenuItem value="Mrs.">Mrs.</MenuItem>
                    <MenuItem value="Ms.">Ms.</MenuItem>
                    <MenuItem value="Miss.">Miss.</MenuItem>
                    <MenuItem value="Mast.">Mast.</MenuItem>
                    <MenuItem value="Dr.">Dr.</MenuItem>
                    <MenuItem value="Baby (F)">Baby (F)</MenuItem>
                    <MenuItem value="Baba (M)">Baba (M)</MenuItem>
                    <MenuItem value="Md.">Md.</MenuItem>
                    <MenuItem value="Sister">Sister</MenuItem>
                    <MenuItem value="S/O">S/O</MenuItem>
                    <MenuItem value="D/O">D/O</MenuItem>
                    <MenuItem value="W/O">W/O</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Patient Name"
                    fullWidth
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    label="City"
                    fullWidth
                    size="small"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <MenuItem value="-NA-">-NA-</MenuItem>
                    <MenuItem value="Delhi">Delhi</MenuItem>
                    <MenuItem value="Noida">Noida</MenuItem>
                    <MenuItem value="Gurgaon">Gurgaon</MenuItem>
                    <MenuItem value="Ghaziabad">Ghaziabad</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      label="Age"
                      fullWidth
                      size="small"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                    <TextField
                      select
                      size="small"
                      value={ageUnit}
                      onChange={(e) => setAgeUnit(e.target.value)}
                      sx={{ minWidth: 90 }}
                    >
                      <MenuItem value="Year">Year</MenuItem>
                      <MenuItem value="Month">Month</MenuItem>
                      <MenuItem value="Day">Day</MenuItem>
                    </TextField>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    label="Gender"
                    fullWidth
                    size="small"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={doctors}
                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                    value={refBy}
                    onChange={(event, newValue) => setRefBy(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Ref By Doctor" size="small" placeholder="Select..." />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={doctors}
                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                    value={secondRef}
                    onChange={(event, newValue) => setSecondRef(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="2nd Ref Doctor" size="small" placeholder="Select..." />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Remarks"
                    fullWidth
                    size="small"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Any patient remarks or health details..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Test Addition Section */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                Test Selection
              </Typography>
              <Autocomplete
                options={tests}
                getOptionLabel={(option) => `${option.name} (${option.code}) - ₹${option.price}`}
                inputValue={testSearchInput}
                onInputChange={(event, newInputValue) => setTestSearchInput(newInputValue)}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleAddTest(newValue);
                    setTestSearchInput(""); // reset input
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Search & Add Test" size="small" placeholder="Select to add..." />
                )}
                sx={{ mb: 3 }}
              />

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>SNO</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Test Code</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Test Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Price (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          No tests selected. Use search bar above to add tests.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedTests.map((t, idx) => (
                        <TableRow key={t.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{t.code}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                          <TableCell align="right">₹{t.price.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <IconButton color="error" size="small" onClick={() => handleRemoveTest(t.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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

        {/* Right Form Panel: Billing & Collection Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                Collection & Billing
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    label="Collection Type"
                    fullWidth
                    size="small"
                    value={colType}
                    onChange={(e) => setColType(e.target.value)}
                  >
                    <MenuItem value="Camp">Camp</MenuItem>
                    <MenuItem value="Lab">Lab</MenuItem>
                    <MenuItem value="Home Collection">Home Collection</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Expected Report Date"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={expRptDate}
                    onChange={(e) => setExpRptDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Sample Date"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={sampleDate}
                    onChange={(e) => setSampleDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Sample No"
                    fullWidth
                    size="small"
                    value={sampleNo}
                    onChange={(e) => setSampleNo(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    label="Sample By"
                    fullWidth
                    size="small"
                    value={sampleBy}
                    onChange={(e) => setSampleBy(e.target.value)}
                  >
                    <MenuItem value="-NA-">-NA-</MenuItem>
                    <MenuItem value="Self">Self</MenuItem>
                    <MenuItem value="Lab Tech 1">Lab Tech 1</MenuItem>
                    <MenuItem value="Lab Tech 2">Lab Tech 2</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    select
                    label="Payment Mode"
                    fullWidth
                    size="small"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Net Banking">Net Banking</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Payment Ref.No"
                    fullWidth
                    size="small"
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                    placeholder="Txn ID"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Total Tests Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={totalTestsAmount}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Collection Charge"
                    fullWidth
                    size="small"
                    type="number"
                    value={collectionCharge}
                    onChange={(e) => setCollectionCharge(Number(e.target.value) || 0)}
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Discount %"
                    fullWidth
                    size="small"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Discount ₹"
                    fullWidth
                    size="small"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => handleDiscountAmountChange(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Net Bill Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={totalBillAmount - discountAmount}
                    disabled
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Received Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(Number(e.target.value) || 0)}
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Due Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={calculatedDue}
                    disabled
                    InputProps={{
                      style: {
                        color: calculatedDue > 0 ? "#dc2626" : "#16a34a",
                        fontWeight: 700
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Sticker Count"
                    fullWidth
                    size="small"
                    type="number"
                    value={stickerCount}
                    onChange={(e) => setStickerCount(Number(e.target.value) || 1)}
                  />
                </Grid>
              </Grid>
            </CardContent>

            <Divider />

            {/* Save / Reset Footer */}
            <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={submitting}
                onClick={handleSave}
              >
                Save (F10)
              </Button>
              <Box sx={{ display: "flex", width: "100%", gap: 1 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={handleReset}
                >
                  Clear Form
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
