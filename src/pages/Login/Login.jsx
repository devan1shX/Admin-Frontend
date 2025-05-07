"use client"

import { useState } from "react"
import {
    Container,
    CardContent,
    TextField,
    Button,
    Typography,
    Grid,
    Box,
    IconButton,
    InputAdornment,
    Paper,
    useMediaQuery,
    createTheme,
    ThemeProvider,
    CssBaseline,
    Link,
    CircularProgress // Added for loading indicator
} from "@mui/material"
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/iiitdlogo.png" // Make sure this path is correct

// Define API_BASE_URL here
const API_BASE_URL = "http://192.168.1.148:5001";

const Login = () => {
    const [loginInfo, setLoginInfo] = useState({
        email: "",
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false); // Added loading state
    const navigate = useNavigate()
    const isMobile = useMediaQuery("(max-width:600px)")

    // Custom theme
    const theme = createTheme({
        palette: {
            primary: { main: "#2A9D8F" },
            secondary: { main: "#8A6FDF" },
            background: { default: "#f5f5f7" },
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h4: { fontWeight: 600 },
            button: { textTransform: "none", fontWeight: 500 },
        },
        shape: { borderRadius: 8 },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        boxShadow: "none",
                        "&:hover": { boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: { boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08)" },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": { borderColor: "#2A9D8F" },
                        },
                    },
                },
            },
        },
    })

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target
        setLoginInfo((prev) => ({ ...prev, [name]: value }))
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        // Basic client-side validation
        if (!loginInfo.email || !loginInfo.password) {
            toast.error("Please enter both email and password.", { position: "top-center" });
            return;
        }
        setLoading(true); // Set loading state
        try {
            // Use the defined API_BASE_URL
            const url = `${API_BASE_URL}/auth/login`;
            const response = await fetch(url, {
                method: "POST",
                mode: "cors", // Ensure CORS is handled server-side
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginInfo), // Send login data
            });
            const result = await response.json(); // Parse JSON response

            if (!response.ok) {
                // Use error message from backend if available, otherwise generic message
                toast.error(result.message || "Login failed. Please check credentials.", { position: "top-center" });
                setLoading(false); // Reset loading state on failure
                return; // Stop execution
            }

            // --- Login Successful ---
            toast.success("Login successful! Redirecting...", { position: "top-center", autoClose: 1500 });
            // Store the token
            localStorage.setItem("token", result.token);
            // Store the user object (which includes the role)
            if (result.user) {
                localStorage.setItem("user", JSON.stringify(result.user));
            } else {
                 // Handle case where backend might not send user object (though it should)
                 console.warn("User object not received in login response.");
                 // Clear potentially stale data if login succeeded but user data is missing
                 localStorage.removeItem("token");
                 localStorage.removeItem("user");
                 toast.error("Login error: User data missing from response.", { position: "top-center" });
                 setLoading(false);
                 return;
            }

            // Redirect after a short delay
            setTimeout(() => {
                navigate("/admin-dashboard"); // Redirect to the main dashboard
                // No need to setLoading(false) here as the component will unmount
            }, 1500); // Match toast duration

        } catch (err) {
            console.error("Error during login request:", err);
            toast.error("Login failed. Could not connect to the server.", { position: "top-center" });
            setLoading(false); // Reset loading state on network/fetch error
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev)
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* ToastContainer for notifications */}
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
            <Box
                sx={{
                    minHeight: "100vh",
                    overflow: "hidden", // Prevent body scroll
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "background.default",
                }}
            >
                {/* Header */}
                <Box
                    component="header"
                    sx={{
                        height: 70,
                        px: 3,
                        borderBottom: "1px solid #e0e0e0",
                        backgroundColor: "#fff",
                        display: "flex",
                        justifyContent: "center", // Center logo horizontally
                        alignItems: "center",
                        position: "sticky", // Make header sticky if needed
                        top: 0,
                        zIndex: 1100, // Ensure header is above content
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                >
                    <Box
                        component="img"
                        src={logo}
                        alt="IIIT Delhi Logo"
                        sx={{
                            maxHeight: '80%', // Control logo size by height
                            maxWidth: 180,
                            objectFit: "contain",
                        }}
                    />
                </Box>

                {/* Main Login Form Area */}
                <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
                    <Box
                        sx={{
                            width: '100%', // Ensure box takes full width of container
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <Paper
                            elevation={3} // Add a bit more elevation
                            sx={{
                                width: "100%",
                                overflow: "hidden",
                                borderRadius: 2, // Consistent border radius
                                transition: "box-shadow 0.3s ease-in-out",
                                '&:hover': { // Optional: subtle hover effect
                                    boxShadow: theme.shadows[6],
                                }
                            }}
                        >
                            {/* Form Header */}
                            <Box
                                sx={{
                                    p: 3,
                                    background: "linear-gradient(135deg, #2A9D8F 0%, #238A7E 100%)",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                <LockOutlined sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h5" component="h1" fontWeight="500">
                                    Admin Panel Sign In
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                                    Enter your credentials below
                                </Typography>
                            </Box>

                            {/* Form Content */}
                            <CardContent sx={{ p: { xs: 2, sm: 4 } }}> {/* Responsive padding */}
                                <form onSubmit={handleSubmit} noValidate> {/* Add noValidate to disable browser validation if using custom */}
                                    <Grid container spacing={2.5}> {/* Adjusted spacing */}
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                required
                                                id="email" // Add id for accessibility
                                                label="Email Address"
                                                name="email"
                                                type="email"
                                                autoComplete="email" // Help browser auto-fill
                                                variant="outlined"
                                                value={loginInfo.email}
                                                onChange={handleChange}
                                                disabled={loading} // Disable when loading
                                                InputProps={{ sx: { borderRadius: 1 } }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                required
                                                id="password" // Add id for accessibility
                                                label="Password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="current-password" // Help browser auto-fill
                                                variant="outlined"
                                                value={loginInfo.password}
                                                onChange={handleChange}
                                                disabled={loading} // Disable when loading
                                                InputProps={{
                                                    sx: { borderRadius: 1 },
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                                onClick={togglePasswordVisibility}
                                                                edge="end"
                                                                disabled={loading}
                                                            >
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                                size="large"
                                                disabled={loading} // Disable button when loading
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: 1,
                                                    fontWeight: "medium",
                                                    background: "linear-gradient(90deg, #2A9D8F 0%, #238A7E 100%)",
                                                    transition: "all 0.2s ease-in-out",
                                                    position: 'relative', // For loader positioning
                                                    '&:hover': {
                                                        background: "linear-gradient(90deg, #238A7E 0%, #2A9D8F 100%)",
                                                        transform: "translateY(-1px)", // Subtle lift
                                                        boxShadow: "0 2px 6px rgba(42, 157, 143, 0.3)",
                                                    },
                                                    '&.Mui-disabled': { // Style disabled state
                                                        background: theme.palette.action.disabledBackground,
                                                        cursor: 'not-allowed',
                                                    }
                                                }}
                                            >
                                                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    )
}

export default Login;