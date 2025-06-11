"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    TextField, Button, Paper, Grid, Typography, CircularProgress,
    useTheme, Radio, RadioGroup, FormControlLabel, FormControl,
    FormLabel, Alert, Box
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";

const API_BASE_URL = "https://otmt.iiitd.edu.in/api";

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

const EditEvents = () => {
    const { title: originalTitleParam, day: originalDayParam } = useParams();
    const originalTitle = decodeURIComponent(originalTitleParam);
    const originalDay = decodeURIComponent(originalDayParam);

    const navigate = useNavigate();
    const theme = useTheme();

    const [userInfo, setUserInfo] = useState(() => getUserInfoFromStorage());
    const [isPageAccessible, setIsPageAccessible] = useState(false);
    const [loadingPage, setLoadingPage] = useState(true);
    const [pageError, setPageError] = useState(null);


    const [eventData, setEventData] = useState({
        title: "", month: "", day: "", location: "", time: "",
        description: "", registration: "", isActive: "true",
    });
    const [loadingData, setLoadingData] = useState(true); // For loading event data specifically
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});


    const canUserEditEvent = useMemo(() => {
        return userInfo?.editEvent || userInfo?.role === 'superAdmin';
    }, [userInfo]);

    const loadEvent = useCallback(async () => {
        if (!canUserEditEvent) { // Should be caught by useEffect, but as a safeguard
            setPageError("Access Denied: You do not have permission to edit events.");
            setIsPageAccessible(false);
            setLoadingData(false);
            setLoadingPage(false); // Ensure main page loading also stops
            return;
        }

        setLoadingData(true);
        setPageError(null);
        const token = getTokenFromStorage();

        // Token check already happened in parent useEffect, but good for direct calls
        if (!token) {
            setPageError("Authentication required. Please log in.");
            setLoadingData(false);
            setIsPageAccessible(false);
            toast.error("Authentication required. Redirecting to login...", { position: "top-center", autoClose: 2000 });
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        try {
            const encodedTitle = encodeURIComponent(originalTitle);
            const encodedDay = encodeURIComponent(originalDay);
            const res = await fetch(
                `${API_BASE_URL}/events/${encodedTitle}/${encodedDay}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) {
                let errorMsg = `HTTP error! status: ${res.status}`;
                const errorData = await res.json().catch(() => null);
                if (res.status === 404) {
                    errorMsg = "Event not found.";
                } else if (res.status === 401 || res.status === 403) {
                    errorMsg = errorData?.message || "Access Denied loading event. Your session might have expired.";
                    localStorage.removeItem("user"); localStorage.removeItem("token");
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    errorMsg = errorData?.message || errorMsg;
                }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            setEventData({
                ...data,
                isActive: String(data.isActive ?? true)
            });
            setIsPageAccessible(true);
        } catch (err) {
            console.error("Error loading event:", err);
            setPageError(err.message || "Failed to load event data.");
            toast.error(err.message || "Failed to load event data.", { position: "top-center" });
            setIsPageAccessible(false);
        } finally {
            setLoadingData(false);
            setLoadingPage(false); // Ensure page loading is set to false
        }
    }, [originalTitle, originalDay, navigate, canUserEditEvent]); // Added canUserEditEvent

    useEffect(() => {
        const currentUserInfo = getUserInfoFromStorage();
        const token = getTokenFromStorage();

        if (currentUserInfo && token) {
            setUserInfo(currentUserInfo);
            // The next useEffect will handle permission check and data loading
        } else {
            setPageError("Authentication required to edit this page.");
            toast.error("Authentication required. Redirecting to login...", { position: "top-center", autoClose: 2000 });
            setIsPageAccessible(false);
            setLoadingPage(false);
            setTimeout(() => navigate('/login'), 2100);
        }
    }, [navigate]);

    useEffect(() => {
        if (userInfo) { // Only proceed if userInfo is loaded
            if (canUserEditEvent) {
                setIsPageAccessible(true); // Tentatively set accessible
                loadEvent(); // Load event data if permission is there
            } else {
                setPageError("Access Denied: You do not have permission to edit events.");
                toast.error("Access Denied: Insufficient permissions.", { position: "top-center" });
                setIsPageAccessible(false);
                setLoadingPage(false);
                setTimeout(() => navigate('/admin-events'), 3000);
            }
        }
        // setLoadingPage(false) is handled within loadEvent or if permissions are denied
    }, [userInfo, canUserEditEvent, loadEvent, navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (validationErrors.submit) {
            setValidationErrors((prev) => ({ ...prev, submit: "" }));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        if (!eventData.title.trim()) newErrors.title = "Title is required";
        if (!eventData.month.trim()) newErrors.month = "Month is required";
        if (!eventData.day.trim()) newErrors.day = "Day is required";
        if (!eventData.location.trim()) newErrors.location = "Location is required";
        if (!eventData.time.trim()) newErrors.time = "Time is required";
        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canUserEditEvent) {
            toast.error("Permission Denied. You cannot update events.");
            return;
        }
        if (!validateForm()) {
            toast.warn("Please fill in all required fields.", { position: "top-center" });
            return;
        }

        setPageError(null);
        setIsSubmitting(true);
        const token = getTokenFromStorage();

        if (!token) {
            setPageError("Authentication required. Please log in.");
            setIsSubmitting(false);
            toast.error("Authentication required. Cannot save changes.", { position: "top-center" });
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        const dataToSend = {
            ...eventData,
            isActive: eventData.isActive === "true",
        };

        try {
            const encodedOriginalTitle = encodeURIComponent(originalTitle);
            const encodedOriginalDay = encodeURIComponent(originalDay);

            const res = await fetch(
                `${API_BASE_URL}/events/${encodedOriginalTitle}/${encodedOriginalDay}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(dataToSend),
                }
            );

            if (!res.ok) {
                let errorMsg = `Failed to update event. Status: ${res.status}`;
                const errorData = await res.json().catch(() => null);
                errorMsg = errorData?.message || errorMsg;
                
                if (res.status === 401 || res.status === 403) {
                    errorMsg = errorData?.message || "Access Denied or Session Expired. Please log in again.";
                    localStorage.removeItem("user"); localStorage.removeItem("token");
                    setTimeout(() => navigate('/login'), 2000);
                } else if (res.status === 404) {
                    errorMsg = "Event not found for update.";
                } else if (res.status === 409) {
                    errorMsg = errorData?.message || "Update conflict. The event title and day might already exist for another event.";
                }
                throw new Error(errorMsg);
            }
            toast.success("Event updated successfully!", { position: "top-center" });
            setTimeout(() => navigate("/admin-events"), 1000);

        } catch (err) {
            console.error("Error updating event:", err);
            setPageError(err.message || "Error updating event. Please check details and try again.");
            toast.error(err.message || "Error updating event.", { position: "top-center" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingPage || (isPageAccessible && loadingData)) {
        return (
            <Layout title="Loading Event...">
                <ToastContainer position="top-center" autoClose={3000} />
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 200px)', p: 3 }}>
                    <CircularProgress />
                    <Typography sx={{ml: 2}}>Loading event details...</Typography>
                </Box>
            </Layout>
        );
    }

    if (!isPageAccessible) {
        return (
            <Layout title="Access Denied">
                <ToastContainer position="top-center" autoClose={3000} />
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center', margin: "20px auto", maxWidth: '600px' }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {pageError || "You do not have permission to access this page."}
                    </Alert>
                    <Button variant="outlined" onClick={() => navigate(pageError && (pageError.includes("login") || pageError.includes("Authentication")) ? '/login' : '/admin-events')} sx={{ mr: 1 }}>
                         {pageError && (pageError.includes("login") || pageError.includes("Authentication")) ? 'Go to Login' : 'Back to Events'}
                    </Button>
                </Paper>
            </Layout>
        );
    }

    return (
        <Layout title={`Edit Event: ${originalTitle}`}>
            <ToastContainer position="top-center" autoClose={3000} />
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, margin: "20px auto", maxWidth: '800px' }}>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}
                >
                    Edit Event Details
                </Typography>
                <form onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                label="Title"
                                name="title"
                                fullWidth
                                value={eventData.title || ""}
                                onChange={handleChange}
                                error={Boolean(validationErrors.title)}
                                helperText={validationErrors.title || " "}
                                disabled={isSubmitting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                required
                                label="Month"
                                name="month"
                                fullWidth
                                value={eventData.month || ""}
                                onChange={handleChange}
                                error={Boolean(validationErrors.month)}
                                helperText={validationErrors.month || "e.g., January, Feb"}
                                disabled={isSubmitting}
                            />
                        </Grid>
                         <Grid item xs={12} sm={3}>
                            <TextField
                                required
                                label="Day"
                                name="day"
                                fullWidth
                                value={eventData.day || ""}
                                onChange={handleChange}
                                error={Boolean(validationErrors.day)}
                                helperText={validationErrors.day || "e.g., 01, 15, 31"}
                                disabled={isSubmitting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                label="Location"
                                name="location"
                                fullWidth
                                value={eventData.location || ""}
                                onChange={handleChange}
                                error={Boolean(validationErrors.location)}
                                helperText={validationErrors.location || " "}
                                disabled={isSubmitting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                label="Time"
                                name="time"
                                fullWidth
                                value={eventData.time || ""}
                                onChange={handleChange}
                                error={Boolean(validationErrors.time)}
                                helperText={validationErrors.time || "e.g., 10:00 AM - 02:00 PM"}
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
                                value={eventData.description || ""}
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
                                value={eventData.registration || ""}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                helperText=" "
                            />
                        </Grid>

                        {validationErrors.submit && ( // Changed from errors.submit to validationErrors.submit
                            <Grid item xs={12}>
                                <Typography color="error" align="center" variant="body2">
                                    {validationErrors.submit}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isSubmitting || !canUserEditEvent} // Disable if no permission
                                sx={{
                                    borderRadius: 2, py: 1.5, px: 4, minWidth: 150,
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                    background: "linear-gradient(45deg, #1e293b, #0f172a)",
                                    color: "white", transition: "all 0.3s", position: 'relative',
                                    "&:hover": {
                                        boxShadow: "0 6px 8px rgba(0, 0, 0, 0.2)",
                                        transform: "translateY(-2px)",
                                        background: "linear-gradient(45deg, #0f172a, #1e293b)",
                                    },
                                    '&.Mui-disabled': { background: theme.palette.action.disabledBackground, color: theme.palette.action.disabled }
                                }}
                            >
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
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

export default EditEvents;
