"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    TextField, Button, Paper, Grid, Typography, Box, Radio,
    RadioGroup, FormControlLabel, FormControl, FormLabel, CircularProgress, Alert,
    useTheme // Added useTheme
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";
// Assuming firebase.js is in src/ and this file is in src/pages/
// import { auth } from "../firebase"; // auth is not directly used here

const API_BASE_URL = "/api";

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

const addEventAPI = async (newEventData) => {
    const token = getTokenFromStorage();
    if (!token) {
        throw new Error("Authentication token not found. Please log in.");
    }

    // Client-side permission check (UX improvement, server enforces actual security)
    const currentUserInfo = getUserInfoFromStorage();
    if (!(currentUserInfo?.addEvent || currentUserInfo?.role === 'superAdmin')) {
        throw new Error("Permission Denied: You are not authorized to add events.");
    }
    
    const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEventData),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        console.error("Failed to add event. Status:", response.status, "Body:", errorBody);
        throw new Error(errorBody.message || `Failed to add event. Status: ${response.status}`);
    }
    return await response.json();
};


const AddEvents = () => {
    const navigate = useNavigate();
    const theme = useTheme(); // Added useTheme

    const [userInfo, setUserInfo] = useState(() => getUserInfoFromStorage());
    const [isPageAccessible, setIsPageAccessible] = useState(false);
    const [loadingPage, setLoadingPage] = useState(true);
    const [pageError, setPageError] = useState(null);

    const [eventData, setEventData] = useState({
        title: "",
        month: "",
        day: "",
        location: "",
        time: "",
        description: "",
        registration: "",
        isActive: "true", // Default to true (Upcoming)
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canUserAddEvent = useMemo(() => {
        return userInfo?.addEvent || userInfo?.role === 'superAdmin';
    }, [userInfo]);

    useEffect(() => {
        const currentUserInfo = getUserInfoFromStorage();
        const token = getTokenFromStorage();

        if (currentUserInfo && token) {
            setUserInfo(currentUserInfo); // Set userInfo for canUserAddEvent to use
            // Permission check will be done in the next effect that depends on canUserAddEvent
        } else {
            toast.error("Authentication required. Redirecting to login.", { position: "top-center", autoClose: 2000 });
            setPageError("Authentication required.");
            setIsPageAccessible(false);
            setLoadingPage(false);
            setTimeout(() => navigate('/login'), 2100);
        }
    }, [navigate]);

    useEffect(() => {
        if (userInfo) { // This effect runs once userInfo is set
            if (canUserAddEvent) {
                setIsPageAccessible(true);
            } else {
                setPageError("Access Denied: You do not have permission to add events.");
                toast.error("Access Denied: Insufficient permissions.", { position: "top-center" });
                setIsPageAccessible(false);
                setTimeout(() => navigate('/admin-dashboard'), 3000);
            }
        }
        // Only set loadingPage to false after permission check is done based on userInfo
        if (userInfo !== null) { // Check if userInfo has been attempted to be loaded
             setLoadingPage(false);
        }
    }, [userInfo, canUserAddEvent, navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData({ ...eventData, [name]: value });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (errors.submit) {
            setErrors((prev) => ({ ...prev, submit: "" }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!eventData.title.trim()) newErrors.title = "Title is required";
        if (!eventData.month.trim()) newErrors.month = "Month is required";
        if (!eventData.day.trim()) newErrors.day = "Day is required";
        if (!eventData.location.trim()) newErrors.location = "Location is required";
        if (!eventData.time.trim()) newErrors.time = "Time is required";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canUserAddEvent) {
            toast.error("Permission Denied. You cannot add events.");
            return;
        }
        setErrors({});

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.warn("Please fill in all required fields.", { position: "top-center" });
            return;
        }

        setIsSubmitting(true);

        const dataToSend = {
            ...eventData,
            isActive: eventData.isActive === "true",
        };

        try {
            await addEventAPI(dataToSend);
            toast.success("Event added successfully!", { position: "top-center" });
            setEventData({
                title: "", month: "", day: "", location: "", time: "",
                description: "", registration: "", isActive: "true",
            });
            setErrors({});
            setTimeout(() => navigate("/admin-events"), 1000);
        } catch (error) {
            console.error("Error creating event", error);
            let errorMsg = "Failed to create event. Please try again.";
            // error.response might not exist if using fetch directly, error itself is the response or network error
            if (error.message) {
                errorMsg = error.message;
            }
            
            if (errorMsg.includes("Access Denied") || errorMsg.includes("token not found") || errorMsg.includes("Authentication failed")) {
                 localStorage.removeItem("user");
                 localStorage.removeItem("token");
                 setTimeout(() => navigate('/login'), 2000);
            }
            setErrors({ submit: errorMsg });
            toast.error(errorMsg, { position: "top-center" });
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
        <Layout title="Add New Event">
            <ToastContainer position="top-center" autoClose={3000} />
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, margin: "20px auto", maxWidth: '800px' }}>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}
                >
                    Add New Event
                </Typography>
                <form onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                label="Title"
                                name="title"
                                fullWidth
                                value={eventData.title}
                                onChange={handleChange}
                                error={Boolean(errors.title)}
                                helperText={errors.title || " "}
                                disabled={isSubmitting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                required
                                label="Month"
                                name="month"
                                fullWidth
                                value={eventData.month}
                                onChange={handleChange}
                                error={Boolean(errors.month)}
                                helperText={errors.month || "e.g., January, Feb"}
                                disabled={isSubmitting}
                            />
                        </Grid>
                         <Grid item xs={12} sm={3}>
                            <TextField
                                required
                                label="Day"
                                name="day"
                                fullWidth
                                value={eventData.day}
                                onChange={handleChange}
                                error={Boolean(errors.day)}
                                helperText={errors.day || "e.g., 01, 15, 31"}
                                disabled={isSubmitting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                label="Location"
                                name="location"
                                fullWidth
                                value={eventData.location}
                                onChange={handleChange}
                                error={Boolean(errors.location)}
                                helperText={errors.location || " "}
                                disabled={isSubmitting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                label="Time"
                                name="time"
                                fullWidth
                                value={eventData.time}
                                onChange={handleChange}
                                error={Boolean(errors.time)}
                                helperText={errors.time || "e.g., 10:00 AM - 02:00 PM"}
                                disabled={isSubmitting}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl component="fieldset" disabled={isSubmitting}>
                                <FormLabel component="legend">Event Status</FormLabel>
                                <RadioGroup
                                    row
                                    aria-label="status"
                                    name="isActive"
                                    value={eventData.isActive}
                                    onChange={handleChange}
                                >
                                    <FormControlLabel value="true" control={<Radio />} label="Upcoming" />
                                    <FormControlLabel value="false" control={<Radio />} label="Past" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                name="description"
                                fullWidth
                                multiline
                                rows={3}
                                value={eventData.description}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                helperText=" "
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Registration Link (Optional)"
                                name="registration"
                                type="url"
                                fullWidth
                                value={eventData.registration}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                helperText=" "
                            />
                        </Grid>

                        {errors.submit && (
                            <Grid item xs={12}>
                                <Typography color="error" align="center" variant="body2">
                                    {errors.submit}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    px: 4,
                                    minWidth: 150,
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                    background: "linear-gradient(45deg, #1e293b, #0f172a)",
                                    color: "white",
                                    transition: "all 0.3s",
                                    position: 'relative',
                                    "&:hover": {
                                        boxShadow: "0 6px 8px rgba(0, 0, 0, 0.2)",
                                        transform: "translateY(-2px)",
                                        background: "linear-gradient(45deg, #0f172a, #1e293b)",
                                    },
                                    '&.Mui-disabled': {
                                        background: (theme) => theme.palette.action.disabledBackground,
                                        color: (theme) => theme.palette.action.disabled
                                    }
                                }}
                            >
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Add Event"}
                            </Button>
                             <Button
                                variant="outlined"
                                size="large"
                                onClick={() => navigate("/admin-events")}
                                disabled={isSubmitting}
                                sx={{ ml: 2, py: 1.5, px: 4, borderRadius: 2 }}
                            >
                                Cancel
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Layout>
    );
};

export default AddEvents;
