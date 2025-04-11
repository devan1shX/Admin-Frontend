"use client"

import { useState, useRef } from "react"
import {
  TextField,
  Button,
  Paper,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Box,
  Card,
  CardMedia,
  Divider, // Added for visual separation
  Switch, // Added for Spotlight
  FormControlLabel // Added for Spotlight Switch label
} from "@mui/material"
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Icon for Add Innovator
import { useNavigate } from "react-router-dom"
import Layout from "./Layout" // Assuming Layout component exists

const API_BASE_URL = "http://192.168.1.148:5001"

// --- addTech function remains the same ---
const addTech = async (newData) => {
  const formData = new FormData()

  // Add all text data to formData
  Object.entries(newData).forEach(([key, value]) => {
    if (key === 'images') {
      // Images are handled separately
    } else if (key === 'innovators') {
      // Match innovators format to the schema structure with name and mail fields
      const formattedInnovators = value.map(inv => ({
        name: inv.name || "",
        mail: inv.mail || ""
      }))
      formData.append(key, JSON.stringify(formattedInnovators))
    } else if (key === 'spotlight') {
       // Ensure boolean is sent correctly if needed by backend, or as string 'true'/'false'
       formData.append(key, String(value)); // Convert boolean to string for FormData
    }
     else {
      // Append other data, stringify objects if necessary (though less likely now)
       formData.append(key, typeof value === 'object' && value !== null && !(value instanceof File) ? JSON.stringify(value) : value);
    }
  })

  // Add images to formData
  if (newData.images && newData.images.length > 0) {
    // Add image files
    newData.images.forEach((image, index) => {
      // Check if file exists before appending
       if (image.file) {
         formData.append('images', image.file)
       }
    })

    // Add image captions as JSON-like structure expected by backend
    const imageCaptions = newData.images.map((img, index) => ({
       [`imageCaptions[${index}]`]: img.caption || ""
    }));
     // Append captions correctly
     newData.images.forEach((img, index) => {
        formData.append(`imageCaptions[${index}]`, img.caption || "");
     });
  }

  console.log("FormData prepared:"); // Debugging: Log FormData contents
  for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
  }


  const response = await fetch(`${API_BASE_URL}/technologies`, {
    method: "POST",
    body: formData, // Don't set Content-Type header when using FormData
  })

  if (!response.ok) {
     const errorBody = await response.text(); // Read error body for more details
     console.error("Failed to add technology. Status:", response.status, "Body:", errorBody);
    throw new Error(`Failed to add technology. Status: ${response.status}`);
  }

  const data = await response.json()
  return { status: response.status, data }
}
// --- End of addTech function ---


