"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    TextField, Button, Paper, Grid, Typography, useTheme,
    useMediaQuery, IconButton, Box, Card, CardMedia, Divider,
    Switch, FormControlLabel,
    CircularProgress, Alert,
    MenuItem, // Added
    FormControl, // Added
    InputLabel, // Added
    Select // Added
} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = "https://otmt.iiitd.edu.in/api";
const MAX_IMAGES = 5;
const MAX_BROCHURES = 5;

const PATENT_STATUSES = ["Not Filed", "Application Filed", "Under Examination", "Granted", "Abandoned/Lapsed"];

const getUserInfoFromStorage = () => {
    const userString = localStorage.getItem("user");
    if (userString) {
        try {
            return JSON.parse(userString);
        } catch (e) {
            console.error("Failed to parse user info from localStorage", e);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            return null;
        }
    }
    return null;
};

const getTokenFromStorage = () => localStorage.getItem("token");

const addTechnologyAPI = async (newData) => {
    const token = getTokenFromStorage();
    if (!token) {
        throw new Error("Authentication token not found. Please log in.");
    }

    const currentUserInfo = getUserInfoFromStorage();
    if (!(currentUserInfo?.addTech || currentUserInfo?.role === 'superAdmin')) {
        throw new Error("Permission Denied: You are not authorized to add technologies.");
    }

    const formData = new FormData();
    Object.entries(newData).forEach(([key, value]) => {
        if (key === 'imagesData' || key === 'brochureFilesData') return;
        if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
        } else if (key === 'spotlight') {
            formData.append(key, String(value));
        } else if (value !== null && value !== undefined && value !== "") { // Ensure empty strings are not appended unless intended
            formData.append(key, value);
        } else if (key === 'patent' && value === "Not Filed") { // Ensure "Not Filed" is sent
             formData.append(key, value);
        }
    });

    let imageFileIndex = 0;
    if (newData.imagesData && newData.imagesData.length > 0) {
        newData.imagesData.forEach((imageObj) => {
            if (imageObj.file) {
                formData.append('images', imageObj.file);
                formData.append(`imageCaptions[${imageFileIndex}]`, imageObj.caption || "");
                imageFileIndex++;
            }
        });
    }

    if (newData.brochureFilesData && newData.brochureFilesData.length > 0) {
        newData.brochureFilesData.forEach((brochureObj) => {
            if (brochureObj.file) {
                formData.append('brochureFiles', brochureObj.file, brochureObj.file.name);
            }
        });
    }
    
    const response = await fetch(`${API_BASE_URL}/technologies`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        console.error("Failed to add technology. Status:", response.status, "Body:", errorBody);
        throw new Error(errorBody.message || `Failed to add technology. Status: ${response.status}`);
    }
    return await response.json();
};

