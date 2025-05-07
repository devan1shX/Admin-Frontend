"use client";

import React, { useState, useRef } from "react";
import {
    TextField, Button, Paper, Grid, Typography, useTheme,
    useMediaQuery, IconButton, Box, Card, CardMedia, Divider,
    Switch, FormControlLabel,
    CircularProgress // Added CircularProgress here
} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { toast } from "react-toastify"; // Assuming ToastContainer is in Layout or imported here

const API_BASE_URL = "http://192.168.1.148:5001";

// Helper to get token from localStorage (if not already in a shared utils file)
const getToken = () => {
    return localStorage.getItem("token");
};

const addTech = async (newData) => {
    const token = getToken();
    if (!token) {
        console.error("Authentication token not found. Please log in.");
        toast.error("Authentication token not found. Please log in.");
        throw new Error("Authentication token not found. Please log in.");
    }

    const formData = new FormData();

    Object.entries(newData).forEach(([key, value]) => {
        if (key === 'images') {
            // Files are handled separately
        } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
        } else if (key === 'spotlight') {
            formData.append(key, String(value));
        } else {
            formData.append(key, value);
        }
    });

    if (newData.images && newData.images.length > 0) {
        newData.images.forEach((image, index) => {
            if (image.file) {
                formData.append('images', image.file); 
                formData.append(`imageCaptions[${index}]`, image.caption || "");
            }
        });
    }
    
    const response = await fetch(`${API_BASE_URL}/technologies`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        console.error("Failed to add technology. Status:", response.status, "Body:", errorBody);
        throw new Error(errorBody.message || `Failed to add technology. Status: ${response.status}`);
    }

    const data = await response.json();
    return { status: response.status, data };
};

