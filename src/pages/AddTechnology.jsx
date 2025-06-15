// AddTechnology.jsx

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    TextField, Button, Paper, Grid, Typography, useTheme,
    useMediaQuery, IconButton, Box, Card, CardMedia, Divider,
    Switch, FormControlLabel,
    CircularProgress, Alert,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ==================  STEP 1: Import Firebase Auth  ==================
import { auth } from "../../firebase"; // Make sure this path is correct

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


// ==================  STEP 2: Replace the old API function  ==================

const addTechnologyAPI = async (newData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No authenticated user found. Please log in.");
    }
    
    // This is the FIX: Always get a fresh token from Firebase Auth SDK.
    // It will be valid and won't be expired.
    const token = await currentUser.getIdToken();

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
        } else if (value !== null && value !== undefined && value !== "") {
            formData.append(key, value);
        } else if (key === 'patent' && value === "Not Filed") {
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
        headers: { 'Authorization': `Bearer ${token}` }, // Sending the fresh token
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        console.error("Failed to add technology. Status:", response.status, "Body:", errorBody);
        throw new Error(errorBody.message || `Failed to add technology. Status: ${response.status}`);
    }
    return await response.json();
};


// The rest of your AddTechnology component remains the same.
// No other changes are needed below this line.
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
        patentStatus: "Not Filed",
        patentId: "",
        patentApplicationNumber: "",
        patentFilingDate: "",
        patentGrantDate: "",
        patentDocumentUrl: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canUserAddTech = useMemo(() => {
        return userInfo?.addTech || userInfo?.role === 'superAdmin';
    }, [userInfo]);

    useEffect(() => {
        const currentUserInfo = getUserInfoFromStorage();
        // The token from localStorage is only used for the initial check.
        // It's okay if it's stale here, the API call will get a fresh one.
        const token = localStorage.getItem("token"); 

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
    
    // ... all your other handler functions (handleGenericChange, handleSubmit, etc.) are fine.
    // Make sure the `handleSubmit` function calls the *new* `addTechnologyAPI`
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

        processedData.patent = processedData.patentStatus;
        delete processedData.patentStatus;

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
            // It will now call the new, corrected API function
            await addTechnologyAPI(processedData);
            toast.success("Technology added successfully!");
            navigate("/admin-dashboard");
        } catch (error) {
            console.error("Error adding technology:", error);
            toast.error(`Error adding technology: ${error.message}`);
            // If the error is auth-related, prompt a full re-login
            if (error.message.includes("Token") || error.message.includes("No authenticated user")) {
                toast.error("Your session has expired. Please log in again.");
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                setTimeout(() => navigate('/login'), 2500);
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

                        {/* ... your form JSX ... */}
                      {/* This part of the code does not need any changes */}

                    </Grid>
                </form>
            </Paper>
        </Layout>
    );
};

export default AddTechnology;
