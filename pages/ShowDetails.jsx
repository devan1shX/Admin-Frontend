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
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import DateRangeIcon from '@mui/icons-material/DateRange';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DescriptionIcon from '@mui/icons-material/Description';
import LinkIcon from '@mui/icons-material/Link';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import NotesIcon from '@mui/icons-material/Notes';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import HighlightIcon from '@mui/icons-material/Highlight';
import ImageIcon from '@mui/icons-material/Image';
import ArticleIcon from '@mui/icons-material/Article';
import EmailIcon from '@mui/icons-material/Email';
import Layout from "./Layout";

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

const API_BASE_URL = "http://192.168.1.148:5001";

const ShowDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [technology, setTechnology] = useState(location.state?.technology || null);
    const [loading, setLoading] = useState(!technology);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (technology) {
            console.log("Technology Details (from state):", technology);
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
                    console.log("Fetched Technology Details (from API):", data);
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
            return null;
        }
        if (label === "Spotlight") {
            value = value ? "Yes" : "No";
        }

        return (
            <ListItem sx={{ p: 1.5, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: '40px', mt: '4px', color: 'primary.main' }}>{icon}</ListItemIcon>
                <ListItemText
                    primaryTypographyProps={{ fontWeight: '500', color: 'text.secondary', fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: 'text.primary', wordBreak: 'break-word' }}
                    primary={label}
                    secondary={
                        isHtml ? <Box dangerouslySetInnerHTML={{ __html: value }} /> : String(value)
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
            </Box>
        );
    }

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress color="primary" />
                </Container>
            </ThemeProvider>
        );
    }

    if (error) {
        return (
            <ThemeProvider theme={theme}>
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
            </ThemeProvider>
        );
    }

    if (!technology) {
        return (
            <ThemeProvider theme={theme}>
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
            </ThemeProvider>
        );
    }
    
    const {
        name, description, overview, detailedDescription, genre, docket,
        innovators, advantages, applications, useCases, relatedLinks,
        technicalSpecifications, trl, spotlight, images, patent,
        developedBy, submissionDate, brochures // Changed from brochure to brochures
    } = technology;

    return (
        <ThemeProvider theme={theme}>
            <Layout>
                <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
                    <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                        <Button 
                            startIcon={<ArrowBackIcon />} 
                            onClick={() => navigate(-1)} 
                            sx={{ mb: 3 }}
                            variant="outlined"
                            color="primary"
                        >
                            Back to Dashboard
                        </Button>

                        <Typography 
                            variant="h4" 
                            component="h1" 
                            gutterBottom 
                            sx={{ 
                                fontWeight: 600, 
                                color: 'primary.main',
                                mb: 1, 
                                wordBreak: 'break-word' 
                            }}
                        >
                            {name || "Technology Details"}
                        </Typography>
                        
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                            ID: {technology.id || "N/A"}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h5" sx={{ mt: 3, mb: 2, fontWeight: 500, color: "primary.main" }}>
                            Core Information
                        </Typography>
                        
                        <List>
                            {renderDetailItem(<DescriptionIcon />, "Description", description)}
                            {renderDetailItem(<ReceiptLongIcon />, "Overview", overview)}
                            {renderDetailItem(<NotesIcon />, "Detailed Description", detailedDescription, true)}
                            {renderDetailItem(<CategoryIcon />, "Genre", genre)}
                            {renderDetailItem(<GavelIcon />, "Docket", docket)}
                            {renderDetailItem(<VerifiedUserIcon />, "TRL (Technology Readiness Level)", trl)}
                            {renderDetailItem(<BusinessIcon />, "Developed By", developedBy)}
                            {renderDetailItem(<DateRangeIcon />, "Submission Date", submissionDate ? new Date(submissionDate).toLocaleDateString() : null)}
                            {renderDetailItem(<HighlightIcon />, "Spotlight", spotlight)}
                            {renderDetailItem(<ArticleIcon />, "Patent Information", patent)}
                            {renderDetailItem(<SettingsIcon />, "Technical Specifications", technicalSpecifications, true)}
                        </List>

                        <Divider sx={{ my: 3 }} />

                        {innovators && innovators.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <GroupIcon sx={{ mr: 1 }} /> Innovators
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {innovators.map((innovator, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card elevation={0} sx={{ 
                                                borderRadius: '6px',
                                                border: '1px solid #eee',
                                            }}>
                                                <CardContent>
                                                    <Typography variant="subtitle1" fontWeight={500}>
                                                        {innovator.name || `Innovator ${index + 1}`}
                                                    </Typography>
                                                    {innovator.mail && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                                                            <EmailIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                                            <Typography variant="body2" noWrap>
                                                                {innovator.mail}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Divider sx={{ my: 3 }} />
                            </>
                        )}

                        {renderListItems(<CheckCircleOutlineIcon />, "Advantages", advantages)}
                        
                        {applications && applications.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <BuildIcon sx={{ mr: 1 }} /> Applications
                                </Typography>
                                <List dense sx={{ pl: 2 }}>
                                    {applications.map((app, index) => (
                                        <ListItem key={index} sx={{ p: 0.75 }}>
                                            <ListItemIcon sx={{ minWidth: '30px', color: 'primary.main' }}>
                                                <BuildIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={app} />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider sx={{ my: 3 }} />
                            </>
                        )}

                        {useCases && useCases.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <AssignmentIcon sx={{ mr: 1 }} /> Use Cases
                                </Typography>
                                <List dense sx={{ pl: 2 }}>
                                    {useCases.map((useCase, index) => (
                                        <ListItem key={index} sx={{ p: 0.75 }}>
                                            <ListItemIcon sx={{ minWidth: '30px', color: 'primary.main' }}>
                                                <AssignmentIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={useCase} />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider sx={{ my: 3 }} />
                            </>
                        )}

                        {brochures && brochures.length > 0 && (
                            <>
                                <Typography variant="h6" sx={{ mt:3, mb: 1.5, fontWeight: 500, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    <ArticleIcon sx={{ mr: 1 }} /> Brochures
                                </Typography>
                                <List>
                                    {brochures.map((brochure, index) => (
                                        <ListItem
                                            key={`brochure-${index}-${brochure.url}`}
                                            button
                                            component="a"
                                            href={`${API_BASE_URL}${brochure.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{p:1, borderRadius: '4px', '&:hover': {backgroundColor: 'action.hover'}}}
                                        >
                                            <ListItemIcon sx={{ minWidth: '40px', color: 'primary.dark' }}>
                                                <DescriptionIcon /> 
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={brochure.originalName || `Brochure ${index + 1}`}
                                                primaryTypographyProps={{ fontWeight: 500, color: 'text.primary' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider sx={{ my: 3 }} />
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
                                            key={index} 
                                            component="a" 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            button 
                                            sx={{ p: 1, borderRadius: '4px', '&:hover': {backgroundColor: 'action.hover'} }}
                                        >
                                            <ListItemIcon sx={{ minWidth: '40px', color: 'primary.main' }}>
                                                <LinkIcon />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={link.title || link.url} 
                                                secondary={link.title ? link.url : null}
                                                primaryTypographyProps={{ fontWeight: 500 }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider sx={{ my: 3 }} />
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
                                            <Card sx={{ borderRadius: '6px' }}>
                                                <CardMedia
                                                    component="img"
                                                    height="160"
                                                    image={image.url.startsWith('http') ? image.url : `${API_BASE_URL}${image.url}`}
                                                    alt={image.caption || `Image ${index + 1}`}
                                                    sx={{ objectFit: 'contain', p: image.url.startsWith('http') ? 0 : 1, backgroundColor: '#f5f5f5' }}
                                                     onError={(e) => { e.target.style.display='none'; const parent = e.target.parentNode; if(parent) parent.innerHTML = "<Box sx={{height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Typography variant='caption' color='error'>Image load error</Typography></Box>"; }}
                                                />
                                                {image.caption && (
                                                    <CardContent sx={{ py: 1 }}>
                                                        <Typography variant="caption" color="text.secondary" component="p">
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