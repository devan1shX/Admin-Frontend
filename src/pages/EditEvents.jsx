"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    TextField, Button, Paper, Grid, Typography, CircularProgress,
    useTheme, Radio, RadioGroup, FormControlLabel, FormControl,
    FormLabel, Alert
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";

const API_BASE_URL = "http://192.168.1.148:5001";

const getToken = () => {
    return localStorage.getItem("token");
};

const getUserInfo = () => {
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


const EditEvents = () => {
    const { title: originalTitle, day: originalDay } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();

    const [eventData, setEventData] = useState({
        title: "", month: "", day: "", location: "", time: "",
        description: "", registration: "", isActive: "true",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPageAccessible, setIsPageAccessible] = useState(false);


    const loadEvent = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            setError("Authentication required. Please log in.");
            setLoading(false);
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
                if (res.status === 404) {
                    errorMsg = "Event not found.";
                } else if (res.status === 401 || res.status === 403) {
                    errorMsg = "Access Denied loading event. Your session might have expired.";
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    setTimeout(() => navigate('/login'), 2000);
                }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            setEventData({
                ...data,
                isActive: String(data.isActive ?? true)
            });
            setIsPageAccessible(true); // Explicitly set page accessible after successful load by admin
        } catch (err) {
            console.error("Error loading event:", err);
            setError(err.message || "Failed to load event data.");
            toast.error(err.message || "Failed to load event data.", { position: "top-center" });
            setIsPageAccessible(false); // Deny access on error
        } finally {
            setLoading(false);
        }
    }, [originalTitle, originalDay, navigate]);

    useEffect(() => {
        const token = getToken();
        const userInfo = getUserInfo();

        if (token && userInfo && userInfo.role) {
            if (userInfo.role === 'admin') {
                loadEvent(); 
            } else {
                setError("Access Denied: You do not have permission to edit events.");
                toast.error("Access Denied: You do not have permission to edit events.", { position: "top-center" });
                setLoading(false);
                setIsPageAccessible(false);
                setTimeout(() => navigate('/admin-events'), 2000);
            }
        } else {
            setError("Authentication required to edit this page.");
            toast.error("Authentication required. Redirecting to login...", { position: "top-center" });
            setLoading(false);
            setIsPageAccessible(false);
            setTimeout(() => navigate('/login'), 2000);
        }
    }, [navigate, loadEvent]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        const token = getToken();

        if (!token) {
            setError("Authentication required. Please log in.");
            setIsSubmitting(false);
            toast.error("Authentication required. Cannot save changes.", { position: "top-center" });
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        const dataToSend = {
            ...eventData,
            isActive: eventData.isActive === "true",
        };

        if (!dataToSend.title || !dataToSend.month || !dataToSend.day) {
            toast.error("Title, Month, and Day are required.", { position: "top-center" });
            setError("Title, Month, and Day are required.");
            setIsSubmitting(false);
            return;
        }

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
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorMsg;
                } catch { /* Ignore if not JSON */ }

                if (res.status === 401 || res.status === 403) {
                    errorMsg = "Access Denied or Session Expired. Please log in again.";
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    setTimeout(() => navigate('/login'), 2000);
                } else if (res.status === 404) {
                    errorMsg = "Event not found for update.";
                }
                throw new Error(errorMsg);
            }
            toast.success("Event updated successfully!", { position: "top-center" });
            setTimeout(() => navigate("/admin-events"), 1000);

        } catch (err) {
            console.error("Error updating event:", err);
            setError(err.message || "Error updating event. Please check details and try again.");
            toast.error(err.message || "Error updating event.", { position: "top-center" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Loading Event...">
                <Grid container justifyContent="center" sx={{ p: 4, minHeight: 'calc(100vh - 200px)', alignItems: 'center' }}>
                    <CircularProgress />
                     <Typography sx={{ml: 2}}>Loading event details...</Typography>
                </Grid>
            </Layout>
        );
    }

    if (!isPageAccessible || error) {
        return (
            <Layout title="Error">
                <ToastContainer position="top-center" autoClose={3000} />
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center', margin: "20px auto", maxWidth: '600px' }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error || "Access to this page is restricted."}
                    </Alert>
                    <Button variant="outlined" onClick={() => navigate( error && (error.includes("login") || error.includes("Authentication")) ? '/login' : '/admin-events')} sx={{ mr: 1 }}>
                         {error && (error.includes("login") || error.includes("Authentication")) ? 'Go to Login' : 'Back to Events'}
                    </Button>
                    {isPageAccessible && error && !error.toLowerCase().includes("access denied") && !error.toLowerCase().includes("authentication required") && (
                         <Button variant="contained" onClick={loadEvent}>Try Again</Button>
                    )}
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
                                disabled={isSubmitting}
                                error={!eventData.title && !!error} 
                                helperText={!eventData.title && !!error ? "Title is required" : " "}
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
                                disabled={isSubmitting}
                                error={!eventData.month && !!error}
                                helperText={!eventData.month && !!error ? "Month is required" : " "}
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
                                disabled={isSubmitting}
                                error={!eventData.day && !!error}
                                helperText={!eventData.day && !!error ? "Day is required" : " "}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Location"
                                name="location"
                                fullWidth
                                value={eventData.location || ""}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                helperText=" "
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Time"
                                name="time"
                                fullWidth
                                value={eventData.time || ""}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                helperText=" "
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
                        <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
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
                                    '&.Mui-disabled': { background: theme.palette.action.disabledBackground }
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