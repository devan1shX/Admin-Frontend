"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    TextField, Button, Paper, Grid, Typography, Box, Radio,
    RadioGroup, FormControlLabel, FormControl, FormLabel, CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";

const API_BASE_URL = "http://192.168.1.148:5001";

const getToken = () => {
    return localStorage.getItem("token");
};

const AddEvents = () => {
    const navigate = useNavigate();
    const [eventData, setEventData] = useState({
        title: "",
        month: "",
        day: "",
        location: "",
        time: "",
        description: "",
        registration: "",
        isActive: "true",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            toast.error("Authentication required. Redirecting to login...", { position: "top-center", autoClose: 2000 });
            // setTimeout(() => navigate('/login'), 2000); // Optional: redirect if not authenticated
        }
    }, [navigate]);

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
        setErrors({});

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.warn("Please fill in all required fields.", { position: "top-center" });
            return;
        }

        const token = getToken();
        if (!token) {
            toast.error("Authentication required. Please log in again.", { position: "top-center" });
            setErrors({ submit: "Authentication required." });
            // setTimeout(() => navigate('/login'), 2000); // Optional: redirect
            return;
        }

        setIsSubmitting(true);

        const dataToSend = {
            ...eventData,
            isActive: eventData.isActive === "true",
        };

        try {
            const response = await axios.post(`${API_BASE_URL}/events`, dataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Event created:", response.data);
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
            if (error.response) {
                console.error("Error data:", error.response.data);
                console.error("Error status:", error.response.status);
                errorMsg = error.response.data?.message || errorMsg;
                if (error.response.status === 409) {
                    errorMsg = error.response.data?.message || "An event with this title and day already exists.";
                } else if (error.response.status === 401 || error.response.status === 403) {
                    errorMsg = "Authentication failed or session expired. Please log in again.";
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    // setTimeout(() => navigate('/login'), 2000); // Optional: redirect
                }
            } else if (error.request) {
                console.error("Error request:", error.request);
                errorMsg = "Network error. Could not connect to the server.";
            } else {
                console.error('Error message:', error.message);
            }
            setErrors({ submit: errorMsg });
            toast.error(errorMsg, { position: "top-center" });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                helperText={errors.month || " "}
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
                                helperText={errors.day || " "}
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
                                helperText={errors.time || " "}
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