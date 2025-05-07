"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Grid, Paper, Typography, CircularProgress, TextField, Button,
    InputAdornment, Pagination, Fade, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogContentText, DialogActions, Alert,
    useTheme, useMediaQuery
} from "@mui/material";
import { Search, Add, Edit, Delete, Login as LoginIcon } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";

const API_BASE_URL = "http://192.168.1.148:5001";

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

const getToken = () => {
    return localStorage.getItem("token");
}

const getEvents = async () => {
    const token = getToken();
    if (!token) {
        throw new Error("Authentication token not found. Please log in.");
    }
    const response = await fetch(`${API_BASE_URL}/events`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            console.error("Unauthorized or Forbidden access fetching events.");
            throw new Error("Access Denied. Your session might have expired.");
        }
        throw new Error(`Failed to fetch events (Status: ${response.status})`);
    }
    return await response.json();
}

const deleteEventAPI = async (title, day) => {
    const token = getToken();
    if (!token) {
        throw new Error("Authentication token not found. Please log in.");
    }
    const encodedTitle = encodeURIComponent(title);
    const encodedDay = encodeURIComponent(day);

    const response = await fetch(`${API_BASE_URL}/events/${encodedTitle}/${encodedDay}`, {
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        let errorMsg = "Failed to delete event";
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignore */ }
        if (response.status === 403) {
            errorMsg = "Permission denied to delete this event.";
        } else if (response.status === 401) {
            errorMsg = "Authentication failed. Please log in again.";
        }
        throw new Error(errorMsg);
    }
    return await response.json().catch(() => ({ message: "Event deleted successfully" }));
}