const AddTechnology = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const fileInputRef = useRef(null);
    const brochureFileInputRef = useRef(null);

    const [userInfo, setUserInfo] = useState(() => getUserInfoFromStorage());
    const [isPageAccessible, setIsPageAccessible] = useState(false);
    const [loadingPage, setLoadingPage] = useState(true);
    const [pageError, setPageError] = useState(null);

    const [addData, setAddData] = useState({
        name: "", description: "", overview: "", detailedDescription: "", genre: "",
        innovators: [{ name: "", mail: "" }], advantages: [""], applications: [""], useCases: [""],
        relatedLinks: [{ title: "", url: "" }], technicalSpecifications: "", trl: "",
        imagesData: [],
        spotlight: false,
        brochureFilesData: [],
        // --- Updated Patent Fields ---
        patentStatus: "Not Filed", // Default patent status
        patentId: "",
        patentApplicationNumber: "",
        patentFilingDate: "",
        patentGrantDate: "",
        patentDocumentUrl: "",
        // ------------------------
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canUserAddTech = useMemo(() => {
        return userInfo?.addTech || userInfo?.role === 'superAdmin';
    }, [userInfo]);

    useEffect(() => {
        const currentUserInfo = getUserInfoFromStorage();
        const token = getTokenFromStorage();

        if (currentUserInfo && token) {
            setUserInfo(currentUserInfo);
            if (currentUserInfo.addTech || currentUserInfo.role === 'superAdmin') {
                setIsPageAccessible(true);
            } else {
                setPageError("Access Denied: You do not have permission to add technologies.");
                toast.error("Access Denied: Insufficient permissions.", { position: "top-center" });
                setIsPageAccessible(false);
                setTimeout(() => navigate('/admin-dashboard'), 3000);
            }
        } else {
            toast.error("Authentication required. Redirecting to login.", { position: "top-center", autoClose: 2000 });
            setPageError("Authentication required.");
            setIsPageAccessible(false);
            setTimeout(() => navigate('/login'), 2100);
        }
        setLoadingPage(false);
    }, [navigate]);

    const handleGenericChange = (e) => {
        const { name, value } = e.target;
        setAddData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSpotlightSwitchChange = (e) => {
        setAddData((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
    };

    const handlePatentStatusChange = (e) => {
        const newStatus = e.target.value;
        setAddData((prev) => {
            const newState = { ...prev, patentStatus: newStatus };

            // Clear fields based on the new status
            if (newStatus === "Not Filed") {
                newState.patentId = "";
                newState.patentApplicationNumber = "";
                newState.patentFilingDate = "";
                newState.patentGrantDate = "";
                newState.patentDocumentUrl = "";
            } else if (newStatus === "Application Filed" || newStatus === "Under Examination") {
                newState.patentId = ""; // Not applicable yet
                newState.patentGrantDate = ""; // Not applicable yet
            }
            // For "Granted" and "Abandoned/Lapsed", all fields can be potentially filled.
            // User will input them as needed.
            return newState;
        });
    };

    const handleAddInnovator = () => setAddData(prev => ({ ...prev, innovators: [...prev.innovators, { name: "", mail: "" }] }));
    const handleRemoveInnovator = (index) => setAddData(prev => ({ ...prev, innovators: prev.innovators.filter((_, i) => i !== index) }));
    const handleInnovatorChange = (index, field, value) => {
        setAddData(prev => ({ ...prev, innovators: prev.innovators.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
    };

    const handleAddStringToArray = (fieldName) => {
        setAddData(prev => ({ ...prev, [fieldName]: [...(prev[fieldName] || []), ""] }));
    };
    const handleStringInArrayChange = (fieldName, index, value) => {
        setAddData(prev => {
            const newArray = [...(prev[fieldName] || [])];
            newArray[index] = value;
            return { ...prev, [fieldName]: newArray };
        });
    };
    const handleRemoveStringFromArray = (fieldName, index) => {
        setAddData(prev => ({ ...prev, [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index) }));
    };

    const handleAddRelatedLink = () => setAddData(prev => ({ ...prev, relatedLinks: [...(prev.relatedLinks || []), { title: "", url: "" }] }));
    const handleRemoveRelatedLink = (index) => setAddData(prev => ({ ...prev, relatedLinks: (prev.relatedLinks || []).filter((_, i) => i !== index) }));
    const handleRelatedLinkChange = (index, field, value) => {
        setAddData(prev => ({ ...prev, relatedLinks: (prev.relatedLinks || []).map((item, i) => i === index ? { ...item, [field]: value } : item) }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const currentImageCount = addData.imagesData.length;
        const remainingSlots = MAX_IMAGES - currentImageCount;

        if (files.length > remainingSlots) {
            toast.warn(`You can only add ${remainingSlots > 0 ? remainingSlots : 0} more image(s). Max ${MAX_IMAGES} images allowed.`);
        }

        const newImageObjects = files.slice(0, remainingSlots).map(file => ({
            file,
            preview: URL.createObjectURL(file),
            caption: ""
        }));

        setAddData(prev => ({ ...prev, imagesData: [...prev.imagesData, ...newImageObjects] }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImageDelete = (index) => {
        setAddData(prev => {
            const imageToDelete = prev.imagesData[index];
            if (imageToDelete?.preview) URL.revokeObjectURL(imageToDelete.preview);
            return { ...prev, imagesData: prev.imagesData.filter((_, i) => i !== index) };
        });
    };

    const handleImageCaptionChange = (index, caption) => {
        setAddData(prev => ({ ...prev, imagesData: prev.imagesData.map((img, i) => i === index ? { ...img, caption } : img) }));
    };

    const handleBrochureFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const currentBrochureCount = addData.brochureFilesData.length;
        const remainingSlots = MAX_BROCHURES - currentBrochureCount;

        if (files.length === 0) return;

        if (files.length > remainingSlots) {
            toast.warn(`You can only add ${remainingSlots > 0 ? remainingSlots : 0} more document(s). Max ${MAX_BROCHURES} brochures allowed.`);
        }

        const newBrochureObjects = files.slice(0, remainingSlots).map(file => {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.oasis.opendocument.text'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const commonDocExtensions = ['pdf', 'doc', 'docx', 'txt', 'odt'];

            if ((!allowedTypes.includes(file.type) && !commonDocExtensions.includes(fileExtension))) {
                toast.error(`File "${file.name}" has an invalid type. Allowed: PDF, DOC, DOCX, TXT, ODT.`);
                return null;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error(`File "${file.name}" size exceeds 10MB limit.`);
                return null;
            }
            return { file: file, name: file.name };
        }).filter(Boolean);

        if (newBrochureObjects.length > 0) {
            setAddData(prev => ({ ...prev, brochureFilesData: [...prev.brochureFilesData, ...newBrochureObjects] }));
        }

        if (brochureFileInputRef.current) {
            brochureFileInputRef.current.value = "";
        }
    };

    const handleRemoveBrochureFileByIndex = (indexToRemove) => {
        setAddData(prev => ({
            ...prev,
            brochureFilesData: prev.brochureFilesData.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canUserAddTech) {
            toast.error("Permission Denied. You cannot add technologies.");
            return;
        }
        setIsSubmitting(true);

        const processedData = { ...addData };
        Object.keys(processedData).forEach(key => {
            if (typeof processedData[key] === 'string') processedData[key] = processedData[key].trim();
        });

        // Patent field is now addData.patentStatus, which is directly used.
        // It's named 'patent' in the schema.
        processedData.patent = processedData.patentStatus;
        delete processedData.patentStatus; // remove the temporary state key

        // Clean up patent fields based on the final patent status
        if (processedData.patent === "Not Filed") {
            processedData.patentId = "";
            processedData.patentApplicationNumber = "";
            processedData.patentFilingDate = "";
            processedData.patentGrantDate = "";
            processedData.patentDocumentUrl = "";
        } else if (processedData.patent === "Application Filed" || processedData.patent === "Under Examination") {
            processedData.patentId = "";
            processedData.patentGrantDate = "";
        }
        // For "Granted" and "Abandoned/Lapsed", all fields are potentially valid and should be sent if filled.

        if (!processedData.name || !processedData.genre || !String(processedData.trl).trim() || !processedData.patent) {
            toast.error("Please fill in all required fields: Name, Genre, TRL Level, and Patent Status.");
            setIsSubmitting(false);
            return;
        }
        const trlNum = Number(processedData.trl);
        if (isNaN(trlNum) || trlNum < 1 || trlNum > 9) {
            toast.error("TRL Level must be a valid number between 1 and 9.");
            setIsSubmitting(false);
            return;
        }
        processedData.trl = trlNum;

        processedData.innovators = (processedData.innovators || []).filter(inv => inv.name.trim() || inv.mail.trim());
        processedData.advantages = (processedData.advantages || []).map(adv => adv.trim()).filter(Boolean);
        processedData.applications = (processedData.applications || []).map(app => app.trim()).filter(Boolean);
        processedData.useCases = (processedData.useCases || []).map(uc => uc.trim()).filter(Boolean);
        processedData.relatedLinks = (processedData.relatedLinks || []).filter(link => link.title.trim() && link.url.trim());

        try {
            await addTechnologyAPI(processedData);
            toast.success("Technology added successfully!");
            navigate("/admin-dashboard");
        } catch (error) {
            console.error("Error adding technology:", error);
            toast.error(`Error adding technology: ${error.message}`);
            if (error.message.includes("Access Denied") || error.message.includes("token not found")) {
                setTimeout(() => navigate('/login'), 2100);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingPage) {
        return ( <Layout title="Loading..."><ToastContainer position="top-center" autoClose={3000} /><Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 200px)', p: 3 }}><CircularProgress /><Typography sx={{ ml: 2 }}>Verifying Access...</Typography></Box></Layout> );
    }

    if (!isPageAccessible) {
        return ( <Layout title="Access Denied"><ToastContainer position="top-center" autoClose={3000} /><Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center', margin: "20px auto", maxWidth: '600px' }}><Alert severity="error" sx={{ mb: 3 }}>{pageError || "You do not have permission to access this page."}</Alert><Button variant="outlined" onClick={() => navigate(pageError && (pageError.includes("login") || pageError.includes("Authentication")) ? '/login' : '/admin-dashboard')} sx={{ mr: 1 }}>{pageError && (pageError.includes("login") || pageError.includes("Authentication")) ? 'Go to Login' : 'Back to Dashboard'}</Button></Paper></Layout> );
    }
    
    return (
        <Layout title="Add New Technology">
            <ToastContainer position="top-center" autoClose={3000} />
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: "12px", maxWidth: 'lg', margin: '20px auto', }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
                    Add New Technology
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Fields marked with * are required.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>

                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500 }}>Basic Information</Typography>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12}><TextField label="Name *" name="name" fullWidth value={addData.name} onChange={handleGenericChange} required disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12} sm={6}><TextField label="TRL Level *" name="trl" type="number" fullWidth value={addData.trl} onChange={handleGenericChange} required helperText="Technology Readiness Level (1-9)" disabled={isSubmitting} inputProps={{ min: 1, max: 9 }} /></Grid>
                                    <Grid item xs={12} sm={6}><TextField label="Genre *" name="genre" fullWidth value={addData.genre} onChange={handleGenericChange} required disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12}><TextField label="Brief Description" name="description" fullWidth multiline rows={3} value={addData.description} onChange={handleGenericChange} disabled={isSubmitting} /></Grid>
                                    
                                    {/* --- Modified Patent Section --- */}
                                    <Grid item xs={12}>
                                        <FormControl fullWidth variant="outlined" disabled={isSubmitting} required>
                                            <InputLabel id="patent-status-label">Patent Status *</InputLabel>
                                            <Select
                                                labelId="patent-status-label"
                                                id="patentStatus"
                                                name="patentStatus" // Keep name for potential generic handlers, though specific one is used
                                                value={addData.patentStatus}
                                                onChange={handlePatentStatusChange}
                                                label="Patent Status *"
                                            >
                                                {PATENT_STATUSES.map((status) => (
                                                    <MenuItem key={status} value={status}>
                                                        {status}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {addData.patentStatus !== "Not Filed" && (
                                        <>
                                            {/* Common fields for all statuses except "Not Filed" */}
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Patent Application Number"
                                                    name="patentApplicationNumber"
                                                    fullWidth
                                                    value={addData.patentApplicationNumber}
                                                    onChange={handleGenericChange}
                                                    disabled={isSubmitting}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Patent Filing Date"
                                                    name="patentFilingDate"
                                                    type="date"
                                                    fullWidth
                                                    value={addData.patentFilingDate}
                                                    onChange={handleGenericChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    disabled={isSubmitting}
                                                />
                                            </Grid>

                                            {/* Fields specific to "Granted" or "Abandoned/Lapsed" */}
                                            {(addData.patentStatus === "Granted" || addData.patentStatus === "Abandoned/Lapsed") && (
                                                <>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            label="Patent ID"
                                                            name="patentId"
                                                            fullWidth
                                                            value={addData.patentId}
                                                            onChange={handleGenericChange}
                                                            disabled={isSubmitting}
                                                            helperText={addData.patentStatus === "Granted" ? "Required if granted" : "If known"}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            label="Patent Grant Date"
                                                            name="patentGrantDate"
                                                            type="date"
                                                            fullWidth
                                                            value={addData.patentGrantDate}
                                                            onChange={handleGenericChange}
                                                            InputLabelProps={{ shrink: true }}
                                                            disabled={isSubmitting}
                                                            helperText={addData.patentStatus === "Granted" ? "Required if granted" : "If known"}
                                                        />
                                                    </Grid>
                                                </>
                                            )}
                                            
                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Patent Document URL (Optional)"
                                                    name="patentDocumentUrl"
                                                    type="url"
                                                    fullWidth
                                                    value={addData.patentDocumentUrl}
                                                    onChange={handleGenericChange}
                                                    disabled={isSubmitting}
                                                />
                                            </Grid>
                                        </>
                                    )}
                                    {/* ------------------------------ */}
                                    
                                    <Grid item xs={12} sm={addData.patentStatus !== "Not Filed" ? 12 : 6} sx={{ display: 'flex', alignItems: 'center', mt: addData.patentStatus !== "Not Filed" ? 2 : 0 }}>
                                        <FormControlLabel control={<Switch checked={addData.spotlight} onChange={handleSpotlightSwitchChange} name="spotlight" disabled={isSubmitting} />} label="Spotlight Technology?" />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 1 }} /></Grid>
                        
                        {/* Brochure Section */}
                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{mb:1.5, fontWeight:500}}>Brochures (Max {MAX_BROCHURES}, Optional)</Typography>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.odt"
                                    style={{ display: 'none' }}
                                    id="brochure-upload-input"
                                    onChange={handleBrochureFilesChange}
                                    ref={brochureFileInputRef}
                                    multiple 
                                    disabled={isSubmitting || addData.brochureFilesData.length >= MAX_BROCHURES}
                                />
                                <label htmlFor="brochure-upload-input">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<UploadFileIcon />}
                                        sx={{ mb: 2, textTransform:'none' }}
                                        disabled={isSubmitting || addData.brochureFilesData.length >= MAX_BROCHURES}
                                    >
                                        Select Brochures
                                    </Button>
                                </label>
                                {addData.brochureFilesData.length > 0 && (
                                    <Box sx={{mt: 1}}>
                                        {addData.brochureFilesData.map((brochureObj, index) => (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, p:1, border: `1px solid ${theme.palette.divider}`, borderRadius:1, wordBreak: 'break-all' }}>
                                                <Typography variant="body2" sx={{ml: 1, flexGrow: 1}}>
                                                    {brochureObj.name}
                                                </Typography>
                                                <IconButton onClick={() => handleRemoveBrochureFileByIndex(index)} size="small" color="error" disabled={isSubmitting} sx={{ml:1}}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 1 }} /></Grid>

                        {/* Innovators Section */}
                        <Grid item xs={12}>
                                <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500 }}>Innovators</Typography>
                                {(addData.innovators || []).map((innovator, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label={`Innovator ${index + 1} Name`} value={innovator.name} onChange={(e) => handleInnovatorChange(index, 'name', e.target.value)} variant="outlined" size="small" disabled={isSubmitting} /></Grid>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label="Email (Optional)" type="email" value={innovator.mail} onChange={(e) => handleInnovatorChange(index, 'mail', e.target.value)} variant="outlined" size="small" disabled={isSubmitting} /></Grid>
                                        <Grid item xs={12} sm={2} sx={{ textAlign: isMobile ? 'right' : 'center' }}>
                                            {(addData.innovators || []).length > 1 && <IconButton onClick={() => handleRemoveInnovator(index)} color="error" aria-label="Remove Innovator" disabled={isSubmitting}><DeleteIcon /></IconButton>}
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button variant="outlined" onClick={handleAddInnovator} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }} disabled={isSubmitting}>Add Innovator</Button>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12}><Divider light sx={{ my: 1 }} /></Grid>

                        {/* Technology Details Section */}
                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500 }}>Technology Details</Typography>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12}><TextField label="Overview" name="overview" fullWidth multiline rows={3} value={addData.overview} onChange={handleGenericChange} disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12}><TextField label="Detailed Description" name="detailedDescription" fullWidth multiline rows={5} value={addData.detailedDescription} onChange={handleGenericChange} disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12}><TextField label="Technical Specifications (Optional)" name="technicalSpecifications" fullWidth multiline rows={3} value={addData.technicalSpecifications} onChange={handleGenericChange} disabled={isSubmitting} /></Grid>
                                </Grid>
                            </Box>
                        </Grid>
                        
                        {/* Advantages, Applications, Use Cases Sections */}
                        {['advantages', 'applications', 'useCases'].map(fieldName => (
                            <Grid item xs={12} key={fieldName}>
                                <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500, textTransform: 'capitalize' }}>{fieldName.replace(/([A-Z])/g, ' $1')}</Typography>
                                    {(addData[fieldName] || []).map((value, index) => (
                                        <Grid container spacing={1} key={index} sx={{ mb: 1.5, alignItems: 'center' }}>
                                            <Grid item xs><TextField fullWidth label={`${fieldName.slice(0, -1)} ${index + 1}`} value={value} onChange={(e) => handleStringInArrayChange(fieldName, index, e.target.value)} variant="outlined" size="small" disabled={isSubmitting}/></Grid>
                                            <Grid item xs="auto">
                                                {((addData[fieldName] || []).length > 1 || value) && <IconButton onClick={() => handleRemoveStringFromArray(fieldName, index)} color="error" aria-label={`Remove ${fieldName.slice(0,-1)}`} disabled={isSubmitting}><DeleteIcon /></IconButton>}
                                            </Grid>
                                        </Grid>
                                    ))}
                                    <Button variant="outlined" onClick={() => handleAddStringToArray(fieldName)} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }} disabled={isSubmitting}>Add {fieldName.slice(0, -1)}</Button>
                                </Box>
                            </Grid>
                        ))}

                        {/* Related Links Section */}
                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500 }}>Related Links (Optional)</Typography>
                                {(addData.relatedLinks || []).map((link, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label={`Link Title ${index + 1}`} value={link.title} onChange={(e) => handleRelatedLinkChange(index, 'title', e.target.value)} variant="outlined" size="small" disabled={isSubmitting} /></Grid>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label="URL" type="url" value={link.url} onChange={(e) => handleRelatedLinkChange(index, 'url', e.target.value)} variant="outlined" size="small" disabled={isSubmitting} /></Grid>
                                        <Grid item xs={12} sm={2} sx={{ textAlign: isMobile ? 'right' : 'center' }}>
                                           {((addData.relatedLinks || []).length > 1 || link.title || link.url) && <IconButton onClick={() => handleRemoveRelatedLink(index)} color="error" aria-label="Remove Link" disabled={isSubmitting}><DeleteIcon /></IconButton>}
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button variant="outlined" onClick={handleAddRelatedLink} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }} disabled={isSubmitting}>Add Link</Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 1 }} /></Grid>

                        {/* Images Section */}
                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{mb:1.5, fontWeight:500}}>Images (Max {MAX_IMAGES}, Optional)</Typography>
                                <input type="file" multiple accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} id="image-upload-input" />
                                <label htmlFor="image-upload-input">
                                    <Button variant="outlined" component="span" startIcon={<AddPhotoAlternateIcon />} sx={{ mb: 2, textTransform:'none' }} disabled={isSubmitting || addData.imagesData.length >= MAX_IMAGES} > Select Images </Button>
                                </label>
                                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                    {addData.imagesData.map((image, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: theme.shadows[1] }}>
                                                <CardMedia component="img" height="160" image={image.preview} alt={`Preview ${index + 1}`} sx={{ objectFit: 'contain', p:1 }} />
                                                <IconButton aria-label="Delete image" sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.4)', color: 'white', p:0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }} onClick={() => handleImageDelete(index)} disabled={isSubmitting} > <DeleteIcon fontSize="small" /> </IconButton>
                                                <Box sx={{ p: 1.5, mt: 'auto' }}> <TextField fullWidth size="small" variant="outlined" placeholder="Image Caption (optional)" value={image.caption} onChange={(e) => handleImageCaptionChange(index, e.target.value)} disabled={isSubmitting} /> </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sx={{ textAlign: "center", mt: 3 }}>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}
                                sx={{
                                    borderRadius: "8px", py: 1.25, px: 5, fontWeight: 'bold',
                                    boxShadow: theme.shadows[2], bgcolor: 'primary.dark', color: "white",
                                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                    '&:hover': { boxShadow: theme.shadows[4], transform: "translateY(-2px)", bgcolor: 'primary.main' },
                                    '&:disabled': { background: theme.palette.action.disabledBackground, color: theme.palette.action.disabled }
                                }}
                            >
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Submit Technology"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Layout>
    );
};

export default AddTechnology;
