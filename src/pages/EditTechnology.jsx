"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    TextField, Button, Paper, Grid, Typography, CircularProgress,
    useTheme, useMediaQuery, Box, IconButton, Divider, Radio,
    RadioGroup, FormControlLabel, FormControl, FormLabel, Alert, Switch, Tooltip,
    Select, // Added
    MenuItem, // Added
    InputLabel // Added
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";

const API_BASE_URL = "https://api.otmt.iiitd.edu.in/api";
const MAX_IMAGES = 5;
const MAX_BROCHURES = 5;

// Define patent statuses consistent with schema and AddTechnology component
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

const getTechnologyById = async (id) => {
    const token = getTokenFromStorage();
    if (!token) throw new Error("Authentication token not found. Please log in.");
    const response = await fetch(`${API_BASE_URL}/technologies/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) {
        let errorMsg = "Failed to fetch technology details";
        const result = await response.json().catch(() => ({}));
        errorMsg = result.message || errorMsg;

        if (response.status === 404) errorMsg = "Technology not found.";
        else if (response.status === 401 || response.status === 403) {
            errorMsg = result.message || "Access Denied fetching technology. Session may have expired.";
        } else {
            errorMsg = `HTTP error! status: ${response.status}, Message: ${result.message || response.statusText}`;
        }
        throw new Error(errorMsg);
    }
    return await response.json();
};

const updateTechnologyAPI = async (id, updatedData, newBrochureFilesArray = []) => {
    const token = getTokenFromStorage();
    if (!token) throw new Error("Authentication token not found. Please log in.");

    const currentUserInfo = getUserInfoFromStorage();
    if (!(currentUserInfo?.editTech || currentUserInfo?.role === 'superAdmin')) {
        throw new Error("Permission denied. You are not authorized to update technologies.");
    }

    const formData = new FormData();
    Object.entries(updatedData).forEach(([key, value]) => {
        // Exclude fields not meant for direct update or handled separately
        if (key === "images" || key === "newImageData" || key === "brochures" || key === "_id" || key === "__v" || key === "docket" || key === "id") return;
        
        if (Array.isArray(value) && key !== 'brochures') { // brochures are handled via existingBrochures and newBrochureFiles
            formData.append(key, JSON.stringify(value));
        } else if (key === 'spotlight') { 
            formData.append(key, String(value));
        } else if (value !== null && value !== undefined && key !== 'brochures' && value !== "") { // Append if value has content
            formData.append(key, value);
        } else if (key === 'patent' && value === PATENT_STATUSES[0]) { // Ensure "Not Filed" is sent if it's the status
            formData.append(key, value);
       }
    });

    const validExistingImages = (updatedData.images || []).filter(img => img && img.url).map(img => ({ url: img.url, caption: img.caption || "" }));
    formData.append("existingImages", JSON.stringify(validExistingImages));

    let imageFileIndex = 0;
    if (updatedData.newImageData && updatedData.newImageData.length > 0) {
        updatedData.newImageData.forEach((imgData) => {
            if (imgData.file) {
                formData.append("images", imgData.file); // Backend handles this as new image files
                formData.append(`imageCaptions[${imageFileIndex}]`, imgData.caption || "");
                imageFileIndex++;
            }
        });
    }

    formData.append("existingBrochures", JSON.stringify(updatedData.brochures || []));

    if (newBrochureFilesArray && newBrochureFilesArray.length > 0) {
        newBrochureFilesArray.forEach((brochureObj) => {
            if (brochureObj.file) {
                formData.append('brochureFiles', brochureObj.file, brochureObj.file.name);
            }
        });
    }
    
    const response = await fetch(`${API_BASE_URL}/technologies/${id}`, { method: "PUT", headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if (!response.ok) {
        let errorMsg = `Failed to update technology: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
            if (response.status === 401 || response.status === 403) { errorMsg = errorData.message || "Access Denied or Session Expired."; }
            else if (response.status === 409) errorMsg = errorData.message || "Update conflict (e.g., Docket ID already exists).";
        } catch (e) { console.error("Could not parse error response as JSON for update:", await response.text().catch(() => "")); }
        console.error("Server error during updateTechnologyAPI:", errorMsg);
        throw new Error(errorMsg);
    }
    return await response.json();
};