const Events = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [userRole, setUserRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem("eventsSearchQuery") || "");
    const [page, setPage] = useState(() => Number(localStorage.getItem("eventsPage")) || 1);
    const perPage = 9;

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    useEffect(() => {
        const token = getToken();
        const userInfo = getUserInfo();
        if (token && userInfo && userInfo.role) {
            setUserRole(userInfo.role);
            setIsAuthenticated(true);
            setLoading(true);
        } else {
            setIsAuthenticated(false);
            setUserRole(null);
            setLoading(false);
            setData([]);
            localStorage.removeItem("eventsData");
            console.warn("User not authenticated or role missing for Events page.");
        }
    }, []);

    const getAllEvents = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await getEvents();
            if (Array.isArray(res)) {
                setData(res);
                localStorage.setItem("eventsData", JSON.stringify(res));
            } else {
                console.error("Received unexpected data format for events:", res);
                setData([]);
                setError("Received invalid data format for events.");
            }
        } catch (err) {
            console.error("Error fetching events:", err);
            setError(err.message || "Could not fetch events.");
            setData([]);
            if (err.message.includes("Access Denied") || err.message.includes("token not found")) {
                setIsAuthenticated(false);
                setUserRole(null);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                localStorage.removeItem("eventsData");
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            getAllEvents();
        }
    }, [isAuthenticated, getAllEvents]);

    useEffect(() => {
        localStorage.setItem("eventsSearchQuery", searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        localStorage.setItem("eventsPage", String(page));
    }, [page]);

    const filteredData = data.filter((item) => {
        const lowerQuery = searchQuery.toLowerCase();
        if (!item?.title) return !searchQuery; // Show all if query is empty, otherwise filter
        return item.title.toLowerCase().includes(lowerQuery);
    });

    const totalPages = Math.ceil(filteredData.length / perPage);
    const startIndex = (page - 1) * perPage;
    const currentPageData = filteredData.slice(startIndex, startIndex + perPage);

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo(0, 0);
    };

    const isAdmin = isAuthenticated && userRole === 'admin';

    const requestEditEvent = (event) => {
        if (isAdmin) {
            navigate(`/edit-event/${encodeURIComponent(event.title)}/${encodeURIComponent(event.day)}`);
        } else {
            toast.error("Permission denied. Employees cannot edit events.", { position: "top-center" });
        }
    };

    const requestDeleteEvent = (event) => {
        if (!isAdmin) {
            toast.error("Permission denied. Only Admins can delete events.", { position: "top-center" });
            return;
        }
        setEventToDelete(event);
        setOpenDeleteDialog(true);
    };

    const confirmDeleteEvent = async () => {
        if (!eventToDelete || !isAuthenticated || !isAdmin) { // Extra check for isAdmin
             toast.error("Action not allowed or event not selected.", { position: "top-center" });
             setOpenDeleteDialog(false);
             setEventToDelete(null);
             return;
        }

        try {
            const result = await deleteEventAPI(eventToDelete.title, eventToDelete.day);
            toast.success(result.message || "Event deleted successfully!", { position: "top-center" });
            getAllEvents();
            if (currentPageData.length === 1 && page > 1) {
                setPage(page - 1);
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error(`Error deleting event: ${error.message}`, { position: "top-center" });
            if (error.message.includes("Access Denied") || error.message.includes("token not found") || error.message.includes("Authentication failed")) {
                setIsAuthenticated(false);
                setUserRole(null);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                localStorage.removeItem("eventsData");
                setData([]);
            }
        } finally {
            setOpenDeleteDialog(false);
            setEventToDelete(null);
        }
    };

    const cancelDeleteEvent = () => {
        setOpenDeleteDialog(false);
        setEventToDelete(null);
    };

    if (!loading && !isAuthenticated) {
        return (
            <Layout title="Events - Login Required">
                <ToastContainer position="top-center" autoClose={3000} />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 150px)', p: 2 }}>
                    <Alert severity="warning" sx={{ mb: 3, width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                        You need to be logged in to manage events.
                        {error && <Typography variant="caption" display="block" sx={{ mt: 1 }}>({error})</Typography>}
                    </Alert>
                    <Button variant="contained" startIcon={<LoginIcon />} onClick={() => navigate('/login')}>
                        Go to Login
                    </Button>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout title="Events Management">
            <ToastContainer position="top-center" autoClose={3000} />

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5, color: "#1e293b" }}>
                    Events Calendar
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Explore, add, and manage upcoming events {userRole ? `(Access: ${userRole.replace('_', ' ')})` : ''}
                </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3, alignItems: "center" }}>
                <Paper
                    component="form"
                    onSubmit={(e) => e.preventDefault()}
                    sx={{
                        p: "2px 4px", display: "flex", alignItems: "center", borderRadius: "8px",
                        boxShadow: theme.shadows[1], flexGrow: 1, border: `1px solid ${theme.palette.divider}`,
                        "&:hover": { boxShadow: theme.shadows[2] }, height: 48
                    }}
                >
                    <IconButton sx={{ p: "10px" }} aria-label="search"> <Search /> </IconButton>
                    <TextField
                        fullWidth placeholder="Search events by title..." variant="standard"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        InputProps={{ disableUnderline: true, sx: {fontSize: '0.95rem'} }}
                        aria-label="Search events"
                    />
                </Paper>
                <Button
                    variant="contained" startIcon={<Add />} onClick={() => navigate("/add-event")}
                    aria-label="Add New Event"
                    sx={{
                        height: 48, borderRadius: "8px", bgcolor: "#0f172a", color: "white",
                        px: 3, whiteSpace: "nowrap", textTransform: 'none', fontWeight: 500,
                        "&:hover": { bgcolor: "#1e293b", transform: "translateY(-1px)" },
                        transition: "all 0.2s ease-in-out", flexShrink: 0
                    }}
                >
                    Add Event
                </Button>
            </Box>

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                    <CircularProgress size={50} />
                </Box>
            )}

            {!loading && error && (
                 <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {error} <Button size="small" onClick={getAllEvents} sx={{ml:1}}>Retry</Button>
                </Alert>
            )}

            {!loading && !error && isAuthenticated && (
                <Fade in={true} timeout={500}>
                    <Box>
                        {currentPageData.length > 0 ? (
                            <Grid container spacing={isMobile ? 2 : 3}>
                                {currentPageData.map((event) => (
                                    <Grid item xs={12} sm={6} md={4} key={event._id || `${event.title}-${event.day}`}>
                                        <Paper
                                            elevation={2}
                                            sx={{
                                                p: 2.5, borderRadius: "12px", height: '100%',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                                border: `1px solid ${theme.palette.divider}`,
                                                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                                                "&:hover": {
                                                    boxShadow: theme.shadows[6], transform: "translateY(-4px)",
                                                    "& .event-actions": { opacity: 1, transform: "translateY(0)" }
                                                },
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary", mb: 1, overflowWrap: 'break-word' }}>
                                                    {event.title || "Untitled Event"}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    <strong>Date:</strong> {event.month} {event.day}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    <strong>Time:</strong> {event.time || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    <strong>Location:</strong> {event.location || 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {event.description || 'No description available.'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {event.registration && event.registration !== "N/A" && (
                                                     <Button variant="outlined" size="small" href={event.registration.startsWith('http') ? event.registration : `http://${event.registration}`} target="_blank" rel="noopener noreferrer" sx={{ mr: 'auto', textTransform:'none', fontSize:'0.75rem', py:0.5, px:1 }}>
                                                        Register
                                                    </Button>
                                                )}
                                                {isAdmin && (
                                                    <Box className="event-actions" sx={{ display: 'flex', gap: 0.5, opacity: {xs: 1, sm: 0}, transition: "opacity 0.2s, transform 0.2s", transform: {xs: "translateY(0)", sm:"translateY(5px)"} }}>
                                                        <Tooltip title="Edit Event">
                                                            <IconButton size="small" onClick={() => requestEditEvent(event)} sx={{ '&:hover': { color: 'primary.main' }}}>
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Event">
                                                            <IconButton size="small" onClick={() => requestDeleteEvent(event)} sx={{ '&:hover': { color: 'error.main' }}}>
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Paper sx={{ p: {xs:2, sm:4}, borderRadius: 2, textAlign: "center", mt: 4, border: `1px dashed ${theme.palette.divider}` }}>
                                <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}> No events found </Typography>
                                <Typography variant="body2" color="text.secondary"> {searchQuery ? 'Try adjusting your search query.' : 'No events available. Add a new event to get started.'} </Typography>
                            </Paper>
                        )}

                        {totalPages > 1 && (
                            <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
                                <Pagination
                                    count={totalPages} page={page} onChange={handlePageChange}
                                    color="primary" size={isMobile ? "small" : "medium"} shape="rounded"
                                />
                            </Box>
                        )}
                    </Box>
                </Fade>
            )}

            <Dialog
                open={openDeleteDialog} onClose={cancelDeleteEvent}
                PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontSize: "1.15rem" }}>
                    Confirm Event Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{fontSize: "0.95rem"}}>
                        Are you sure you want to delete the event titled "<strong>{eventToDelete?.title}</strong>" on {eventToDelete?.month} {eventToDelete?.day}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ pb: 2, px: 2.5 }}>
                    <Button onClick={cancelDeleteEvent} sx={{textTransform:'none'}}>Cancel</Button>
                    <Button onClick={confirmDeleteEvent} color="error" variant="contained" sx={{textTransform:'none'}} autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    )
}

export default Events;