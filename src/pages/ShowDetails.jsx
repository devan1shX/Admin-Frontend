"use client";

import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Container,
    Button,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Card,
    CardMedia,
    CardContent,
    ThemeProvider,
    createTheme,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import GroupIcon from '@mui/icons-material/Group';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Used for Docket, Use Cases
import BusinessIcon from '@mui/icons-material/Business';
import DateRangeIcon from '@mui/icons-material/DateRange';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'; // Used for TRL
import DescriptionIcon from '@mui/icons-material/Description'; // Used for Description, Brochures
import LinkIcon from '@mui/icons-material/Link';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'; // Used for Overview
import NotesIcon from '@mui/icons-material/Notes'; // Used for Detailed Description
import GavelIcon from '@mui/icons-material/Gavel'; // Used for Patent Status
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings'; // Used for Technical Specifications
import HighlightIcon from '@mui/icons-material/Highlight'; // Used for Spotlight
import ImageIcon from '@mui/icons-material/Image';
import ArticleIcon from '@mui/icons-material/Article'; // Used for general articles/main patent info
import EmailIcon from '@mui/icons-material/Email';
import FingerprintIcon from '@mui/icons-material/Fingerprint'; // For Patent ID
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'; // For Patent App No.

import Layout from "./Layout"; // Assuming Layout.js is in the same directory

const theme = createTheme({
    palette: {
        primary: {
            main: '#299A8D',
            light: '#4AAFA2',
            dark: '#1E7A6D',
        },
        secondary: {
            main: '#2D8D82',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 6,
                },
            },
        },
    },
});

const API_BASE_URL = "https://otmt.iiitd.edu.in/api";
const PATENT_STATUSES = ["Not Filed", "Application Filed", "Under Examination", "Granted", "Abandoned/Lapsed"];


const ShowDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [technology, setTechnology] = useState(location.state?.technology || null);
    const [loading, setLoading] = useState(!technology);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (technology) {
            setLoading(false);
        } else {
            const fetchTechnologyDetails = async () => {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Authentication required.");
                    setLoading(false);
                    navigate("/login");
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/technologies/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        if (response.status === 404) {
                            throw new Error("Technology not found.");
                        } else if (response.status === 401 || response.status === 403) {
                            localStorage.removeItem("user");
                            localStorage.removeItem("token");
                            navigate('/login');
                            throw new Error("Access Denied or session expired. Please log in again.");
                        }
                        const errorData = await response.json().catch(() => ({ message: "Failed to fetch technology details." }));
                        throw new Error(errorData.message || "Failed to fetch technology details.");
                    }
                    const data = await response.json();
                    setTechnology(data);
                } catch (err) {
                    console.error("Error fetching technology details:", err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchTechnologyDetails();
        }
    }, [id, technology, navigate]);

    const renderDetailItem = (icon, label, value, isHtml = false) => {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (typeof value === 'boolean' && value === false && label !== "Spotlight")) {
            if (label === "Spotlight" && value === false) {
               // continue to render "No"
            } else {
                return null;
            }
        }
        
        let displayValue = value;
        if (label === "Spotlight") {
            displayValue = value ? "Yes" : "No";
        }

        return (
            <ListItem sx={{ p: 1.5, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: '40px', mt: '4px', color: 'primary.main' }}>{icon}</ListItemIcon>
                <ListItemText
                    primaryTypographyProps={{ fontWeight: '500', color: 'text.secondary', fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: 'text.primary', wordBreak: 'break-word', whiteSpace: isHtml ? 'normal' : 'pre-wrap', component: isHtml ? 'div' : 'p' }}
                    primary={label}
                    secondary={
                        isHtml ? <Box dangerouslySetInnerHTML={{ __html: displayValue }} /> : String(displayValue)
                    }
                />
            </ListItem>
        );
    };

    const renderListItems = (icon, label, items) => {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return null;
        }
        return (
            <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                    {React.cloneElement(icon, { sx: { mr: 1 } })} {label}
                </Typography>
                <List dense sx={{ pl: 2 }}>
                    {items.map((item, index) => (
                        <ListItem key={index} sx={{ p: 0.75 }}>
                            <ListItemIcon sx={{ minWidth: '30px', color: 'primary.main' }}>
                                <CheckCircleOutlineIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                        </ListItem>
                    ))}
                </List>
                 <Divider sx={{ my: 2, display: label !== "Use Cases" && label !== "Related Links" && label !== "Brochures" ? 'block' : 'none' }} />
            </Box>
        );
    }

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <Layout>
                    <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                        <CircularProgress color="primary" />
                    </Container>
                </Layout>
            </ThemeProvider>
        );
    }

    if (error) {
        return (
            <ThemeProvider theme={theme}>
                <Layout>
                    <Container sx={{ py: 4 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(-1)}
                            sx={{ mb: 2 }}
                            variant="outlined"
                            color="primary"
                        >
                            Back
                        </Button>
                        <Alert severity="error" sx={{ borderRadius: '6px' }}>
                            Error loading technology details: {error}
                        </Alert>
                    </Container>
                </Layout>
            </ThemeProvider>
        );
    }

    if (!technology) {
        return (
            <ThemeProvider theme={theme}>
                <Layout>
                    <Container sx={{ py: 4 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(-1)}
                            sx={{ mb: 2 }}
                            variant="outlined"
                            color="primary"
                        >
                            Back
                        </Button>
                        <Alert severity="warning" sx={{ borderRadius: '6px' }}>
                            Technology not found or no details available.
                        </Alert>
                    </Container>
                </Layout>
            </ThemeProvider>
        );
    }

    const {
        name, description, overview, detailedDescription, genre, docket,
        innovators, advantages, applications, useCases, relatedLinks,
        technicalSpecifications, trl, spotlight, images,
        patent, patentId, patentApplicationNumber, patentFilingDate, patentGrantDate, patentDocumentUrl,
        developedBy, submissionDate, brochures
    } = technology;

    return (
        <ThemeProvider theme={theme}>
            <Layout>
                <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
                    <Paper elevation={1} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate("/admin-dashboard/tech-management")}
                            sx={{ mb: 3 }}
                            variant="outlined"
                            color="primary"
                        >
                            Back to Tech Management
                        </Button>

                        <Typography
                            variant="h4"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 600,
                                color: 'primary.dark',
                                mb: 1,
                                wordBreak: 'break-word'
                            }}
                        >
                            {name || "Technology Details"}
                        </Typography>

                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                            Tech ID: {technology.id || "N/A"}
                        </Typography>

                        <Divider sx={{ my: 3, borderColor: 'primary.light' }} />

                        <Typography variant="h5" sx={{ mt: 3, mb: 2, fontWeight: 500, color: "primary.main" }}>
                            Core Information
                        </Typography>

                        <List>
                            {renderDetailItem(<DescriptionIcon />, "Description", description)}
                            {renderDetailItem(<ReceiptLongIcon />, "Overview", overview)}
                            {renderDetailItem(<NotesIcon />, "Detailed Description", detailedDescription, true)}
                            {renderDetailItem(<CategoryIcon />, "Genre", genre)}
                            {renderDetailItem(<AssignmentIcon />, "Docket ID", docket)}
                            {renderDetailItem(<VerifiedUserIcon />, "TRL (Technology Readiness Level)", trl)}
                            {renderDetailItem(<HighlightIcon />, "Spotlight", spotlight)}

                            {/* Patent Information - Updated Logic */}
                            {renderDetailItem(<GavelIcon />, "Patent Status", patent)}

                            {/* Show these if patent status indicates at least an application was made */}
                            {(patent === PATENT_STATUSES[1] || patent === PATENT_STATUSES[2] || patent === PATENT_STATUSES[3] || patent === PATENT_STATUSES[4]) && ( // Application Filed, Under Examination, Granted, Abandoned/Lapsed
                                <>
                                    {renderDetailItem(<ConfirmationNumberIcon />, "Patent Application No.", patentApplicationNumber)}
                                    {renderDetailItem(<DateRangeIcon />, "Filing Date", patentFilingDate ? new Date(patentFilingDate).toLocaleDateString() : null)}
                                </>
                            )}

                            {/* Show these if patent was granted (or could have been for lapsed/abandoned) */}
                            {(patent === PATENT_STATUSES[3] || patent === PATENT_STATUSES[4]) && ( // Granted, Abandoned/Lapsed
                                <>
                                    {renderDetailItem(<FingerprintIcon />, "Patent ID (Granted)", patentId)}
                                    {renderDetailItem(<DateRangeIcon />, "Grant Date", patentGrantDate ? new Date(patentGrantDate).toLocaleDateString() : null)}
                                </>
                            )}

                            {/* Show document URL if available and status is not "Not Filed" */}
                            {patent !== PATENT_STATUSES[0] && patentDocumentUrl && (
                                <ListItem sx={{ p: 1.5, alignItems: 'flex-start', pl: {xs: 1.5, sm: 1.5} /* Align with other list items */ }}>
                                     <ListItemIcon sx={{ minWidth: '40px', mt: '4px', color: 'primary.main' }}><LinkIcon /></ListItemIcon>
                                    <ListItemText
                                        primary="Patent Document"
                                        primaryTypographyProps={{ fontWeight: '500', color: 'text.secondary', fontSize: '0.9rem' }}
                                        secondary={
                                            <Button
                                                variant="text"
                                                size="small"
                                                href={patentDocumentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                startIcon={<LinkIcon />}
                                                sx={{ textTransform: 'none', p:0, justifyContent: 'flex-start', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline'}, color: 'primary.main', wordBreak: 'break-all', textAlign:'left' }}
                                            >
                                                {patentDocumentUrl.length > 60 ? patentDocumentUrl.substring(0,60) + "..." : patentDocumentUrl }
                                            </Button>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }} // Important for rendering Button correctly
                                    />
                                </ListItem>
                            )}
                            {/* End of Patent Information */}

                            {renderDetailItem(<SettingsIcon />, "Technical Specifications", technicalSpecifications, true)}
                            {renderDetailItem(<BusinessIcon />, "Developed By", developedBy)}
                            {renderDetailItem(<DateRangeIcon />, "Submission Date", submissionDate ? new Date(submissionDate).toLocaleDateString() : null)}
                        </List>

                        <Divider sx={{ my: 3, borderColor: 'primary.light' }} />

                        {innovators && innovators.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <GroupIcon sx={{ mr: 1 }} /> Innovators
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {innovators.map((innovator, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={`innovator-${index}`}>
                                            <Card elevation={0} sx={{ borderRadius: '8px', border: '1px solid #e0e0e0', height: '100%' }}>
                                                <CardContent>
                                                    <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                                                        {innovator.name || `Innovator ${index + 1}`}
                                                    </Typography>
                                                    {innovator.mail && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                                            <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.light' }} />
                                                            <Typography variant="body2" noWrap title={innovator.mail}>
                                                                {innovator.mail}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Divider sx={{ my: 3, borderColor: 'primary.light' }} />
                            </>
                        )}

                        {renderListItems(<CheckCircleOutlineIcon />, "Advantages", advantages)}
                        {renderListItems(<BuildIcon />, "Applications", applications)}
                        {renderListItems(<AssignmentIcon />, "Use Cases", useCases)}


                        {brochures && brochures.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mt:3, mb: 1.5, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <DescriptionIcon sx={{ mr: 1 }} /> Brochures
                                </Typography>
                                <List>
                                    {brochures.map((brochure, index) => (
                                        <ListItem
                                            key={`brochure-${index}-${brochure.url}`}
                                            button
                                            component="a"
                                            href={brochure.url.startsWith('http') ? brochure.url : `${API_BASE_URL}${brochure.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{p:1.5, borderRadius: '6px', '&:hover': {backgroundColor: 'action.hover'}, mb:1, border: '1px solid #eee'}}
                                        >
                                            <ListItemIcon sx={{ minWidth: '40px', color: 'primary.dark' }}>
                                                <ArticleIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={brochure.originalName || `Brochure ${index + 1}`}
                                                primaryTypographyProps={{ fontWeight: 500, color: 'text.primary' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider sx={{ my: 3, borderColor: 'primary.light' }} />
                            </>
                        )}


                        {relatedLinks && relatedLinks.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <LinkIcon sx={{ mr: 1 }} /> Related Links
                                </Typography>
                                <List>
                                    {relatedLinks.map((link, index) => (
                                        <ListItem
                                            key={`link-${index}`}
                                            component="a"
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            button
                                            sx={{ p: 1.5, borderRadius: '6px', '&:hover': {backgroundColor: 'action.hover'}, mb:1, border: '1px solid #eee'}}
                                        >
                                            <ListItemIcon sx={{ minWidth: '40px', color: 'primary.main' }}>
                                                <LinkIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={link.title || link.url}
                                                secondary={link.title ? link.url : null}
                                                primaryTypographyProps={{ fontWeight: 500 }}
                                                secondaryTypographyProps={{ fontSize: '0.8rem', style: {wordBreak: 'break-all'} }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider sx={{ my: 3, borderColor: 'primary.light', display: images && images.length > 0 ? 'block' : 'none' }} />
                            </>
                        )}

                        {images && images.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <ImageIcon sx={{ mr: 1 }} /> Images
                                </Typography>
                                <Grid container spacing={2}>
                                    {images.map((image, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={`image-${index}-${image.url}`}>
                                            <Card sx={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                                <CardMedia
                                                    component="img"
                                                    height="200"
                                                    image={image.url.startsWith('http') ? image.url : `${API_BASE_URL}${image.url}`}
                                                    alt={image.caption || `Image ${index + 1}`}
                                                    sx={{ objectFit: 'contain', p: 1, backgroundColor: '#f9f9f9' }}
                                                    onError={(e) => { e.target.style.display='none'; const parent = e.target.parentNode; if(parent) parent.innerHTML = "<Box sx={{height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f0f0'}}><Typography variant='caption' color='error'>Cannot load image</Typography></Box>"; }}
                                                />
                                                {image.caption && (
                                                    <CardContent sx={{ py: 1.5 }}>
                                                        <Typography variant="caption" color="text.secondary" component="p" textAlign="center">
                                                            {image.caption}
                                                        </Typography>
                                                    </CardContent>
                                                )}
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </>
                        )}
                    </Paper>
                </Container>
            </Layout>
        </ThemeProvider>
    );
};

export default ShowDetails;