const EditTechnology = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const brochureFileInputRef = useRef(null);

    const [userInfo, setUserInfo] = useState(() => getUserInfoFromStorage());
    const [isPageAccessible, setIsPageAccessible] = useState(false);

    const [techData, setTechData] = useState({
        name: "", description: "", overview: "", detailedDescription: "", genre: "", docket: "",
        innovators: [{ name: "", mail: "" }], advantages: [""], applications: [""], useCases: [""],
        relatedLinks: [{ title: "", url: "" }], technicalSpecifications: "", trl: "",
        images: [], // For existing images
        spotlight: "false", 
        brochures: [], // For existing brochures
        // --- Updated Patent Fields ---
        patent: PATENT_STATUSES[0], // Direct patent status string from PATENT_STATUSES
        patentId: "",
        patentApplicationNumber: "",
        patentFilingDate: "", 
        patentGrantDate: "",
        patentDocumentUrl: "",
        // ------------------------------------
    });
    const [newImages, setNewImages] = useState([]); // For new images to upload
    const [newBrochureFilesData, setNewBrochureFilesData] = useState([]); // For new brochures to upload

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState(null);

    const canUserEdit = useMemo(() => {
        return userInfo?.editTech || userInfo?.role === 'superAdmin';
    }, [userInfo]);

    const fetchTechDetails = useCallback(async () => {
        if (!id) {
            setPageError("Technology ID not found."); setLoading(false); setIsPageAccessible(false); return;
        }
        if (!canUserEdit && userInfo) { // Check canUserEdit only after userInfo is confirmed
            setPageError("Access Denied: You do not have permission to edit technologies.");
            toast.error("Access Denied: Insufficient permissions.", { position: "top-center" });
            setLoading(false); setIsPageAccessible(false);
            setTimeout(() => navigate('/admin-dashboard'), 3000); return;
        }

        setLoading(true); setPageError(null);
        try {
            const data = await getTechnologyById(id);
            setTechData({
                name: data.name || "", description: data.description || "",
                overview: data.overview || "", detailedDescription: data.detailedDescription || "",
                genre: data.genre || "",
                docket: data.docket || "", // Keep docket populated
                innovators: Array.isArray(data.innovators) && data.innovators.length > 0 ? data.innovators : [{ name: "", mail: "" }],
                advantages: Array.isArray(data.advantages) && data.advantages.length > 0 ? data.advantages : [""],
                applications: Array.isArray(data.applications) && data.applications.length > 0 ? data.applications : [""],
                useCases: Array.isArray(data.useCases) && data.useCases.length > 0 ? data.useCases : [""],
                relatedLinks: Array.isArray(data.relatedLinks) && data.relatedLinks.length > 0 ? data.relatedLinks : [{ title: "", url: "" }],
                technicalSpecifications: data.technicalSpecifications || "",
                trl: data.trl ? String(data.trl) : "",
                images: Array.isArray(data.images) ? data.images.filter(img => img?.url) : [],
                brochures: Array.isArray(data.brochures) ? data.brochures.filter(b => b?.url && b?.originalName) : [],
                spotlight: data.spotlight ? String(data.spotlight) : "false",

                // --- Populate Patent Fields with new structure ---
                patent: PATENT_STATUSES.includes(data.patent) ? data.patent : PATENT_STATUSES[0], // Validate fetched status
                patentId: data.patentId || "",
                patentApplicationNumber: data.patentApplicationNumber || "",
                patentFilingDate: data.patentFilingDate ? new Date(data.patentFilingDate).toISOString().split('T')[0] : "",
                patentGrantDate: data.patentGrantDate ? new Date(data.patentGrantDate).toISOString().split('T')[0] : "",
                patentDocumentUrl: data.patentDocumentUrl || "",
                // ---------------------------------------------
            });
            setIsPageAccessible(true);
            setNewImages([]); // Clear any pending new images from previous attempts
            setNewBrochureFilesData([]); // Clear new brochures
        } catch (err) {
            console.error("Error fetching technology for edit:", err);
            setPageError(`Failed to load technology: ${err.message}`);
            toast.error(`Failed to load data: ${err.message}`, { position: "top-center" });
            setIsPageAccessible(false);
            if (err.message.includes("Access Denied") || err.message.includes("token not found") || err.message.includes("Session may have expired")) {
                setTimeout(() => navigate('/login'), 2100);
            }
        } finally { setLoading(false); }
    }, [id, navigate, canUserEdit, userInfo]); // Added userInfo to dependency array for canUserEdit check

    useEffect(() => {
        const currentUserInfo = getUserInfoFromStorage();
        const token = getTokenFromStorage();
        if (currentUserInfo && token) { setUserInfo(currentUserInfo); }
        else {
            toast.error("Authentication required. Redirecting to login.", { position: "top-center", autoClose: 2000 });
            setTimeout(() => navigate('/login'), 2100); setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { if (userInfo && id) { fetchTechDetails(); } }, [userInfo, id, fetchTechDetails]);

    useEffect(() => { return () => { newImages.forEach(img => { if (img.previewUrl) URL.revokeObjectURL(img.previewUrl); }); }; }, [newImages]);

    const handleGenericChange = useCallback((e) => { const { name, value } = e.target; setTechData(prev => ({ ...prev, [name]: value })); }, []);

    // New handler for patent status dropdown
    const handlePatentStatusChange = useCallback((event) => {
        const newStatus = event.target.value;
        setTechData(prev => {
            const newState = { ...prev, patent: newStatus };
            // Clear fields based on the new status
            if (newStatus === PATENT_STATUSES[0]) { // "Not Filed"
                newState.patentId = "";
                newState.patentApplicationNumber = "";
                newState.patentFilingDate = "";
                newState.patentGrantDate = "";
                newState.patentDocumentUrl = "";
            } else if (newStatus === PATENT_STATUSES[1] || newStatus === PATENT_STATUSES[2]) { // "Application Filed" or "Under Examination"
                newState.patentId = ""; 
                newState.patentGrantDate = "";
            }
            // For "Granted" and "Abandoned/Lapsed", allow fields to be filled or remain.
            return newState;
        });
    }, []);


    const handleAddInnovator = useCallback(() => setTechData(prev => ({ ...prev, innovators: [...prev.innovators, { name: "", mail: "" }] })), []);
    const handleInnovatorChange = useCallback((index, field, value) => setTechData(prev => ({ ...prev, innovators: prev.innovators.map((item, i) => i === index ? { ...item, [field]: value } : item) })), []);
    const handleRemoveInnovator = useCallback((index) => setTechData(prev => ({ ...prev, innovators: prev.innovators.filter((_, i) => i !== index) })), []);
    const handleAddStringToArray = useCallback((fieldName) => setTechData(prev => ({ ...prev, [fieldName]: [...(prev[fieldName] || []), ""] })), []);
    const handleStringInArrayChange = useCallback((fieldName, index, value) => setTechData(prev => { const arr = [...(prev[fieldName] || [])]; arr[index] = value; return { ...prev, [fieldName]: arr }; }), []);
    const handleRemoveStringFromArray = useCallback((fieldName, index) => setTechData(prev => ({ ...prev, [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index) })), []);
    const handleAddRelatedLink = useCallback(() => setTechData(prev => ({ ...prev, relatedLinks: [...(prev.relatedLinks || []), { title: "", url: "" }] })), []);
    const handleRelatedLinkChange = useCallback((index, field, value) => setTechData(prev => ({ ...prev, relatedLinks: prev.relatedLinks.map((item, i) => i === index ? { ...item, [field]: value } : item) })), []);
    const handleRemoveRelatedLink = useCallback((index) => setTechData(prev => ({ ...prev, relatedLinks: prev.relatedLinks.filter((_, i) => i !== index) })), []);
    
    const handleImageUpload = useCallback((e) => {
        const files = Array.from(e.target.files);
        const currentTotal = (techData.images?.length || 0) + newImages.length;
        const remainingSlots = MAX_IMAGES - currentTotal;

        if (files.length > remainingSlots) { 
            toast.warn(`Max ${MAX_IMAGES} images. Can add ${remainingSlots > 0 ? remainingSlots : 0} more.`, { position: "top-center" }); 
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            return; 
        }
        setNewImages(prev => [...prev, ...files.slice(0, remainingSlots).map(f => ({ file: f, previewUrl: URL.createObjectURL(f), caption: "" }))]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [newImages.length, techData.images]);

    const handleExistingCaptionChange = useCallback((index, value) => setTechData(prev => ({ ...prev, images: prev.images.map((img, i) => i === index ? { ...img, caption: value } : img) })), []);
    const handleNewCaptionChange = useCallback((index, value) => setNewImages(prev => prev.map((img, i) => i === index ? { ...img, caption: value } : img)), []);
    const handleRemoveExistingImage = useCallback((index) => setTechData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) })), []);
    const handleRemoveNewImage = useCallback((index) => setNewImages(prev => { const img = prev[index]; if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl); return prev.filter((_, i) => i !== index); }), []);

    const handleRemoveExistingBrochure = useCallback((indexToRemove) => {
        setTechData(prev => ({
            ...prev,
            brochures: prev.brochures.filter((_, index) => index !== indexToRemove)
        }));
    }, []);

    const handleNewBrochureFilesChange = useCallback((e) => {
        const files = Array.from(e.target.files);
        const currentTotalBrochures = (techData.brochures?.length || 0) + newBrochureFilesData.length;
        const remainingSlots = MAX_BROCHURES - currentTotalBrochures;

        if (files.length === 0) return;

        if (files.length > remainingSlots) {
            toast.warn(`Max ${MAX_BROCHURES} brochures. Can add ${remainingSlots > 0 ? remainingSlots : 0} more.`, { position: "top-center" });
            if (brochureFileInputRef.current) brochureFileInputRef.current.value = "";
            return;
        }

        const newValidBrochureFiles = files.slice(0, remainingSlots).map(file => {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.oasis.opendocument.text'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const commonDocExtensions = ['pdf', 'doc', 'docx', 'txt', 'odt'];
            if (!allowedTypes.includes(file.type) && !commonDocExtensions.includes(fileExtension)) {
                toast.error(`File "${file.name}" has an invalid type.`); return null;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error(`File "${file.name}" size exceeds 10MB.`); return null;
            }
            return { file, name: file.name };
        }).filter(Boolean);

        if (newValidBrochureFiles.length > 0) {
            setNewBrochureFilesData(prev => [...prev, ...newValidBrochureFiles]);
        }
        if (brochureFileInputRef.current) brochureFileInputRef.current.value = "";
    }, [techData.brochures, newBrochureFilesData.length]);

    const handleRemoveNewBrochureFile = useCallback((indexToRemove) => {
        setNewBrochureFilesData(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canUserEdit) { toast.error("Permission Denied."); setPageError("Permission Denied."); return; }
        setPageError(null); setSubmitting(true);

        const processedData = { ...techData };
        Object.keys(processedData).forEach(key => { if (typeof processedData[key] === 'string') processedData[key] = processedData[key].trim(); });
        
        if (!processedData.name || !processedData.genre || !String(processedData.trl).trim() || !processedData.patent) { 
            toast.error("Name, Genre, TRL, and Patent Status are required."); 
            setSubmitting(false); return; 
        }
        const trlNum = Number(processedData.trl);
        if (isNaN(trlNum) || trlNum < 1 || trlNum > 9) { toast.error("TRL must be a number between 1 and 9."); setSubmitting(false); return; }
        
        processedData.trl = trlNum;
        processedData.innovators = (processedData.innovators || []).filter(inv => inv.name?.trim() || inv.mail?.trim());
        processedData.advantages = (processedData.advantages || []).map(s => s.trim()).filter(Boolean);
        processedData.applications = (processedData.applications || []).map(s => s.trim()).filter(Boolean);
        processedData.useCases = (processedData.useCases || []).map(s => s.trim()).filter(Boolean);
        processedData.relatedLinks = (processedData.relatedLinks || []).filter(link => link.title?.trim() && link.url?.trim());
        
        // Patent status is in processedData.patent
        // Clear irrelevant patent detail fields before submission
        if (processedData.patent === PATENT_STATUSES[0]) { // "Not Filed"
            processedData.patentId = "";
            processedData.patentApplicationNumber = "";
            processedData.patentFilingDate = "";
            processedData.patentGrantDate = "";
            processedData.patentDocumentUrl = "";
        } else if (processedData.patent === PATENT_STATUSES[1] || processedData.patent === PATENT_STATUSES[2]) { // "Application Filed" or "Under Examination"
            processedData.patentId = "";
            processedData.patentGrantDate = "";
        }

        processedData.spotlight = String(processedData.spotlight) === 'true';

        // Prepare payload for API, including new image data
        const payloadForApi = { ...processedData };
        payloadForApi.newImageData = newImages.map(img => ({ file: img.file, caption: img.caption || "" }));
        // newBrochureFilesData is passed as a separate argument to updateTechnologyAPI

        try {
            await updateTechnologyAPI(id, payloadForApi, newBrochureFilesData);
            toast.success("Technology updated successfully!", { position: "top-center" });
            setNewImages([]); // Clear new images after successful upload
            setNewBrochureFilesData([]); // Clear new brochures after successful upload
            fetchTechDetails(); // Refetch to display updated data, including new image/brochure URLs
        } catch (err) {
            console.error("Error updating technology:", err); setPageError(`Update failed: ${err.message}`);
            toast.error(`Update failed: ${err.message}`, { position: "top-center" });
            if (err.message.includes("Access Denied") || err.message.includes("token not found") || err.message.includes("Session Expired")) {
                setTimeout(() => navigate('/login'), 2100);
            }
        } finally { setSubmitting(false); }
    };

    if (loading) {
        return ( <Layout title="Loading..."><ToastContainer position="top-center" autoClose={3000} /><Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 200px)', p: 3 }}><CircularProgress /><Typography sx={{ ml: 2 }}>Loading Technology Data...</Typography></Box></Layout> );
    }

    if (!isPageAccessible) {
        return ( <Layout title="Access Denied"><ToastContainer position="top-center" autoClose={3000} /><Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center', margin: "20px auto", maxWidth: '600px' }}><Alert severity="error" sx={{ mb: 3 }}>{pageError || "You do not have permission to access this page."}</Alert><Button variant="outlined" onClick={() => navigate(pageError && (pageError.includes("login") || pageError.includes("Authentication")) ? '/login' : '/admin-dashboard')} sx={{ mr: 1 }}>{pageError && (pageError.includes("login") || pageError.includes("Authentication")) ? 'Go to Login' : 'Back to Dashboard'}</Button></Paper></Layout> );
    }

    return (
        <Layout title={`Edit: ${techData.name || 'Technology'}`}>
            <ToastContainer position="top-center" autoClose={3000} />
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: "12px", maxWidth: 'lg', margin: '20px auto' }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>Edit Technology</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>Modify details for ID: <strong>{id}</strong> (Docket: {techData.docket || 'N/A'}). Fields * are required.</Typography>
                <form onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2.5 }}>Basic Information</Typography><Grid container spacing={2.5}>
                            <Grid item xs={12}><TextField required label="Name" name="name" fullWidth value={techData.name} onChange={handleGenericChange} disabled={submitting} InputLabelProps={{ shrink: true }}/></Grid>
                            <Grid item xs={12} sm={6}><TextField required label="TRL Level" name="trl" type="number" fullWidth value={techData.trl} onChange={handleGenericChange} helperText="1-9" InputLabelProps={{ shrink: true }} disabled={submitting} inputProps={{ min: 1, max: 9 }} /></Grid>
                            <Grid item xs={12} sm={6}><TextField required label="Genre" name="genre" fullWidth value={techData.genre} onChange={handleGenericChange} InputLabelProps={{ shrink: true }} disabled={submitting} /></Grid>
                            <Grid item xs={12}><TextField label="Brief Description" name="description" fullWidth multiline rows={3} value={techData.description} onChange={handleGenericChange} InputLabelProps={{ shrink: true }} disabled={submitting} /></Grid>
                            
                            {/* --- Updated Patent Section --- */}
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="outlined" disabled={submitting} required>
                                    <InputLabel id="patent-status-edit-label">Patent Status *</InputLabel>
                                    <Select
                                        labelId="patent-status-edit-label"
                                        id="patent" 
                                        name="patent" // Name matches the field in techData state
                                        value={techData.patent}
                                        onChange={handlePatentStatusChange} // Use the new handler
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

                            {techData.patent !== PATENT_STATUSES[0] && ( // If not "Not Filed"
                                <>
                                    {/* Common fields for all "active" statuses */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Patent Application Number"
                                            name="patentApplicationNumber"
                                            fullWidth
                                            value={techData.patentApplicationNumber || ""}
                                            onChange={handleGenericChange}
                                            InputLabelProps={{ shrink: true }}
                                            disabled={submitting}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Patent Filing Date"
                                            name="patentFilingDate"
                                            type="date"
                                            fullWidth
                                            value={techData.patentFilingDate || ""}
                                            onChange={handleGenericChange}
                                            InputLabelProps={{ shrink: true }}
                                            disabled={submitting}
                                        />
                                    </Grid>

                                    {/* Fields specific to "Granted" or "Abandoned/Lapsed" */}
                                    {(techData.patent === PATENT_STATUSES[3] || techData.patent === PATENT_STATUSES[4]) && (
                                        <>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Patent ID"
                                                    name="patentId"
                                                    fullWidth
                                                    value={techData.patentId || ""}
                                                    onChange={handleGenericChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    disabled={submitting}
                                                    helperText={techData.patent === PATENT_STATUSES[3] ? "Required if Granted" : "If known"}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    label="Patent Grant Date"
                                                    name="patentGrantDate"
                                                    type="date"
                                                    fullWidth
                                                    value={techData.patentGrantDate || ""}
                                                    onChange={handleGenericChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    disabled={submitting}
                                                     helperText={techData.patent === PATENT_STATUSES[3] ? "Required if Granted" : "If known"}
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
                                            value={techData.patentDocumentUrl || ""}
                                            onChange={handleGenericChange}
                                            InputLabelProps={{ shrink: true }}
                                            disabled={submitting}
                                        />
                                    </Grid>
                                </>
                            )}
                            {/* ------------------------ */}
                            <Grid item xs={12} sm={techData.patent !== PATENT_STATUSES[0] ? 12 : 6} sx={{ display: 'flex', alignItems: 'center', mt: techData.patent !== PATENT_STATUSES[0] ? 1 : 0 }}>
                                <FormControl component="fieldset" disabled={submitting}>
                                    <FormLabel component="legend" sx={{ fontSize: '0.8rem', mb: -0.5 }}>Spotlight*</FormLabel>
                                    <RadioGroup row name="spotlight" value={String(techData.spotlight)} onChange={handleGenericChange}>
                                        <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                                        <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>
                        </Grid></Box></Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>
                        
                        {/* Brochure Management Section */}
                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>Brochure Management (Max {MAX_BROCHURES} Total)</Typography>
                                {/* Display Existing Brochures */}
                                {techData.brochures && techData.brochures.length > 0 && (
                                    <Box sx={{ mb: 2.5 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>Current Brochures</Typography>
                                        {techData.brochures.map((brochure, index) => (
                                            <Box key={`existing-brochure-${index}-${brochure.url}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, wordBreak: 'break-all' }}>
                                                <Button component="a" href={brochure.url.startsWith("http") ? brochure.url : `${API_BASE_URL}${brochure.url}`} target="_blank" rel="noopener noreferrer" size="small" sx={{ textTransform: 'none', textAlign: 'left', justifyContent: 'flex-start', p: 0, '&:hover': { bgcolor: 'transparent' } }}>
                                                    {brochure.originalName || brochure.url.split('/').pop()}
                                                </Button>
                                                <IconButton onClick={() => handleRemoveExistingBrochure(index)} size="small" color="error" disabled={submitting} sx={{ ml: 1 }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                {/* Display New Brochures to be Uploaded */}
                                {newBrochureFilesData.length > 0 && (
                                    <Box sx={{ mb: 2.5, mt: (techData.brochures?.length || 0) > 0 ? 2 : 0 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>New Brochures to Upload</Typography>
                                        {newBrochureFilesData.map((brochureObj, index) => (
                                            <Box key={`new-brochure-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, p: 1, border: `1px dashed ${theme.palette.primary.main}`, borderRadius: 1, wordBreak: 'break-all' }}>
                                                <Typography variant="body2">{brochureObj.name}</Typography>
                                                <IconButton onClick={() => handleRemoveNewBrochureFile(index)} size="small" color="error" disabled={submitting} sx={{ ml: 1 }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                {/* Upload Button for New Brochures */}
                                <input type="file" accept=".pdf,.doc,.docx,.txt,.odt" multiple style={{ display: 'none' }} id="new-brochure-upload-input" onChange={handleNewBrochureFilesChange} ref={brochureFileInputRef} disabled={submitting || ((techData.brochures?.length || 0) + newBrochureFilesData.length >= MAX_BROCHURES)} />
                                <label htmlFor="new-brochure-upload-input">
                                    <Button variant="outlined" component="span" startIcon={<UploadFileIcon />} sx={{ textTransform: 'none', display: 'block', width: 'fit-content', mt: (techData.brochures?.length || 0) > 0 || newBrochureFilesData.length > 0 ? 2 : 0 }}
                                        disabled={submitting || ((techData.brochures?.length || 0) + newBrochureFilesData.length >= MAX_BROCHURES)}>
                                        Add New Brochures
                                    </Button>
                                </label>
                            </Box>
                        </Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>

                        {/* Innovators Section */}
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2.5 }}>Innovators</Typography>
                            {(techData.innovators || []).map((innovator, index) => ( <Grid container spacing={2} key={index} sx={{ mb: 1.5, alignItems: 'center' }}><Grid item xs={12} sm><TextField fullWidth label={`Name ${index + 1}`} value={innovator.name || ""} onChange={(e) => handleInnovatorChange(index, "name", e.target.value)} variant="outlined" size="small" disabled={submitting} InputLabelProps={{ shrink: true }}/></Grid><Grid item xs={12} sm><TextField fullWidth label="Email (Optional)" type="email" value={innovator.mail || ""} onChange={(e) => handleInnovatorChange(index, "mail", e.target.value)} variant="outlined" size="small" disabled={submitting} InputLabelProps={{ shrink: true }}/></Grid><Grid item xs="auto">{techData.innovators.length > 1 && <IconButton onClick={() => handleRemoveInnovator(index)} color="error" disabled={submitting}><DeleteIcon /></IconButton>}</Grid></Grid> ))}
                            <Button variant="outlined" onClick={handleAddInnovator} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }} disabled={submitting}>Add Innovator</Button>
                        </Box></Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>
                        
                        {/* Further Details Section */}
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2.5 }}>Further Details</Typography><Grid container spacing={2.5}>
                            <Grid item xs={12}><TextField label="Overview" name="overview" fullWidth multiline rows={3} value={techData.overview} onChange={handleGenericChange} InputLabelProps={{ shrink: true }} disabled={submitting} /></Grid>
                            <Grid item xs={12}><TextField label="Detailed Description" name="detailedDescription" fullWidth multiline rows={5} value={techData.detailedDescription} onChange={handleGenericChange} InputLabelProps={{ shrink: true }} disabled={submitting} /></Grid>
                            <Grid item xs={12}><TextField label="Technical Specifications" name="technicalSpecifications" fullWidth multiline rows={3} value={techData.technicalSpecifications} onChange={handleGenericChange} InputLabelProps={{ shrink: true }} disabled={submitting} /></Grid>
                        </Grid></Box></Grid>

                        {/* Advantages, Applications, Use Cases Sections */}
                        {['advantages', 'applications', 'useCases'].map(fieldName => (
                            <Grid item xs={12} key={fieldName}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2, textTransform: 'capitalize' }}>{fieldName.replace(/([A-Z])/g, ' $1')}</Typography>
                                {(techData[fieldName] || []).map((value, index) => ( <Grid container spacing={1} key={index} sx={{ mb: 1.5, alignItems: 'center' }}><Grid item xs><TextField fullWidth label={`${fieldName.slice(0, -1)} #${index + 1}`} value={value} onChange={(e) => handleStringInArrayChange(fieldName, index, e.target.value)} variant="outlined" size="small" disabled={submitting} InputLabelProps={{ shrink: true }}/></Grid><Grid item xs="auto">{((techData[fieldName] || []).length > 1 || value) && <IconButton onClick={() => handleRemoveStringFromArray(fieldName, index)} color="error" disabled={submitting}><DeleteIcon /></IconButton>}</Grid></Grid> ))}
                                <Button variant="outlined" onClick={() => handleAddStringToArray(fieldName)} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 0.5, textTransform: 'none' }} disabled={submitting}>Add {fieldName.slice(0, -1)}</Button>
                            </Box></Grid>
                        ))}
                        
                        {/* Related Links Section */}
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>Related Links</Typography>
                            {(techData.relatedLinks || []).map((link, index) => ( <Grid container spacing={2} key={index} sx={{ mb: 1.5, alignItems: 'center' }}><Grid item xs={12} sm><TextField fullWidth label={`Link Title ${index + 1}`} value={link.title || ""} onChange={(e) => handleRelatedLinkChange(index, "title", e.target.value)} variant="outlined" size="small" disabled={submitting} InputLabelProps={{ shrink: true }}/></Grid><Grid item xs={12} sm><TextField fullWidth label="URL" type="url" value={link.url || ""} onChange={(e) => handleRelatedLinkChange(index, "url", e.target.value)} variant="outlined" size="small" disabled={submitting} InputLabelProps={{ shrink: true }}/></Grid><Grid item xs="auto">{((techData.relatedLinks || []).length > 1 || link.title || link.url) && <IconButton onClick={() => handleRemoveRelatedLink(index)} color="error" disabled={submitting}><DeleteIcon /></IconButton>}</Grid></Grid> ))}
                            <Button variant="outlined" onClick={handleAddRelatedLink} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 0.5, textTransform: 'none' }} disabled={submitting}>Add Link</Button>
                        </Box></Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>
                        
                        {/* Image Management Section */}
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>Images (Max {MAX_IMAGES} Total)</Typography>
                            {/* Display Existing Images */}
                            {techData.images && techData.images.length > 0 && (<Box sx={{ mb: 2.5 }}><Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>Current Images </Typography><Grid container spacing={2}>
                                {techData.images.map((image, index) => ( <Grid item xs={12} sm={6} md={4} key={`existing-${image.url}-${index}`}><Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 1, position: "relative", height: "100%", display: 'flex', flexDirection: 'column' }}><IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 1, bgcolor: "rgba(0,0,0,0.4)", color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }} onClick={() => handleRemoveExistingImage(index)} aria-label={`Remove existing image ${index + 1}`} disabled={submitting}><DeleteIcon fontSize="small" /></IconButton><Box sx={{ height: 150, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", bgcolor: theme.palette.grey[100], borderRadius: 1, mb: 1 }}><img src={image.url.startsWith("http") || image.url.startsWith("/") ? (image.url.startsWith("http") ? image.url : `${API_BASE_URL}${image.url}`) : image.url} alt={`Existing ${index + 1}`} style={{ display: 'block', maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = 'none'; const parent = e.target.parentNode; if (parent) parent.innerHTML = "<Typography variant='caption' color='error'>Image not found</Typography>"; }} /></Box><TextField fullWidth label="Caption" variant="outlined" size="small" value={image.caption || ""} onChange={(e) => handleExistingCaptionChange(index, e.target.value)} sx={{ mt: 'auto' }} InputLabelProps={{ shrink: true }} disabled={submitting} /></Paper></Grid> ))}
                            </Grid></Box>)}
                            {/* Display New Images to be Uploaded */}
                            {newImages.length > 0 && (<Box sx={{ mb: 2.5, mt: techData.images?.length > 0 ? 3 : 0 }}><Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>New Images (Preview)</Typography><Grid container spacing={2}>
                                {newImages.map((imageObj, index) => ( <Grid item xs={12} sm={6} md={4} key={`new-${index}`}><Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 1, position: "relative", height: "100%", display: 'flex', flexDirection: 'column' }}><IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 1, bgcolor: "rgba(0,0,0,0.4)", color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }} onClick={() => handleRemoveNewImage(index)} aria-label={`Remove new image ${index + 1}`} disabled={submitting}><DeleteIcon fontSize="small" /></IconButton><Box sx={{ height: 150, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", bgcolor: theme.palette.grey[100], borderRadius: 1, mb: 1 }}><img src={imageObj.previewUrl} alt={`New preview ${index + 1}`} style={{ display: 'block', maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /></Box><TextField fullWidth label="Caption" variant="outlined" size="small" value={imageObj.caption} onChange={(e) => handleNewCaptionChange(index, e.target.value)} helperText={(imageObj.file.name || "").substring(0, 20) + '...'} sx={{ mt: 'auto' }} InputLabelProps={{ shrink: true }} disabled={submitting} /></Paper></Grid> ))}
                            </Grid></Box>)}
                            {/* Upload Button for New Images */}
                            <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />} sx={{ mt: 1, textTransform: 'none' }} disabled={submitting || ((techData.images?.length || 0) + newImages.length >= MAX_IMAGES)}>Add New Images<input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleImageUpload} /></Button>
                        </Box></Grid>

                        <Grid item xs={12} sx={{ textAlign: "center", mt: 3, mb: 1 }}>
                            <Button type="submit" variant="contained" size="large" disabled={submitting || !canUserEdit} sx={{ minWidth: 180, borderRadius: "8px", py: 1.25, px: 5, fontWeight: 'bold', boxShadow: theme.shadows[2], bgcolor: 'primary.dark', color: "white", transition: "all 0.3s", '&:hover': { boxShadow: theme.shadows[4], transform: "translateY(-2px)", bgcolor: 'primary.main' }, '&:disabled': { background: theme.palette.action.disabledBackground } }}>{submitting ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}</Button>
                            <Button variant="outlined" size="large" onClick={() => navigate("/admin-dashboard")} disabled={submitting} sx={{ ml: 2, py: 1.25, px: 5, borderRadius: "8px" }}>Cancel</Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Layout>
    );
};

export default EditTechnology;
