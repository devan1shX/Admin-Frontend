"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    TextField, Button, Paper, Grid, Typography, CircularProgress,
    useTheme, useMediaQuery, Box, IconButton, Divider, Radio,
    RadioGroup, FormControlLabel, FormControl, FormLabel, Alert, Switch, Tooltip
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile'; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";

const API_BASE_URL = "http://192.168.1.148:5001";
const MAX_IMAGES = 5;
const MAX_BROCHURES = 5; 

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

// updatedData will contain techData.brochures (list of existing brochures to keep)
// newBrochureFilesArray is the array of new File objects from state newBrochureFilesData
const updateTechnologyAPI = async (id, updatedData, newBrochureFilesArray = []) => {
    const token = getTokenFromStorage();
    if (!token) throw new Error("Authentication token not found. Please log in.");
    
    const currentUserInfo = getUserInfoFromStorage();
    if (!(currentUserInfo?.editTech || currentUserInfo?.role === 'superAdmin')) {
        throw new Error("Permission denied. You are not authorized to update technologies.");
    }

    const formData = new FormData();
    Object.entries(updatedData).forEach(([key, value]) => {
        if (key === "images" || key === "newImageData" || key === "brochures" || key === "_id" || key === "__v" || key === "docket" || key === "id") return;
        if (Array.isArray(value) && key !== 'brochures') { // brochures is handled specially below
            formData.append(key, JSON.stringify(value));
        } else if (key === 'spotlight') {
            formData.append(key, String(value));
        } else if (value !== null && value !== undefined && key !== 'brochures') {
            formData.append(key, value);
        }
    });

    const validExistingImages = (updatedData.images || []).filter(img => img && img.url).map(img => ({ url: img.url, caption: img.caption || "" }));
    formData.append("existingImages", JSON.stringify(validExistingImages));

    let imageFileIndex = 0;
    if (updatedData.newImageData && updatedData.newImageData.length > 0) {
        updatedData.newImageData.forEach((imgData) => {
            if (imgData.file) {
                formData.append("images", imgData.file);
                formData.append(`imageCaptions[${imageFileIndex}]`, imgData.caption || "");
                imageFileIndex++;
            }
        });
    }

    // Send the list of existing brochures to keep
    formData.append("existingBrochures", JSON.stringify(updatedData.brochures || []));

    // Append new brochure files
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
            if (response.status === 401 || response.status === 403) { errorMsg = errorData.message || "Access Denied or Session Expired.";}
            else if (response.status === 409) errorMsg = errorData.message || "Update conflict.";
        } catch (e) { console.error("Could not parse error response as JSON for update:", await response.text().catch(()=>"")); }
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
        images: [], patent: "", spotlight: "false", brochures: [] // Initialize as array
    });
    const [newImages, setNewImages] = useState([]);
    const [newBrochureFilesData, setNewBrochureFilesData] = useState([]); // For new brochure file objects
    
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
        if (!canUserEdit && userInfo) { // Check userInfo to ensure permission check runs after userInfo is set
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
                genre: data.genre || "", patent: data.patent || "",
                spotlight: data.spotlight ? String(data.spotlight) : "false",
                docket: data.docket || "",
                innovators: Array.isArray(data.innovators) && data.innovators.length > 0 ? data.innovators : [{ name: "", mail: "" }],
                advantages: Array.isArray(data.advantages) && data.advantages.length > 0 ? data.advantages : [""],
                applications: Array.isArray(data.applications) && data.applications.length > 0 ? data.applications : [""],
                useCases: Array.isArray(data.useCases) && data.useCases.length > 0 ? data.useCases : [""],
                relatedLinks: Array.isArray(data.relatedLinks) && data.relatedLinks.length > 0 ? data.relatedLinks : [{ title: "", url: "" }],
                technicalSpecifications: data.technicalSpecifications || "",
                trl: data.trl ? String(data.trl) : "",
                images: Array.isArray(data.images) ? data.images.filter(img => img?.url) : [],
                brochures: Array.isArray(data.brochures) ? data.brochures.filter(b => b?.url && b?.originalName) : []
            });
            setIsPageAccessible(true); 
            setNewBrochureFilesData([]); // Reset new brochures on fetch
        } catch (err) {
            console.error("Error fetching technology for edit:", err);
            setPageError(`Failed to load technology: ${err.message}`);
            toast.error(`Failed to load data: ${err.message}`, { position: "top-center" });
            setIsPageAccessible(false);
            if (err.message.includes("Access Denied") || err.message.includes("token not found") || err.message.includes("Session may have expired")) {
                setTimeout(() => navigate('/login'), 2100);
            }
        } finally { setLoading(false); }
    }, [id, navigate, canUserEdit, userInfo]); // Added userInfo as dependency for permission check timing

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
        if (files.length + currentTotal > MAX_IMAGES) { toast.warn(`Max ${MAX_IMAGES} images. Already ${currentTotal} selected.`, { position: "top-center" }); if (fileInputRef.current) fileInputRef.current.value = ""; return; }
        setNewImages(prev => [...prev, ...files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f), caption: "" }))]);
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
        
        if (files.length === 0) return;

        if (files.length + currentTotalBrochures > MAX_BROCHURES) {
            toast.warn(`Max ${MAX_BROCHURES} brochures allowed. Already ${currentTotalBrochures} (existing + new).`, { position: "top-center" });
            if (brochureFileInputRef.current) brochureFileInputRef.current.value = "";
            return;
        }

        const newValidBrochureFiles = files.map(file => {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.oasis.opendocument.text'];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const commonDocExtensions = ['pdf', 'doc', 'docx', 'txt', 'odt'];
            if (!allowedTypes.includes(file.type) && !commonDocExtensions.includes(fileExtension)) {
                 toast.error(`File "${file.name}" has an invalid type.`); return null;
            }
            if (file.size > 10 * 1024 * 1024) { 
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
        if (!processedData.name || !processedData.genre || !String(processedData.trl).trim()) { toast.error("Name, Genre, and TRL are required."); setSubmitting(false); return; }
        const trlNum = Number(processedData.trl);
        if (isNaN(trlNum) || trlNum < 1 || trlNum > 9) { toast.error("TRL must be a number between 1 and 9."); setSubmitting(false); return; }
        processedData.trl = trlNum;
        processedData.innovators = (processedData.innovators || []).filter(inv => inv.name?.trim() || inv.mail?.trim());
        processedData.advantages = (processedData.advantages || []).map(s => s.trim()).filter(Boolean);
        processedData.applications = (processedData.applications || []).map(s => s.trim()).filter(Boolean);
        processedData.useCases = (processedData.useCases || []).map(s => s.trim()).filter(Boolean);
        processedData.relatedLinks = (processedData.relatedLinks || []).filter(link => link.title?.trim() && link.url?.trim());
        processedData.spotlight = String(processedData.spotlight) === 'true';
        
        // techData.brochures already reflects existing brochures to keep
        // newBrochureFilesData holds the new files to upload

        const payloadForApi = { ...processedData }; // Contains modified techData.brochures
        payloadForApi.newImageData = newImages.map(img => ({ file: img.file, caption: img.caption || "" }));
        
        try {
            await updateTechnologyAPI(id, payloadForApi, newBrochureFilesData);
            toast.success("Technology updated successfully!", { position: "top-center" });
            setNewImages([]); 
            setNewBrochureFilesData([]); 
            fetchTechDetails(); 
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
                            <Grid item xs={12}><TextField required label="Name" name="name" fullWidth value={techData.name} onChange={handleGenericChange} disabled={submitting} /></Grid>
                            <Grid item xs={12} sm={6}><TextField required label="TRL Level" name="trl" type="number" fullWidth value={techData.trl} onChange={handleGenericChange} helperText="1-9" InputLabelProps={{ shrink: !!techData.trl }} disabled={submitting} inputProps={{ min: 1, max: 9 }}/></Grid>
                            <Grid item xs={12} sm={6}><TextField required label="Genre" name="genre" fullWidth value={techData.genre} onChange={handleGenericChange} InputLabelProps={{ shrink: !!techData.genre }} disabled={submitting} /></Grid>
                            <Grid item xs={12}><TextField label="Brief Description" name="description" fullWidth multiline rows={3} value={techData.description} onChange={handleGenericChange} InputLabelProps={{ shrink: !!techData.description }} disabled={submitting} /></Grid>
                            <Grid item xs={12} sm={6}><TextField label="Patent" name="patent" fullWidth value={techData.patent} onChange={handleGenericChange} helperText="Patent number/status" InputLabelProps={{ shrink: !!techData.patent }} disabled={submitting} /></Grid>
                            <Grid item xs={12} sm={6} sx={{display:'flex', alignItems:'center'}}><FormControl component="fieldset" disabled={submitting}><FormLabel component="legend" sx={{fontSize: '0.8rem', mb: -0.5}}>Spotlight*</FormLabel><RadioGroup row name="spotlight" value={techData.spotlight} onChange={handleGenericChange}><FormControlLabel value="true" control={<Radio size="small"/>} label="Yes" /><FormControlLabel value="false" control={<Radio size="small"/>} label="No" /></RadioGroup></FormControl></Grid>
                        </Grid></Box></Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>

                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>Brochure Management (Max {MAX_BROCHURES} Total)</Typography>
                                
                                {techData.brochures && techData.brochures.length > 0 && (
                                    <Box sx={{ mb: 2.5 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>Current Brochures</Typography>
                                        {techData.brochures.map((brochure, index) => (
                                            <Box key={`existing-brochure-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, p:1, border: `1px solid ${theme.palette.divider}`, borderRadius:1, wordBreak: 'break-all' }}>
                                                <Button component="a" href={`${API_BASE_URL}${brochure.url}`} target="_blank" rel="noopener noreferrer" size="small" sx={{textTransform: 'none', textAlign:'left', justifyContent:'flex-start', p:0, '&:hover': {bgcolor: 'transparent'}}}>
                                                    {brochure.originalName || brochure.url.split('/').pop()}
                                                </Button>
                                                <IconButton onClick={() => handleRemoveExistingBrochure(index)} size="small" color="error" disabled={submitting} sx={{ml:1}}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                {newBrochureFilesData.length > 0 && (
                                    <Box sx={{ mb: 2.5, mt: (techData.brochures?.length || 0) > 0 ? 2 : 0 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>New Brochures to Upload</Typography>
                                        {newBrochureFilesData.map((brochureObj, index) => (
                                            <Box key={`new-brochure-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, p:1, border: `1px dashed ${theme.palette.primary.main}`, borderRadius:1, wordBreak: 'break-all' }}>
                                                <Typography variant="body2">{brochureObj.name}</Typography>
                                                <IconButton onClick={() => handleRemoveNewBrochureFile(index)} size="small" color="error" disabled={submitting} sx={{ml:1}}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                
                                <input type="file" accept=".pdf,.doc,.docx,.txt,.odt" multiple style={{ display: 'none' }} id="new-brochure-upload-input" onChange={handleNewBrochureFilesChange} ref={brochureFileInputRef} disabled={submitting || ((techData.brochures?.length || 0) + newBrochureFilesData.length >= MAX_BROCHURES)} />
                                <label htmlFor="new-brochure-upload-input">
                                    <Button variant="outlined" component="span" startIcon={<UploadFileIcon />} sx={{ textTransform:'none', display:'block', width: 'fit-content', mt: (techData.brochures?.length || 0) > 0 || newBrochureFilesData.length > 0 ? 2 : 0 }} 
                                        disabled={submitting || ((techData.brochures?.length || 0) + newBrochureFilesData.length >= MAX_BROCHURES)}>
                                        Add New Brochures
                                    </Button>
                                </label>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>

                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2.5 }}>Innovators</Typography>
                            {(techData.innovators || []).map((innovator, index) => ( <Grid container spacing={2} key={index} sx={{ mb: 1.5, alignItems: 'center' }}><Grid item xs={12} sm><TextField fullWidth label={`Name ${index + 1}`} value={innovator.name || ""} onChange={(e) => handleInnovatorChange(index, "name", e.target.value)} variant="outlined" size="small" disabled={submitting} /></Grid><Grid item xs={12} sm><TextField fullWidth label="Email (Optional)" type="email" value={innovator.mail || ""} onChange={(e) => handleInnovatorChange(index, "mail", e.target.value)} variant="outlined" size="small" disabled={submitting} /></Grid><Grid item xs="auto">{techData.innovators.length > 1 && <IconButton onClick={() => handleRemoveInnovator(index)} color="error" disabled={submitting}><DeleteIcon /></IconButton>}</Grid></Grid> ))}
                            <Button variant="outlined" onClick={handleAddInnovator} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }} disabled={submitting}>Add Innovator</Button>
                        </Box></Grid>
                        
                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2.5 }}>Further Details</Typography><Grid container spacing={2.5}>
                            <Grid item xs={12}><TextField label="Overview" name="overview" fullWidth multiline rows={3} value={techData.overview} onChange={handleGenericChange} InputLabelProps={{ shrink: !!techData.overview }} disabled={submitting} /></Grid>
                            <Grid item xs={12}><TextField label="Detailed Description" name="detailedDescription" fullWidth multiline rows={5} value={techData.detailedDescription} onChange={handleGenericChange} InputLabelProps={{ shrink: !!techData.detailedDescription }} disabled={submitting} /></Grid>
                            <Grid item xs={12}><TextField label="Technical Specifications" name="technicalSpecifications" fullWidth multiline rows={3} value={techData.technicalSpecifications} onChange={handleGenericChange} InputLabelProps={{ shrink: !!techData.technicalSpecifications }} disabled={submitting} /></Grid>
                        </Grid></Box></Grid>

                        {['advantages', 'applications', 'useCases'].map(fieldName => (
                            <Grid item xs={12} key={fieldName}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2, textTransform: 'capitalize' }}>{fieldName.replace(/([A-Z])/g, ' $1')}</Typography>
                                {(techData[fieldName] || []).map((value, index) => ( <Grid container spacing={1} key={index} sx={{ mb: 1.5, alignItems: 'center' }}><Grid item xs><TextField fullWidth label={`${fieldName.slice(0,-1)} #${index + 1}`} value={value} onChange={(e) => handleStringInArrayChange(fieldName, index, e.target.value)} variant="outlined" size="small" disabled={submitting}/></Grid><Grid item xs="auto">{((techData[fieldName] || []).length > 1 || value) && <IconButton onClick={() => handleRemoveStringFromArray(fieldName, index)} color="error" disabled={submitting}><DeleteIcon /></IconButton>}</Grid></Grid> ))}
                                <Button variant="outlined" onClick={() => handleAddStringToArray(fieldName)} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 0.5, textTransform: 'none' }} disabled={submitting}>Add {fieldName.slice(0,-1)}</Button>
                            </Box></Grid>
                        ))}
                        
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>Related Links</Typography>
                            {(techData.relatedLinks || []).map((link, index) => ( <Grid container spacing={2} key={index} sx={{ mb: 1.5, alignItems: 'center' }}><Grid item xs={12} sm><TextField fullWidth label={`Link Title ${index + 1}`} value={link.title || ""} onChange={(e) => handleRelatedLinkChange(index, "title", e.target.value)} variant="outlined" size="small" disabled={submitting} /></Grid><Grid item xs={12} sm><TextField fullWidth label="URL" type="url" value={link.url || ""} onChange={(e) => handleRelatedLinkChange(index, "url", e.target.value)} variant="outlined" size="small" disabled={submitting} /></Grid><Grid item xs="auto">{((techData.relatedLinks || []).length > 1 || link.title || link.url) &&<IconButton onClick={() => handleRemoveRelatedLink(index)} color="error" disabled={submitting}><DeleteIcon /></IconButton>}</Grid></Grid> ))}
                            <Button variant="outlined" onClick={handleAddRelatedLink} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 0.5, textTransform: 'none' }} disabled={submitting}>Add Link</Button>
                        </Box></Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 0.5 }} /></Grid>
                        <Grid item xs={12}><Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}><Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>Images (Max {MAX_IMAGES} Total)</Typography>
                            {techData.images && techData.images.length > 0 && (<Box sx={{ mb: 2.5 }}><Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>Current Images </Typography><Grid container spacing={2}>
                                {techData.images.map((image, index) => ( <Grid item xs={12} sm={6} md={4} key={`existing-${image.url}-${index}`}><Paper elevation={0} sx={{border: `1px solid ${theme.palette.divider}`, p: 1, position: "relative", height: "100%", display: 'flex', flexDirection: 'column' }}><IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 1, bgcolor: "rgba(0,0,0,0.4)", color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }} onClick={() => handleRemoveExistingImage(index)} aria-label={`Remove existing image ${index + 1}`} disabled={submitting}><DeleteIcon fontSize="small" /></IconButton><Box sx={{ height: 150, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", bgcolor: theme.palette.grey[100], borderRadius: 1, mb: 1 }}><img src={image.url.startsWith("http") || image.url.startsWith("/uploads") || image.url.startsWith("/brochures") ? `${API_BASE_URL}${image.url}`: image.url} alt={`Existing ${index + 1}`} style={{ display: 'block', maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display='none'; const parent = e.target.parentNode; if(parent) parent.innerHTML = "<Typography variant='caption' color='error'>Image not found</Typography>"; }} /></Box><TextField fullWidth label="Caption" variant="outlined" size="small" value={image.caption || ""} onChange={(e) => handleExistingCaptionChange(index, e.target.value)} sx={{ mt: 'auto' }} InputLabelProps={{ shrink: true }} disabled={submitting} /></Paper></Grid> ))}
                            </Grid></Box>)}
                            {newImages.length > 0 && (<Box sx={{ mb: 2.5, mt: techData.images?.length > 0 ? 3 : 0 }}><Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium' }}>New Images (Preview)</Typography><Grid container spacing={2}>
                                {newImages.map((imageObj, index) => ( <Grid item xs={12} sm={6} md={4} key={`new-${index}`}><Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`,p: 1, position: "relative", height: "100%", display: 'flex', flexDirection: 'column' }}><IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 1, bgcolor: "rgba(0,0,0,0.4)", color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }} onClick={() => handleRemoveNewImage(index)} aria-label={`Remove new image ${index + 1}`} disabled={submitting}><DeleteIcon fontSize="small" /></IconButton><Box sx={{ height: 150, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", bgcolor: theme.palette.grey[100], borderRadius: 1, mb: 1 }}><img src={imageObj.previewUrl} alt={`New preview ${index + 1}`} style={{ display: 'block', maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /></Box><TextField fullWidth label="Caption" variant="outlined" size="small" value={imageObj.caption} onChange={(e) => handleNewCaptionChange(index, e.target.value)} helperText={(imageObj.file.name || "").substring(0,20)+'...'} sx={{ mt: 'auto' }} InputLabelProps={{ shrink: true }} disabled={submitting} /></Paper></Grid> ))}
                            </Grid></Box>)}
                            <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />} sx={{ mt: 1, textTransform:'none' }} disabled={submitting || ((techData.images?.length || 0) + newImages.length >= MAX_IMAGES)}>Add New Images<input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleImageUpload} /></Button>
                        </Box></Grid>

                        <Grid item xs={12} sx={{ textAlign: "center", mt: 3, mb:1 }}>
                            <Button type="submit" variant="contained" size="large" disabled={submitting || !canUserEdit} sx={{ minWidth: 180, borderRadius: "8px", py: 1.25, px: 5, fontWeight: 'bold', boxShadow: theme.shadows[2], bgcolor:'primary.dark', color: "white", transition: "all 0.3s", '&:hover': { boxShadow: theme.shadows[4], transform: "translateY(-2px)", bgcolor:'primary.main' }, '&:disabled': { background: theme.palette.action.disabledBackground } }}>{submitting ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}</Button>
                            <Button variant="outlined" size="large" onClick={() => navigate("/admin-dashboard")} disabled={submitting} sx={{ ml: 2, py: 1.25, px: 5, borderRadius: "8px" }}>Cancel</Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Layout>
    );
};

export default EditTechnology;