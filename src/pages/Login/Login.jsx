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
    CircularProgress
} from "@mui/material"
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/iiitdlogo.png" // Make sure this path is correct

// Define API_BASE_URL here
const API_BASE_URL = "http://192.168.1.148:5001"; // Ensure this is accessible

const Login = () => {
    const [loginInfo, setLoginInfo] = useState({
        email: "",
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()
    const isMobile = useMediaQuery("(max-width:600px)")

    // Custom theme (condensed for brevity, assuming it's correct from your original code)
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
            MuiButton: { styleOverrides: { root: { boxShadow: "none", "&:hover": { boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}}},
            MuiCard: { styleOverrides: { root: { boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08)" }}},
            MuiTextField: { styleOverrides: { root: { "& .MuiOutlinedInput-root": { "&.Mui-focused fieldset": { borderColor: "#2A9D8F" }}}}},
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target
        setLoginInfo((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Login form submitted with:", loginInfo);

        if (!loginInfo.email || !loginInfo.password) {
            toast.error("Please enter both email and password.", { position: "top-center" });
            console.warn("Validation failed: Email or password missing.");
            return;
        }

        setLoading(true);
        console.log("Attempting login, setLoading to true.");

        try {
            const url = `${API_BASE_URL}/auth/login`;
            console.log("Fetching URL:", url);

            const response = await fetch(url, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginInfo),
            });

            console.log("Login API Raw Response:", response);
            const result = await response.json();

            // DETAILED LOGGING OF API RESPONSE:
            console.log("Login API Response Status Code:", response.status);
            console.log("Login API Response OK (response.ok):", response.ok);
            console.log("Login API Response Body (parsed result):", JSON.stringify(result, null, 2)); // Pretty print JSON
            console.log("Token from API (result.token):", result.token);
            console.log("User from API (result.user):", result.user);


            if (!response.ok) {
                console.error("Login failed - Server responded with non-OK status:", response.status, "Result:", result);
                toast.error(result.message || `Login failed. Status: ${response.status}`, { position: "top-center" });
                setLoading(false);
                console.log("setLoading to false due to non-OK response.");
                return;
            }

            // --- Login Potentially Successful (response.ok is true) ---

            // Explicitly check if token exists and is a non-empty string
            if (!result.token || typeof result.token !== 'string' || result.token.trim() === "") {
                console.error("Login error: Token missing or invalid in API response despite response.ok.", "Received token:", result.token);
                toast.error("Authentication error: Token not received from server.", { position: "top-center" });
                localStorage.removeItem("token"); // Ensure any old/bad token is cleared
                localStorage.removeItem("user");
                console.log("Cleared token and user from localStorage due to missing/invalid token in response.");
                setLoading(false);
                console.log("setLoading to false due to missing/invalid token.");
                return;
            }

            console.log("Login successful! Token received:", result.token);
            toast.success("Login successful! Redirecting...", { position: "top-center", autoClose: 1500 });

            localStorage.setItem("token", result.token);
            console.log("Token SET in localStorage. Current value:", localStorage.getItem("token"));


            if (result.user && typeof result.user === 'object') {
                localStorage.setItem("user", JSON.stringify(result.user));
                console.log("User object SET in localStorage. Current value:", localStorage.getItem("user"));
            } else {
                console.warn("User object not received or not an object in login response:", result.user);
                // Old logic that caused loops if user object was missing:
                // localStorage.removeItem("token");
                // localStorage.removeItem("user");
                // toast.error("Login error: User data missing from response.", { position: "top-center" });
                // setLoading(false);
                // return;
                // New approach: If token is present, proceed but log a warning.
                // The application must be able to handle a missing user object if this is acceptable.
                toast.warn("User details not fully provided by server, but login token processed.", { position: "top-center", autoClose: 2500 });
                localStorage.removeItem("user"); // Clear any stale user data
                console.log("User object was missing/invalid; ensured 'user' is removed from localStorage.");
            }

            console.log("Preparing to navigate to /admin-dashboard in 1.5 seconds.");
            setTimeout(() => {
                console.log("Executing navigation to /admin-dashboard. Token in localStorage:", localStorage.getItem("token"));
                navigate("/admin-dashboard");
                // setLoading(false) is generally not needed here if the component unmounts.
                // If navigation could fail and stay on this page, then it would be.
            }, 1500);

        } catch (err) {
            console.error("Error during login fetch request:", err);
            // This catch block handles network errors or errors if response.json() fails
            toast.error("Login request failed. Could not connect or parse server response.", { position: "top-center" });
            setLoading(false);
            console.log("setLoading to false due to exception in fetch/JSON parse.");
        }
        // If we reach here after a successful try-block navigation timeout is set,
        // setLoading will naturally be true until navigation.
        // If an error path within try didn't return, ensure setLoading(false) is called.
        // However, all error paths in the try block above *do* call setLoading(false) and return.
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev)
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
            <Box
                sx={{
                    minHeight: "100vh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "background.default",
                }}
            >
                <Box
                    component="header"
                    sx={{
                        height: 70, px: 3, borderBottom: "1px solid #e0e0e0", backgroundColor: "#fff",
                        display: "flex", justifyContent: "center", alignItems: "center",
                        position: "sticky", top: 0, zIndex: 1100, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                >
                    <Box
                        component="img" src={logo} alt="IIIT Delhi Logo"
                        sx={{ maxHeight: '80%', maxWidth: 180, objectFit: "contain" }}
                    />
                </Box>

                <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
                    <Box sx={{ width: '100%', display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Paper
                            elevation={3}
                            sx={{
                                width: "100%", overflow: "hidden", borderRadius: 2,
                                transition: "box-shadow 0.3s ease-in-out",
                                '&:hover': { boxShadow: theme.shadows[6] }
                            }}
                        >
                            <Box sx={{ p: 3, background: "linear-gradient(135deg, #2A9D8F 0%, #238A7E 100%)", color: "white", textAlign: "center" }}>
                                <LockOutlined sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h5" component="h1" fontWeight="500">Admin Panel Sign In</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>Enter your credentials below</Typography>
                            </Box>

                            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                                <form onSubmit={handleSubmit} noValidate>
                                    <Grid container spacing={2.5}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth required id="email" label="Email Address" name="email" type="email"
                                                autoComplete="email" variant="outlined" value={loginInfo.email}
                                                onChange={handleChange} disabled={loading}
                                                InputProps={{ sx: { borderRadius: 1 } }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth required id="password" label="Password" name="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="current-password" variant="outlined"
                                                value={loginInfo.password} onChange={handleChange} disabled={loading}
                                                InputProps={{
                                                    sx: { borderRadius: 1 },
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                                onClick={togglePasswordVisibility} edge="end" disabled={loading}
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
                                                fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading}
                                                sx={{
                                                    py: 1.5, borderRadius: 1, fontWeight: "medium",
                                                    background: "linear-gradient(90deg, #2A9D8F 0%, #238A7E 100%)",
                                                    transition: "all 0.2s ease-in-out", position: 'relative',
                                                    '&:hover': {
                                                        background: "linear-gradient(90deg, #238A7E 0%, #2A9D8F 100%)",
                                                        transform: "translateY(-1px)", boxShadow: "0 2px 6px rgba(42, 157, 143, 0.3)",
                                                    },
                                                    '&.Mui-disabled': {
                                                        background: theme.palette.action.disabledBackground,
                                                        color: theme.palette.action.disabled, // Ensure text color changes for disabled
                                                        cursor: 'not-allowed',
                                                    }
                                                }}
                                            >
                                                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : "Sign In"}
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