const AddTechnology = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const fileInputRef = useRef(null);

    const [addData, setAddData] = useState({
        name: "",
        description: "",
        overview: "",
        detailedDescription: "",
        genre: "",
        innovators: [{ name: "", mail: "" }],
        advantages: [""], 
        applications: [""],
        useCases: [""],
        relatedLinks: [{ title: "", url: "" }], 
        technicalSpecifications: "",
        trl: "",
        images: [],
        patent: "",
        spotlight: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGenericChange = (e) => {
        const { name, value } = e.target;
        setAddData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (e) => {
        setAddData((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
    };

    const handleAddInnovator = () => setAddData(prev => ({ ...prev, innovators: [...prev.innovators, { name: "", mail: "" }] }));
    const handleRemoveInnovator = (index) => setAddData(prev => ({ ...prev, innovators: prev.innovators.filter((_, i) => i !== index) }));
    const handleInnovatorChange = (index, field, value) => {
        setAddData(prev => ({ ...prev, innovators: prev.innovators.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
    };

    const handleAddStringToArray = (fieldName) => {
        setAddData(prev => ({ ...prev, [fieldName]: [...prev[fieldName], ""] }));
    };
    const handleStringInArrayChange = (fieldName, index, value) => {
        setAddData(prev => {
            const newArray = [...prev[fieldName]];
            newArray[index] = value;
            return { ...prev, [fieldName]: newArray };
        });
    };
    const handleRemoveStringFromArray = (fieldName, index) => {
        setAddData(prev => ({ ...prev, [fieldName]: prev[fieldName].filter((_, i) => i !== index) }));
    };

    const handleAddRelatedLink = () => setAddData(prev => ({ ...prev, relatedLinks: [...prev.relatedLinks, { title: "", url: "" }] }));
    const handleRemoveRelatedLink = (index) => setAddData(prev => ({ ...prev, relatedLinks: prev.relatedLinks.filter((_, i) => i !== index) }));
    const handleRelatedLinkChange = (index, field, value) => {
        setAddData(prev => ({ ...prev, relatedLinks: prev.relatedLinks.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
    };
    
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const currentImageCount = addData.images.length;
        const remainingSlots = 5 - currentImageCount;
        
        if (files.length > remainingSlots) {
            toast.warn(`You can only add ${remainingSlots > 0 ? remainingSlots : 0} more image(s). Max 5 images allowed.`);
        }

        const newImageObjects = files.slice(0, remainingSlots).map(file => ({
            file,
            preview: URL.createObjectURL(file),
            caption: ""
        }));

        setAddData(prev => ({ ...prev, images: [...prev.images, ...newImageObjects] }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImageDelete = (index) => {
        setAddData(prev => {
            const imageToDelete = prev.images[index];
            if (imageToDelete?.preview) URL.revokeObjectURL(imageToDelete.preview);
            return { ...prev, images: prev.images.filter((_, i) => i !== index) };
        });
    };

    const handleImageCaptionChange = (index, caption) => {
        setAddData(prev => ({ ...prev, images: prev.images.map((img, i) => i === index ? { ...img, caption } : img) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const processedData = { ...addData };
        Object.keys(processedData).forEach(key => {
            if (typeof processedData[key] === 'string') processedData[key] = processedData[key].trim();
        });

        if (!processedData.name || !processedData.genre || !String(processedData.trl).trim()) {
            toast.error("Please fill in all required fields: Name, Genre, and TRL Level.");
            setIsSubmitting(false);
            return;
        }
        const trlNum = Number(processedData.trl);
        if (isNaN(trlNum)) {
            toast.error("TRL Level must be a valid number.");
            setIsSubmitting(false);
            return;
        }
        processedData.trl = trlNum;

        processedData.innovators = processedData.innovators.filter(inv => inv.name.trim() || inv.mail.trim());
        processedData.advantages = processedData.advantages.map(adv => adv.trim()).filter(Boolean);
        processedData.applications = processedData.applications.map(app => app.trim()).filter(Boolean);
        processedData.useCases = processedData.useCases.map(uc => uc.trim()).filter(Boolean);
        processedData.relatedLinks = processedData.relatedLinks.filter(link => link.title.trim() && link.url.trim());
        
        const finalImagesData = processedData.images.map(img => ({
            file: img.file,
            caption: img.caption || ""
        }));

        const payload = { ...processedData, images: finalImagesData };

        try {
            await addTech(payload); // Removed 'res =' as it's not used before toast/navigate
            toast.success("Technology added successfully!");
            navigate("/admin-dashboard");
        } catch (error) {
            console.error("Error adding technology:", error);
            toast.error(`Error adding technology: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout title="Add New Technology">
            <Paper elevation={3} sx={{ p: isMobile ? 2 : 4, borderRadius: "12px", maxWidth: 'lg', margin: 'auto', }}>
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
                                    <Grid item xs={12}><TextField label="Name *" name="name" fullWidth value={addData.name} onChange={handleGenericChange} required /></Grid>
                                    <Grid item xs={12} sm={6}><TextField label="TRL Level *" name="trl" type="number" fullWidth value={addData.trl} onChange={handleGenericChange} required helperText="Technology Readiness Level (1-9)" /></Grid>
                                    <Grid item xs={12} sm={6}><TextField label="Genre *" name="genre" fullWidth value={addData.genre} onChange={handleGenericChange} required /></Grid>
                                    <Grid item xs={12}><TextField label="Brief Description" name="description" fullWidth multiline rows={3} value={addData.description} onChange={handleGenericChange} /></Grid>
                                    <Grid item xs={12} sm={6}><TextField label="Patent Status/Number" name="patent" fullWidth value={addData.patent} onChange={handleGenericChange} /></Grid>
                                    <Grid item xs={12} sm={6} sx={{display:'flex', alignItems:'center'}}><FormControlLabel control={<Switch checked={addData.spotlight} onChange={handleSwitchChange} name="spotlight" />} label="Spotlight Technology?" /></Grid>
                                </Grid>
                            </Box>
                        </Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 1 }} /></Grid>
                        
                        <Grid item xs={12}>
                             <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500 }}>Innovators</Typography>
                                {addData.innovators.map((innovator, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label={`Innovator ${index + 1} Name`} value={innovator.name} onChange={(e) => handleInnovatorChange(index, 'name', e.target.value)} variant="outlined" size="small" /></Grid>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label="Email (Optional)" type="email" value={innovator.mail} onChange={(e) => handleInnovatorChange(index, 'mail', e.target.value)} variant="outlined" size="small" /></Grid>
                                        <Grid item xs={12} sm={2} sx={{ textAlign: isMobile ? 'right' : 'center' }}>
                                            {addData.innovators.length > 1 && <IconButton onClick={() => handleRemoveInnovator(index)} color="error" aria-label="Remove Innovator"><DeleteIcon /></IconButton>}
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button variant="outlined" onClick={handleAddInnovator} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }}>Add Innovator</Button>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12}><Divider light sx={{ my: 1 }} /></Grid>

                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500 }}>Technology Details</Typography>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12}><TextField label="Overview" name="overview" fullWidth multiline rows={3} value={addData.overview} onChange={handleGenericChange} /></Grid>
                                    <Grid item xs={12}><TextField label="Detailed Description" name="detailedDescription" fullWidth multiline rows={5} value={addData.detailedDescription} onChange={handleGenericChange} /></Grid>
                                    <Grid item xs={12}><TextField label="Technical Specifications (Optional)" name="technicalSpecifications" fullWidth multiline rows={3} value={addData.technicalSpecifications} onChange={handleGenericChange} /></Grid>
                                </Grid>
                            </Box>
                        </Grid>
                        
                        {['advantages', 'applications', 'useCases'].map(fieldName => (
                            <Grid item xs={12} key={fieldName}>
                                <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500, textTransform: 'capitalize' }}>{fieldName.replace(/([A-Z])/g, ' $1')}</Typography>
                                    {addData[fieldName].map((value, index) => (
                                        <Grid container spacing={1} key={index} sx={{ mb: 1.5, alignItems: 'center' }}>
                                            <Grid item xs><TextField fullWidth label={`${fieldName.slice(0, -1)} ${index + 1}`} value={value} onChange={(e) => handleStringInArrayChange(fieldName, index, e.target.value)} variant="outlined" size="small" /></Grid>
                                            <Grid item xs="auto">
                                                {addData[fieldName].length > 1 && <IconButton onClick={() => handleRemoveStringFromArray(fieldName, index)} color="error" aria-label={`Remove ${fieldName.slice(0,-1)}`}><DeleteIcon /></IconButton>}
                                            </Grid>
                                        </Grid>
                                    ))}
                                    <Button variant="outlined" onClick={() => handleAddStringToArray(fieldName)} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }}>Add {fieldName.slice(0, -1)}</Button>
                                </Box>
                            </Grid>
                        ))}

                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 2.5, fontWeight: 500 }}>Related Links (Optional)</Typography>
                                {addData.relatedLinks.map((link, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label={`Link Title ${index + 1}`} value={link.title} onChange={(e) => handleRelatedLinkChange(index, 'title', e.target.value)} variant="outlined" size="small" /></Grid>
                                        <Grid item xs={12} sm={5}><TextField fullWidth label="URL" type="url" value={link.url} onChange={(e) => handleRelatedLinkChange(index, 'url', e.target.value)} variant="outlined" size="small" /></Grid>
                                        <Grid item xs={12} sm={2} sx={{ textAlign: isMobile ? 'right' : 'center' }}>
                                           {addData.relatedLinks.length > 1 && <IconButton onClick={() => handleRemoveRelatedLink(index)} color="error" aria-label="Remove Link"><DeleteIcon /></IconButton>}
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button variant="outlined" onClick={handleAddRelatedLink} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, textTransform: 'none' }}>Add Link</Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12}><Divider light sx={{ my: 1 }} /></Grid>

                        <Grid item xs={12}>
                            <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2.5, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{mb:1.5, fontWeight:500}}>Images (Max 5, Optional)</Typography>
                                <input type="file" multiple accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} id="image-upload-input" />
                                <label htmlFor="image-upload-input">
                                    <Button variant="outlined" component="span" startIcon={<AddPhotoAlternateIcon />} sx={{ mb: 2, textTransform:'none' }} disabled={addData.images.length >= 5} > Select Images </Button>
                                </label>
                                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                    {addData.images.map((image, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: theme.shadows[1] }}>
                                                <CardMedia component="img" height="160" image={image.preview} alt={`Preview ${index + 1}`} sx={{ objectFit: 'contain', p:1 }} />
                                                <IconButton aria-label="Delete image" sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.4)', color: 'white', p:0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }} onClick={() => handleImageDelete(index)} > <DeleteIcon fontSize="small" /> </IconButton>
                                                <Box sx={{ p: 1.5, mt: 'auto' }}> <TextField fullWidth size="small" variant="outlined" placeholder="Image Caption (optional)" value={image.caption} onChange={(e) => handleImageCaptionChange(index, e.target.value)} /> </Box>
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
                                    boxShadow: theme.shadows[2], bgcolor: 'primary.dark',
                                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                    '&:hover': { boxShadow: theme.shadows[4], transform: "translateY(-2px)", bgcolor: 'primary.main' },
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