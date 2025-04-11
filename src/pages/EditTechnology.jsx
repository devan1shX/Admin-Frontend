"use client";

import { useEffect, useState, useRef, useCallback } from "react"; // Added useRef, useCallback
import {
  TextField,
  Button,
  Paper,
  Grid,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Box,
  IconButton,
  Divider, // Added
  Radio, // Added
  RadioGroup, // Added
  FormControlLabel, // Added
  FormControl, // Added
  FormLabel, // Added
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import Layout from "./Layout"; // Assuming Layout component exists
import AddIcon from "@mui/icons-material/Add";

const API_BASE_URL = "http://192.168.1.148:5001";

// --- getTechnologyById remains the same ---
const getTechnologyById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/technologies/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch technology details");
  }
  const data = await response.json();
  return data;
};

// --- updateTechnology remains largely the same (ensure backend compatibility) ---
const updateTechnology = async (id, updatedData) => {
  const formData = new FormData();

  // Add all non-file/non-complex fields
  Object.entries(updatedData).forEach(([key, value]) => {
    // Skip complex types handled separately
    if (key !== "images" && key !== "newImageData" && key !== "innovators" && key !== "relatedLinks" && key !== "advantages" && key !== "applications" && key !== "useCases") {
      // Convert boolean spotlight to string for FormData
      if (key === 'spotlight') {
          formData.append(key, String(value));
      } else if (value !== null && value !== undefined) { // Ensure value is not null/undefined
        formData.append(key, value);
      }
    }
  });

  // Handle arrays by stringifying them (adjust if backend expects different format)
  ['innovators', 'relatedLinks', 'advantages', 'applications', 'useCases'].forEach(key => {
     if (updatedData[key] && Array.isArray(updatedData[key])) {
         formData.append(key, JSON.stringify(updatedData[key]));
     } else {
          formData.append(key, JSON.stringify([])); // Send empty array if null/undefined
     }
  });


  // Add existing images data (send only necessary info, e.g., url and caption)
  if (updatedData.images && updatedData.images.length > 0) {
    // Filter out any null/undefined images just in case
    const validExistingImages = updatedData.images.filter(img => img && img.url).map(img => ({ url: img.url, caption: img.caption || "" }));
     formData.append("existingImages", JSON.stringify(validExistingImages));
  } else {
    formData.append("existingImages", JSON.stringify([])); // Indicate all removed or none existed
  }


  // Add new image files and their captions from newImageData
  if (updatedData.newImageData && updatedData.newImageData.length > 0) {
    updatedData.newImageData.forEach((imgData, index) => {
      if (imgData.file) { // Check if file exists
          formData.append("images", imgData.file); // Append the file
          // Ensure backend matches this caption naming convention
          formData.append(`imageCaptions[${index}]`, imgData.caption || "");
      }
    });
  }

  console.log("FormData prepared for PUT:"); // Debugging: Log FormData contents
  for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? value.name : value);
  }

  const response = await fetch(`${API_BASE_URL}/technologies/${id}`, {
    method: "PUT",
    body: formData,
    // No Content-Type header - browser sets it for FormData
  });

  if (!response.ok) {
    const errorData = await response.text(); // Read error response body
    console.error("Server error:", errorData);
    throw new Error(`Failed to update technology: ${response.statusText} - ${errorData}`);
  }

  const data = await response.json();
  return data;
};


