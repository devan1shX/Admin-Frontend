"use client";

import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Paper,
  Grid,
  Typography,
  Box,
  Radio, // Import Radio
  RadioGroup, // Import RadioGroup
  FormControlLabel, // Import FormControlLabel
  FormControl, // Import FormControl
  FormLabel, // Import FormLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";

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
    isActive: "true", // Default to 'true' (string for radio group value)
  });

  // To store error messages for required fields
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });

    // Clear error message for the field when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate required fields
  const validate = () => {
    const newErrors = {};
    if (!eventData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!eventData.month.trim()) {
      newErrors.month = "Month is required";
    }
    if (!eventData.day.trim()) {
      newErrors.day = "Day is required";
    }
    if (!eventData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!eventData.time.trim()) {
      newErrors.time = "Time is required";
    }
    // isActive always has a value ('true' or 'false'), so no validation needed unless specifically required.
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validations before submission
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Prepare data for API: Convert isActive string ('true'/'false') to boolean
    const dataToSend = {
      ...eventData,
      isActive: eventData.isActive === "true", // Convert to boolean
    };

    try {
      // Use the consistent API endpoint
      const response = await axios.post("http://192.168.1.148:5001/events", dataToSend);
      console.log("Event created:", response.data);
      // Reset the form after successful submission
      setEventData({
        title: "",
        month: "",
        day: "",
        location: "",
        time: "",
        description: "",
        registration: "",
        isActive: "true", // Reset to default
      });
      setErrors({});
      // Redirect to home page (or events page) after adding the event
      navigate("/"); // Or navigate("/events");
    } catch (error) {
      console.error("Error creating event", error);
      // Optionally, display a global error message to the user
      setErrors({ submit: "Failed to create event. Please try again." });
    }
  };

  return (
    <Layout title="Add Event">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, margin: "20px auto" }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}
        >
          Add Event
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* ... other TextField Grid items ... */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Title"
                name="title"
                fullWidth
                value={eventData.title}
                onChange={handleChange}
                error={Boolean(errors.title)}
                helperText={errors.title}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Month"
                name="month"
                fullWidth
                value={eventData.month}
                onChange={handleChange}
                error={Boolean(errors.month)}
                helperText={errors.month}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Day"
                name="day"
                fullWidth
                value={eventData.day}
                onChange={handleChange}
                error={Boolean(errors.day)}
                helperText={errors.day}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                name="location"
                fullWidth
                value={eventData.location}
                onChange={handleChange}
                error={Boolean(errors.location)}
                helperText={errors.location}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Time"
                name="time"
                fullWidth
                value={eventData.time}
                onChange={handleChange}
                error={Boolean(errors.time)}
                helperText={errors.time}
              />
            </Grid>

            {/* isActive Radio Button Group */}
             <Grid item xs={12} sm={6}> {/* Place it alongside Time or adjust layout */}
               <FormControl component="fieldset">
                 <FormLabel component="legend">Status</FormLabel>
                 <RadioGroup
                   row // Display radio buttons in a row
                   aria-label="status"
                   name="isActive"
                   value={eventData.isActive} // Bind to state (string 'true' or 'false')
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
                value={eventData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Registration Link (Optional)" // Clarify optional
                name="registration"
                fullWidth
                value={eventData.registration}
                onChange={handleChange}
              />
            </Grid>

             {/* Display submit error if any */}
             {errors.submit && (
               <Grid item xs={12}>
                 <Typography color="error" align="center">
                   {errors.submit}
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
                Add Event
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default AddEvents;