const AddTechnology = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const fileInputRef = useRef(null)

  const [addData, setAddData] = useState({
    // id: "", // Added id field for clarity, will be generated if empty
    name: "",
    description: "",
    overview: "",
    detailedDescription: "",
    genre: "",
    // docket: "",
    innovators: [],
    advantages: "",
    applications: "",
    useCases: "",
    relatedLinks: "",
    technicalSpecifications: "",
    trl: "",
    images: [], // Stores { file: File, preview: string, caption: string }
    patent: "",
    spotlight: false // Changed to boolean, default false
  })

  // --- Handler functions remain largely the same ---

  const addInnovator = () => {
    setAddData(prevData => ({
      ...prevData,
      innovators: [...prevData.innovators, { name: "", mail: "" }]
    }))
  }

  const removeInnovator = (index) => {
    setAddData(prevData => {
      const newInnovators = [...prevData.innovators]
      newInnovators.splice(index, 1)
      return { ...prevData, innovators: newInnovators }
    })
  }

  const handleInnovatorChange = (index, field, value) => {
    setAddData(prevData => {
      const newInnovators = [...prevData.innovators]
      newInnovators[index] = { ...newInnovators[index], [field]: value }
      return { ...prevData, innovators: newInnovators }
    })
  }

  const handleAddChange = (e) => {
    const { name, value } = e.target
    setAddData((prevData) => ({ ...prevData, [name]: value }))
  }

  // Specific handler for the Switch component
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setAddData((prevData) => ({ ...prevData, [name]: checked }));
  };


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "" // Empty caption by default
    }))

    setAddData(prevData => ({
      ...prevData,
      images: [...prevData.images, ...newImages]
    }))
     // Reset file input to allow uploading the same file again if needed
     if (fileInputRef.current) {
        fileInputRef.current.value = "";
     }
  }

  const handleImageDelete = (index) => {
    setAddData(prevData => {
      const newImages = [...prevData.images]
      // Make sure to revoke the object URL to free up memory
      if (newImages[index] && newImages[index].preview) {
         URL.revokeObjectURL(newImages[index].preview);
      }
      newImages.splice(index, 1)
      return { ...prevData, images: newImages }
    })
  }

  const handleImageCaptionChange = (index, caption) => {
    setAddData(prevData => {
      const newImages = [...prevData.images]
      newImages[index] = { ...newImages[index], caption }
      return { ...prevData, images: newImages }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const processedData = { ...addData } // Start with current state

    // Trim strings and convert specific fields
    Object.keys(processedData).forEach((key) => {
        const value = processedData[key];
        if (typeof value === 'string') {
            processedData[key] = value.trim();
        }
    });


    // Process comma-separated fields into arrays
    ["advantages", "applications", "useCases"].forEach(key => {
      if (processedData[key] && typeof processedData[key] === 'string') {
        processedData[key] = processedData[key]
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean) // Remove empty strings resulting from trailing commas etc.
      } else if (!processedData[key]) {
         processedData[key] = []; // Ensure it's an empty array if empty/undefined
      }
    })

    // Process related links
    if (processedData.relatedLinks && typeof processedData.relatedLinks === 'string') {
      const links = processedData.relatedLinks
        .split(",")
        .map((linkStr) => {
          const parts = linkStr.split("|").map((part) => part.trim())
          if (parts.length === 2 && parts[0] && parts[1]) {
            // Basic URL validation (optional but recommended)
            try {
              new URL(parts[1]); // Check if URL is valid
              return { title: parts[0], url: parts[1] };
            } catch (_) {
              console.warn(`Invalid URL found in relatedLinks: ${parts[1]}`);
              return null; // Or handle invalid URL differently
            }
          }
           console.warn(`Invalid format for related link item: ${linkStr}`);
          return null
        })
        .filter((link) => link !== null); // Filter out nulls from invalid formats/URLs
      processedData.relatedLinks = links;
    } else {
       processedData.relatedLinks = []; // Ensure it's an empty array if empty/undefined
    }

     // Process innovators: Filter out empty ones
     processedData.innovators = processedData.innovators.filter(innovator =>
         (innovator.name && innovator.name.trim() !== '') || (innovator.mail && innovator.mail.trim() !== '')
     );


    // Convert TRL to number, handle potential NaN
    if (processedData.trl && typeof processedData.trl === 'string') {
       const trlNum = Number(processedData.trl);
       processedData.trl = isNaN(trlNum) ? null : trlNum; // Store null if conversion fails
    } else if (processedData.trl === '') {
        processedData.trl = null; // Treat empty string as null or undefined TRL
    }


    // Automatically generate an id using the docket value or fallback to a timestamp if docket is empty
    // processedData.id = processedData.docket ? processedData.docket : `tech_${Date.now()}`;


    // Validate required fields: name, docket, and trl.
    // TRL validation should check if it's a valid number now.
    if (!processedData.name || !processedData.genre || processedData.trl === null || typeof processedData.trl !== 'number') {
      alert("Please fill in the required fields with valid data: Name (text), Genre (text), and TRL Level (number).") // Updated alert message
      return
  }

    // Keep only the file and caption for images when submitting
    const finalImagesData = processedData.images.map(img => ({
      file: img.file,
      caption: img.caption || ""
  }));


    // Create the final payload, excluding the 'preview' from images
    const payload = {
      ...processedData,
      images: finalImagesData, // Send only file and caption
  };


    try {
      // Pass the correctly processed payload to addTech
      const res = await addTech(payload)
      if (res.status === 201) {
        alert("Technology added successfully!")
        navigate("/admin-dashboard") // Navigate on success
      } else {
         // Handle non-201 success statuses if necessary, or rely on addTech's error throw
         console.warn("Technology add request returned status:", res.status);
         alert(`Technology added, but received status: ${res.status}. Data: ${JSON.stringify(res.data)}`);
         navigate("/admin-dashboard"); // Optionally navigate even on non-201 success
      }
    } catch (error) {
      console.error("Error adding technology:", error)
      // Provide more specific error feedback if possible
       alert(`Error adding technology: ${error.message}. Please check the console and try again.`);
    }
  }
  // --- End of handler functions ---

  return (
    <Layout title="Add New Technology"> {/* Assuming Layout provides basic structure and title */}
      <Paper elevation={3} sx={{ p: isMobile ? 2 : 4, borderRadius: 2, maxWidth: 'lg', margin: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
          Add New Technology
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
          Fields marked with * are required.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            {/* Section 1: Basic Information */}
            <Grid item xs={12}>
              <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Basic Information</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField label="Name *" name="name" fullWidth value={addData.name} onChange={handleAddChange} required />
                  </Grid>
                   <Grid item xs={12} sm={6}>
                    {/* <TextField label="Docket *" name="docket" fullWidth value={addData.docket} onChange={handleAddChange} required /> */}
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="TRL Level *" name="trl" type="number" fullWidth value={addData.trl} onChange={handleAddChange} required helperText="Enter a number (e.g., 1-9)"/>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      name="description"
                      fullWidth
                      multiline
                      rows={3}
                      value={addData.description}
                      onChange={handleAddChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Genre"
                      name="genre"
                      fullWidth
                      value={addData.genre}
                      onChange={handleAddChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Patent"
                      name="patent"
                      fullWidth
                      value={addData.patent}
                      onChange={handleAddChange}
                      helperText="Enter patent number or status"
                    />
                  </Grid>
                   <Grid item xs={12} sm={6}>
                    <FormControlLabel
                         control={
                         <Switch
                            checked={addData.spotlight}
                            onChange={handleSwitchChange}
                            name="spotlight"
                         />
                         }
                         label="Spotlight Technology?"
                     />
                   </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

            {/* Section 2: Innovators */}
            <Grid item xs={12}>
              <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Innovators
                </Typography>
                {addData.innovators.map((innovator, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label={`Innovator ${index + 1} Name`}
                        value={innovator.name}
                        onChange={(e) => handleInnovatorChange(index, 'name', e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Email"
                         type="email" // Add email type for basic validation
                        value={innovator.mail || ""}
                        onChange={(e) => handleInnovatorChange(index, 'mail', e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ textAlign: isMobile ? 'right' : 'center' }}>
                      <IconButton onClick={() => removeInnovator(index)} color="error" aria-label={`Remove Innovator ${index + 1}`}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  onClick={addInnovator}
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ mt: 1 }}
                >
                  Add Innovator
                </Button>
              </Box>
            </Grid>

             <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

            {/* Section 3: Details & Descriptions */}
             <Grid item xs={12}>
              <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, borderRadius: 1 }}>
                 <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Details</Typography>
                 <Grid container spacing={3}>
                    <Grid item xs={12}>
                         <TextField label="Overview" name="overview" fullWidth multiline rows={2} value={addData.overview} onChange={handleAddChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Detailed Description"
                        name="detailedDescription"
                        fullWidth
                        multiline
                        rows={4}
                        value={addData.detailedDescription}
                        onChange={handleAddChange}
                      />
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField
                        label="Advantages"
                        name="advantages"
                        fullWidth
                        value={addData.advantages}
                        onChange={handleAddChange}
                         helperText="Enter advantages, separated by commas"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                        label="Applications"
                        name="applications"
                        fullWidth
                        value={addData.applications}
                        onChange={handleAddChange}
                         helperText="Enter applications, separated by commas"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                        label="Use Cases"
                        name="useCases"
                        fullWidth
                        value={addData.useCases}
                        onChange={handleAddChange}
                         helperText="Enter use cases, separated by commas"
                        />
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField
                        label="Related Links"
                        name="relatedLinks"
                        fullWidth
                        value={addData.relatedLinks}
                        onChange={handleAddChange}
                        helperText="Format: Title1|URL1, Title2|URL2"
                        />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Technical Specifications"
                        name="technicalSpecifications"
                        fullWidth
                         multiline
                         rows={3}
                        value={addData.technicalSpecifications}
                        onChange={handleAddChange}
                      />
                    </Grid>
                 </Grid>
               </Box>
             </Grid>

             <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

            {/* Section 4: Image Upload */}
            <Grid item xs={12}>
               <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Images (Optional)
                </Typography>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  id="image-upload-input"
                />
                <label htmlFor="image-upload-input">
                    <Button
                        variant="outlined"
                        component="span" // Makes the button act as a label trigger
                        startIcon={<AddPhotoAlternateIcon />}
                        sx={{ mb: 2 }}
                    >
                        Select Images
                    </Button>
                </label>

                {/* Preview uploaded images */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {addData.images.map((image, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={image.preview}
                          alt={`Preview ${index + 1}`}
                          sx={{ objectFit: 'contain' }} // Use contain to see the whole image
                        />
                        <IconButton
                          aria-label={`Delete image ${index + 1}`}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0, 0, 0, 0.5)', // Darker background for better visibility
                            color: 'white',
                             padding: '4px',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                          }}
                          onClick={() => handleImageDelete(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                         <Box sx={{ p: 1, mt: 'auto' }}> {/* Push caption field to bottom */}
                            {/* <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                placeholder="Image Caption (optional)"
                                value={image.caption}
                                onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                            /> */}
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
               </Box>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} sx={{ textAlign: "center", mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 5, // Increased padding
                  fontWeight: 'bold', // Make text bolder
                  boxShadow: theme.shadows[3], // Use theme shadows
                  background: "linear-gradient(45deg, #212121 30%, #424242 90%)", // Slightly softer gradient
                  color: "white",
                  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out", // Smoother transition
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                    transform: "translateY(-2px)", // Keep hover effect
                     background: "linear-gradient(45deg, #000000 30%, #333333 90%)", // Darken on hover
                  },
                }}
              >
                Submit Technology
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  )
}

export default AddTechnology