const EditTechnology = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef(null); // Ref for file input

  const [techData, setTechData] = useState({
    name: "",
    description: "",
    overview: "",
    detailedDescription: "",
    genre: "",
    docket: "",
    innovators: [],
    advantages: "",
    applications: "",
    useCases: "",
    relatedLinks: "",
    technicalSpecifications: "",
    trl: "",
    images: [], // Existing images { url: string, caption?: string }
    patent: "",
    spotlight: "false" // Keep as string for RadioGroup, default 'false'
  });

  // State for new image files + preview URLs + captions
  const [newImages, setNewImages] = useState([]); // Array of { file: File, previewUrl: string, caption: string }
  const [loading, setLoading] = useState(true); // For initial fetch
  const [submitting, setSubmitting] = useState(false); // For submit action

  // Fetch Data
  useEffect(() => {
    const fetchTech = async () => {
      setLoading(true);
      try {
        const data = await getTechnologyById(id);
        // Ensure innovators and images are arrays
        const innovators = Array.isArray(data.innovators) ? data.innovators : [];
        const images = Array.isArray(data.images) ? data.images.filter(img => img && img.url) : []; // Ensure valid image objects

        setTechData({
          name: data.name || "",
          description: data.description || "",
          overview: data.overview || "",
          detailedDescription: data.detailedDescription || "",
          genre: data.genre || "",
          patent: data.patent || "",
          spotlight: data.spotlight ? String(data.spotlight) : "false", // Ensure string 'true'/'false'
          docket: data.docket ? String(data.docket) : "",
          innovators: innovators,
           // Join arrays into strings for TextField display
          advantages: Array.isArray(data.advantages) ? data.advantages.join(", ") : "",
          applications: Array.isArray(data.applications) ? data.applications.join(", ") : "",
          useCases: Array.isArray(data.useCases) ? data.useCases.join(", ") : "",
          relatedLinks: Array.isArray(data.relatedLinks)
            ? data.relatedLinks.map((link) => `${link.title}|${link.url}`).join(", ")
            : "",
          technicalSpecifications: data.technicalSpecifications || "",
          trl: data.trl ? String(data.trl) : "",
          images: images, // Store existing images
        });
      } catch (error) {
        console.error("Error fetching technology:", error);
        alert("Failed to load technology data.");
        navigate("/admin-dashboard"); // Redirect if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchTech();
  }, [id, navigate]);

  // Cleanup Effect for Object URLs
  useEffect(() => {
    // This function runs when the component unmounts
    return () => {
      newImages.forEach(imageObj => {
          if (imageObj.previewUrl) {
              URL.revokeObjectURL(imageObj.previewUrl);
          }
      });
    };
  }, [newImages]); // Rerun if newImages array changes structure (though cleanup is mainly for unmount)

  // --- Handlers ---

  // General input change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setTechData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Innovator Handlers
  const handleAddInnovator = useCallback(() => {
    setTechData((prev) => ({
      ...prev,
      innovators: [...prev.innovators, { name: "", mail: "" }],
    }));
  }, []);

  const handleInnovatorChange = useCallback((index, field, value) => {
    setTechData((prev) => {
        const updatedInnovators = [...prev.innovators];
        updatedInnovators[index] = { ...updatedInnovators[index], [field]: value };
        return { ...prev, innovators: updatedInnovators };
    });
  }, []);

  const handleRemoveInnovator = useCallback((index) => {
    setTechData((prev) => {
        const updatedInnovators = [...prev.innovators];
        updatedInnovators.splice(index, 1);
        return { ...prev, innovators: updatedInnovators };
    });
  }, []);


  // --- Image Handlers ---

   // Handle new image file selection
   const handleImageUpload = useCallback((e) => {
     const files = Array.from(e.target.files);
     if (files.length > 0) {
         const newImageObjects = files.map(file => ({
           file: file,
           previewUrl: URL.createObjectURL(file),
           caption: "" // Initialize caption
         }));
         setNewImages((prev) => [...prev, ...newImageObjects]);
     }
      // Reset file input to allow uploading the same file again if needed
     if (fileInputRef.current) {
        fileInputRef.current.value = "";
     }
   }, []);


  // REFACTORED: Handle caption change for EXISTING images
  const handleExistingCaptionChange = useCallback((index, value) => {
     setTechData(prev => {
         const updatedImages = [...prev.images];
         if(updatedImages[index]){
             updatedImages[index] = { ...updatedImages[index], caption: value };
         }
         return { ...prev, images: updatedImages };
     });
  }, []);

  // REFACTORED: Handle caption change for NEW images
  const handleNewCaptionChange = useCallback((index, value) => {
      setNewImages(prevNewImages => {
          const updatedNewImages = [...prevNewImages];
          if(updatedNewImages[index]){
              updatedNewImages[index] = { ...updatedNewImages[index], caption: value };
          }
          return updatedNewImages;
      });
  }, []);

   // Handle removing an EXISTING image
   const handleRemoveExistingImage = useCallback((index) => {
     setTechData((prev) => {
         const updatedImages = [...prev.images];
         updatedImages.splice(index, 1);
         return { ...prev, images: updatedImages };
     });
   }, []);

  // Handle removing a NEW image (and revoke its URL)
  const handleRemoveNewImage = useCallback((index) => {
    setNewImages(prevNewImages => {
        const updatedNewImages = [...prevNewImages];
        const removedImage = updatedNewImages.splice(index, 1)[0];
        if (removedImage && removedImage.previewUrl) {
            URL.revokeObjectURL(removedImage.previewUrl); // Revoke URL immediately
        }
        return updatedNewImages;
    });
  }, []);

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Process data before sending
    const processedData = {};
    Object.entries(techData).forEach(([key, value]) => {
      // Skip existing images array (handled separately)
      if (key === "images") return;

      // Keep innovators as is (array of objects)
       if (key === "innovators") {
           processedData[key] = value.filter(inv => (inv.name && inv.name.trim()) || (inv.mail && inv.mail.trim())); // Filter empty innovators
           return;
       }

      const stringValue = value != null ? String(value).trim() : ""; // Trim strings

      if (stringValue !== "" || key === 'spotlight' || key === 'technicalSpecifications' || key === 'description' || key === 'overview' || key === 'docket' || key === 'patent' || key === 'genre') { // Include specific fields even if empty, handle spotlight separately
         if (["advantages", "applications", "useCases"].includes(key)) {
             processedData[key] = stringValue.split(",").map(item => item.trim()).filter(Boolean);
         } else if (key === "relatedLinks") {
              const links = stringValue
                  .split(",")
                  .map((linkStr) => {
                      const parts = linkStr.split("|").map((part) => part.trim());
                      if (parts.length === 2 && parts[0] && parts[1]) {
                           try {
                               new URL(parts[1]); // Basic URL validation
                               return { title: parts[0], url: parts[1] };
                           } catch (_) { return null; }
                      }
                      return null;
                  })
                  .filter(link => link !== null);
              processedData[key] = links;
          } else if (key === "trl") {
               const num = Number(stringValue);
               processedData[key] = isNaN(num) ? null : num; // Convert to number or null
          } else if (key === "spotlight") {
               processedData[key] = stringValue === 'true'; // Convert radio value string to boolean
          }
           else {
              processedData[key] = stringValue; // Assign trimmed string value
          }
       } else {
            // Handle potentially empty fields if backend requires them (e.g., set to empty array or null)
            if (["advantages", "applications", "useCases", "relatedLinks"].includes(key)) {
                processedData[key] = [];
            } else if (key === 'trl') {
                 processedData[key] = null;
            } else {
                 // You might want to explicitly set other fields to "" or null if required
                 // processedData[key] = ""; // Or null
            }
       }
    });

    // Add existing images data (pass the current state)
    processedData.images = techData.images;

    // Prepare new images data (file + caption)
    processedData.newImageData = newImages.map(imgObj => ({
        file: imgObj.file,
        caption: imgObj.caption || ""
    }));

    // Add the original ID back if it's not part of techData state
    processedData.id = id;

    try {
      await updateTechnology(id, processedData);
      alert("Technology updated successfully!");
      navigate("/admin-dashboard");
    } catch (error) {
      console.error("Error updating technology:", error);
      alert(`Failed to update technology: ${error.message || 'Please check details and try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <Layout title="Edit Technology">
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 200px)', p: 3 }}>
          <CircularProgress />
           <Typography sx={{ ml: 2 }}>Loading Technology Data...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={`Edit Technology: ${techData.name || '...'}`}>
      <Paper elevation={3} sx={{ p: isMobile ? 2 : 4, borderRadius: 2, maxWidth: 'lg', margin: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
          Edit Technology
        </Typography>
         <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
           Modify the details for Technology ID: {id}. Fields marked with * are required.
         </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            {/* Section 1: Basic Information */}
            <Grid item xs={12}>
                <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Basic Information</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField label="Name *" name="name" fullWidth value={techData.name} onChange={handleChange} required />
                        </Grid>
                         {/* <Grid item xs={12} sm={6}>
                            <TextField label="Docket *" name="docket" fullWidth value={techData.docket} onChange={handleChange} required InputLabelProps={{ shrink: !!techData.docket }} />
                        </Grid> */}
                        <Grid item xs={12}>
                            <TextField label="TRL Level *" name="trl" type="number" fullWidth value={techData.trl} onChange={handleChange} required InputLabelProps={{ shrink: !!techData.trl }} helperText="Enter a number (e.g., 1-9)"/>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Description" name="description" fullWidth multiline rows={3} value={techData.description} onChange={handleChange} InputLabelProps={{ shrink: !!techData.description }}/>
                        </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField label="Genre" name="genre" fullWidth value={techData.genre} onChange={handleChange} InputLabelProps={{ shrink: !!techData.genre }} />
                         </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField label="Patent" name="patent" fullWidth value={techData.patent} onChange={handleChange} helperText="Enter patent number or status" InputLabelProps={{ shrink: !!techData.patent }}/>
                         </Grid>
                         <Grid item xs={12} sm={6}>
                             {/* --- Spotlight Radio Group --- */}
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Spotlight *</FormLabel>
                                <RadioGroup
                                    row
                                    aria-label="spotlight"
                                    name="spotlight"
                                    value={techData.spotlight} // Controlled component using string 'true'/'false'
                                    onChange={handleChange}
                                >
                                    <FormControlLabel value="true" control={<Radio />} label="True" />
                                    <FormControlLabel value="false" control={<Radio />} label="False" />
                                </RadioGroup>
                            </FormControl>
                         </Grid>
                    </Grid>
                </Box>
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

            {/* Section 2: Innovators */}
            <Grid item xs={12}>
                <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Innovators</Typography>
                      {techData.innovators.map((innovator, index) => (
                        <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                           <Grid item xs={12} sm={5}>
                            <TextField fullWidth label={`Innovator ${index + 1} Name`} value={innovator.name || ""} onChange={(e) => handleInnovatorChange(index, "name", e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: !!innovator.name }}/>
                           </Grid>
                           <Grid item xs={12} sm={5}>
                            <TextField fullWidth label="Email" type="email" value={innovator.mail || ""} onChange={(e) => handleInnovatorChange(index, "mail", e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: !!innovator.mail }}/>
                           </Grid>
                           <Grid item xs={12} sm={2} sx={{ textAlign: isMobile ? 'right' : 'center' }}>
                            <IconButton onClick={() => handleRemoveInnovator(index)} color="error" aria-label={`Remove Innovator ${index + 1}`}>
                                <DeleteIcon />
                            </IconButton>
                           </Grid>
                        </Grid>
                      ))}
                    <Button variant="outlined" onClick={handleAddInnovator} startIcon={<AddIcon />} sx={{ mt: 1 }}>
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
                         <TextField label="Overview" name="overview" fullWidth multiline rows={2} value={techData.overview} onChange={handleChange} InputLabelProps={{ shrink: !!techData.overview }} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Detailed Description" name="detailedDescription" fullWidth multiline rows={4} value={techData.detailedDescription} onChange={handleChange} InputLabelProps={{ shrink: !!techData.detailedDescription }} />
                    </Grid>
                    <Grid item xs={12}>
                         <TextField label="Advantages" name="advantages" fullWidth value={techData.advantages} onChange={handleChange} helperText="Enter advantages, separated by commas" InputLabelProps={{ shrink: !!techData.advantages }}/>
                    </Grid>
                     <Grid item xs={12}>
                        <TextField label="Applications" name="applications" fullWidth value={techData.applications} onChange={handleChange} helperText="Enter applications, separated by commas" InputLabelProps={{ shrink: !!techData.applications }}/>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Use Cases" name="useCases" fullWidth value={techData.useCases} onChange={handleChange} helperText="Enter use cases, separated by commas" InputLabelProps={{ shrink: !!techData.useCases }}/>
                    </Grid>
                     <Grid item xs={12}>
                        <TextField label="Related Links" name="relatedLinks" fullWidth multiline rows={2} value={techData.relatedLinks} onChange={handleChange} helperText="Format: Title1|URL1, Title2|URL2" InputLabelProps={{ shrink: !!techData.relatedLinks }}/>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Technical Specifications" name="technicalSpecifications" fullWidth multiline rows={3} value={techData.technicalSpecifications} onChange={handleChange} InputLabelProps={{ shrink: !!techData.technicalSpecifications }}/>
                    </Grid>
                 </Grid>
               </Box>
             </Grid>

            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

            {/* Section 4: Images */}
            <Grid item xs={12}>
               <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, borderRadius: 1 }}>
                 <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Images</Typography>

                  {/* Existing Images Display */}
                  {techData.images && techData.images.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>Current Images</Typography>
                      <Grid container spacing={2}>
                        {techData.images.map((image, index) => (
                          <Grid item xs={12} sm={6} md={4} key={`existing-${image.url}-${index}`}>
                            <Paper elevation={1} sx={{ p: 1.5, position: "relative", height: "100%", display: 'flex', flexDirection: 'column' }}>
                              <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 1, bgcolor: "rgba(0,0,0,0.4)", color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)'} }} onClick={() => handleRemoveExistingImage(index)} aria-label={`Remove existing image ${index + 1}`}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <Box sx={{ height: 160, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", bgcolor: theme.palette.grey[200], borderRadius: 1, mb: 1.5 }}>
                                <img
                                  src={ image.url.startsWith("http") ? image.url : `${API_BASE_URL}${image.url}` }
                                  alt={`Existing ${index + 1}`}
                                  style={{ display: 'block', maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                  onError={(e) => { e.target.onerror = null; e.target.src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; /* Replace with placeholder or hide */ e.target.style.objectFit = 'scale-down'; e.target.style.width='50%'; e.target.style.height='50%'; }} // Basic error handling
                                />
                              </Box>
                              {/* <TextField fullWidth label="Caption" variant="outlined" size="small" value={image.caption || ""} onChange={(e) => handleExistingCaptionChange(index, e.target.value)} sx={{ mt: 'auto' }} InputLabelProps={{ shrink: !!image.caption }} /> */}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* New Images Preview */}
                  {newImages.length > 0 && (
                    <Box sx={{ mb: 3, mt: techData.images?.length > 0 ? 4 : 0 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>New Images (Preview)</Typography>
                      <Grid container spacing={2}>
                        {newImages.map((imageObj, index) => (
                          <Grid item xs={12} sm={6} md={4} key={`new-${index}-${imageObj.file.name}`}>
                             <Paper elevation={1} sx={{ p: 1.5, position: "relative", height: "100%", display: 'flex', flexDirection: 'column' }}>
                              <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 1, bgcolor: "rgba(0,0,0,0.4)", color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)'} }} onClick={() => handleRemoveNewImage(index)} aria-label={`Remove new image ${index + 1}`}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <Box sx={{ height: 160, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", bgcolor: theme.palette.grey[200], borderRadius: 1, mb: 1.5 }}>
                                <img src={imageObj.previewUrl} alt={`New preview ${index + 1}`} style={{ display: 'block', maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </Box>
                              {/* <TextField fullWidth label="Caption" variant="outlined" size="small" value={imageObj.caption} onChange={(e) => handleNewCaptionChange(index, e.target.value)} helperText={imageObj.file.name} sx={{ mt: 'auto' }} InputLabelProps={{ shrink: !!imageObj.caption }}/> */}
                             </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Image Upload Button */}
                   <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />} sx={{ mt: 1 }}>
                     Add New Images
                     <input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleImageUpload} />
                   </Button>

               </Box>
             </Grid>


            {/* Submit Button */}
            <Grid item xs={12} sx={{ textAlign: "center", mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting} // Disable button while submitting
                sx={{
                  minWidth: 150, // Ensure minimum width
                  borderRadius: 2,
                  py: 1.5,
                  px: 5,
                  fontWeight: 'bold',
                  boxShadow: theme.shadows[3],
                  background: "linear-gradient(45deg, #212121 30%, #424242 90%)",
                  color: "white",
                  transition: "all 0.3s",
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                    transform: "translateY(-2px)",
                    background: "linear-gradient(45deg, #000000 30%, #333333 90%)",
                  },
                   '&:disabled': {
                     background: theme.palette.action.disabledBackground,
                     boxShadow: 'none',
                     color: theme.palette.action.disabled
                   }
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default EditTechnology;

