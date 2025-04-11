"use client";

import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Paper,
  Grid,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Radio, // Import Radio
  RadioGroup, // Import RadioGroup
  FormControlLabel, // Import FormControlLabel
  FormControl, // Import FormControl
  FormLabel, // Import FormLabel
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "./Layout";

const EditEvents = () => {
  // Extract *original* title and day from URL parameters for fetching
  // Note: If title/day can be edited, using a unique _id in the URL is safer.
  // Assuming title/day are used as identifiers for now.
  const { title: originalTitle, day: originalDay } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [eventData, setEventData] = useState({
    title: "",
    month: "",
    day: "",
    location: "",
    time: "",
    description: "",
    registration: "",
    isActive: "true", // Default state value (string)
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null); // For fetch/update errors

  // Load event details when component mounts
  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setError(null);
      setMessage("");
      try {
        // Use the consistent API endpoint structure for fetching by identifier
        // Make sure your backend route handles GET /events/:title/:day appropriately
        const res = await fetch(
          `http://localhost:5001/events/${encodeURIComponent(originalTitle)}/${encodeURIComponent(originalDay)}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            setMessage("Event not found.");
          } else {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        // Convert fetched boolean isActive to string for RadioGroup value
        setEventData({
            ...data,
            isActive: String(data.isActive) // Convert boolean to 'true' or 'false' string
        });
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event data. Please try again later.");
        setMessage("Error loading event"); // Keep or remove based on preference
      }
      setLoading(false);
    };
    loadEvent();
  }, [originalTitle, originalDay]); // Depend on original identifiers

  // Update form state when inputs change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit updated event data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError(null);

    // Prepare data for API: Convert isActive string back to boolean
    const dataToSend = {
      ...eventData,
      isActive: eventData.isActive === "true", // Convert string 'true'/'false' to boolean
    };

    try {
       // Use the consistent API endpoint structure for updating
       // Make sure your backend route handles PUT /events/:title/:day appropriately
      const res = await fetch(
        `http://192.168.1.148:5001/events/${encodeURIComponent(originalTitle)}/${encodeURIComponent(originalDay)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        }
      );
      if (res.ok) {
        // Redirect to events page after successful update
        navigate("/events"); // Assuming you have an /events route
      } else {
         const errorData = await res.text(); // Get more error details if possible
         console.error("Update failed:", errorData);
        throw new Error(`Failed to update event. Status: ${res.status}`);
      }
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Error updating event. Please check the details and try again.");
      setMessage("Error updating event"); // Keep or remove based on preference
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Event">
        <Grid container justifyContent="center" sx={{ marginTop: "2rem" }}>
          <CircularProgress />
        </Grid>
      </Layout>
    );
  }

   // If event wasn't found or there was a load error initially
   if (!loading && (message === "Event not found." || error)) {
     return (
       <Layout title="Edit Event">
         <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
           <Typography variant="h6" color="error">
             {message || error || "Could not load event data."}
           </Typography>
           <Button onClick={() => navigate('/events')} sx={{ mt: 2 }}>Back to Events</Button>
         </Paper>
       </Layout>
     );
   }


  return (
    <Layout title="Edit Event">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, margin: "20px auto" }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}
        >
          Edit Event
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* ... other TextField Grid items ... */}
            <Grid item xs={12} sm={6}>
               <TextField
                 label="Title"
                 name="title"
                 fullWidth
                 value={eventData.title || ""}
                 onChange={handleChange}
                 // Add error handling if needed
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 label="Month"
                 name="month"
                 fullWidth
                 value={eventData.month || ""}
                 onChange={handleChange}
                 // Add error handling if needed
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 label="Day"
                 name="day"
                 fullWidth
                 value={eventData.day || ""}
                 onChange={handleChange}
                 // Add error handling if needed
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 label="Location"
                 name="location"
                 fullWidth
                 value={eventData.location || ""}
                 onChange={handleChange}
                 // Add error handling if needed
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 label="Time"
                 name="time"
                 fullWidth
                 value={eventData.time || ""}
                 onChange={handleChange}
                 // Add error handling if needed
               />
             </Grid>


            {/* isActive Radio Button Group */}
             <Grid item xs={12} sm={6}> {/* Align with Time field */}
               <FormControl component="fieldset">
                 <FormLabel component="legend">Status</FormLabel>
                 <RadioGroup
                   row
                   aria-label="status"
                   name="isActive"
                   value={eventData.isActive} // Value is 'true' or 'false' string
                   onChange={handleChange}
                 >
                   <FormControlLabel
                     value="true"
                     control={<Radio />}
                     label="Upcoming"
                   />
                   <FormControlLabel
                     value="false"
                     control={<Radio />}
                     label="Past"
                   />
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Registration Link (Optional)"
                name="registration"
                fullWidth
                value={eventData.registration || ""}
                onChange={handleChange}
              />
            </Grid>

            {/* Display Error Messages */}
             {(message || error) && (
               <Grid item xs={12}>
                 <Typography color="error" align="center">
                   {message || error}
                 </Typography>
               </Grid>
             )}

            <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 4,
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  background: "linear-gradient(45deg, #000000, #333333)",
                  color: "white",
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: "0 6px 8px rgba(0, 0, 0, 0.2)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default EditEvents;