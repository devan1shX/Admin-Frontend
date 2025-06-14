"use client"

import { useState, useEffect } from "react";
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
    CircularProgress,
    Divider
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined, Google as GoogleIcon } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/iiitdlogo.png"; // Make sure this path is correct
import {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
} from "../../firebase"; // Assuming firebase.js is in src/

const API_BASE_URL = "https://otmt.iiitd.edu.in/api"; 
// const API_BASE_URL = "http://localhost:5001/api";


const Login = () => {
    const [loginInfo, setLoginInfo] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    //const isMobile = useMediaQuery("(max-width:600px)"); // isMobile is defined but not used, can be removed if not needed

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
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in. App.jsx's PublicRoute should handle redirection.
            } else {
                // User is signed out, clear local storage if needed.
                // This might be redundant if App.jsx also handles this.
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        });
        return () => unsubscribe();
    }, []);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginInfo((prev) => ({ ...prev, [name]: value }));
    };

    const fetchUserProfileAndNavigate = async (firebaseUser) => {
        if (!firebaseUser) {
            toast.error("Firebase user not available.", { position: "top-center" });
            return false;
        }
        try {
            const idToken = await firebaseUser.getIdToken(true);
            localStorage.setItem("token", idToken);

            const profileResponse = await fetch(`${API_BASE_URL}/users/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            const profileResult = await profileResponse.json();

            if (!profileResponse.ok) {
                toast.error(profileResult.message || "Failed to fetch user profile.", { position: "top-center" });
                localStorage.removeItem("token");
                if (profileResult.code === 'USER_PROFILE_NOT_FOUND') {
                    toast.info("User profile not found in our database. Please complete sign up or contact admin.", { autoClose: 5000 });
                    // Optionally sign out the Firebase user if profile is mandatory for login
                    // await auth.signOut();
                }
                return false;
            }

            localStorage.setItem("user", JSON.stringify(profileResult.user));
            toast.success("Login successful! Redirecting...", { position: "top-center", autoClose: 1500 });
            setTimeout(() => {
                navigate("/admin-dashboard");
            }, 1500);
            return true;

        } catch (err) {
            console.error("Error fetching user profile:", err);
            toast.error("Login error: Could not retrieve user data.", { position: "top-center" });
            localStorage.removeItem("token");
            return false;
        }
    };


    const handleEmailPasswordLogin = async (e) => {
        e.preventDefault();
        if (!loginInfo.email || !loginInfo.password) {
            toast.error("Please enter both email and password.", { position: "top-center" });
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginInfo.email, loginInfo.password);
            const success = await fetchUserProfileAndNavigate(userCredential.user);
            if (!success) setLoading(false);
        } catch (error) {
            console.error("Firebase email login error:", error);
            let message = "Login failed. Please check your credentials.";
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                message = "Invalid email or password.";
            } else if (error.code === "auth/invalid-email") {
                message = "Invalid email format.";
            } else if (error.code === "auth/user-disabled") {
                message = "This user account has been disabled.";
            }
            toast.error(message, { position: "top-center" });
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            const idToken = await firebaseUser.getIdToken(true);

            const profileCheckResponse = await fetch(`${API_BASE_URL}/users/me`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${idToken}` }
            });

            if (profileCheckResponse.status === 403 && (await profileCheckResponse.json()).code === 'USER_PROFILE_NOT_FOUND') {
                 toast.info("Profile not found, creating one for you...", { autoClose: 2000 });
                 const createProfileResponse = await fetch(`${API_BASE_URL}/auth/create-profile`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ name: firebaseUser.displayName || firebaseUser.email.split('@')[0] })
                });
                if (!createProfileResponse.ok) {
                    const errorResult = await createProfileResponse.json();
                    toast.error(errorResult.message || "Could not create user profile during Google Sign-In.", { position: "top-center" });
                    setGoogleLoading(false);
                    return;
                }
            } else if (!profileCheckResponse.ok) {
                 const errorResult = await profileCheckResponse.json();
                 toast.error(errorResult.message || "Failed to verify user profile during Google Sign-In.", { position: "top-center" });
                 setGoogleLoading(false);
                 return;
            }

            const success = await fetchUserProfileAndNavigate(firebaseUser);
            if (!success) setGoogleLoading(false);

        } catch (error) {
            console.error("Google sign-in error:", error);
            let message = "Google Sign-In failed.";
            if (error.code === "auth/popup-closed-by-user") {
                message = "Sign-in popup closed. Please try again.";
            } else if (error.code === "auth/account-exists-with-different-credential") {
                message = "An account already exists with this email using a different sign-in method.";
            } else if (error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-blocked") {
                message = "Popup blocked or cancelled. Please enable popups and try again.";
            }
            toast.error(message, { position: "top-center" });
            setGoogleLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!loginInfo.email) {
            toast.info("Please enter your email address to reset password.", { position: "top-center" });
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, loginInfo.email);
            toast.success("Password reset email sent! Check your inbox (and spam folder).", { position: "top-center", autoClose: 4000 });
        } catch (error) {
            console.error("Forgot password error:", error);
            let message = "Failed to send password reset email.";
            if (error.code === "auth/user-not-found") {
                message = "No user found with this email address.";
            } else if (error.code === "auth/invalid-email") {
                message = "Invalid email format.";
            }
            toast.error(message, { position: "top-center" });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
            <Box sx={{ minHeight: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", backgroundColor: "background.default" }}>
                <Box component="header" sx={{ height: 70, px: 3, borderBottom: "1px solid #e0e0e0", backgroundColor: "#fff", display: "flex", justifyContent: "center", alignItems: "center", position: "sticky", top: 0, zIndex: 1100, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <Box component="img" src={logo} alt="IIIT Delhi Logo" sx={{ maxHeight: '80%', maxWidth: 180, objectFit: "contain" }} />
                </Box>
                <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
                    <Box sx={{ width: '100%', display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Paper elevation={3} sx={{ width: "100%", overflow: "hidden", borderRadius: 2, transition: "box-shadow 0.3s ease-in-out", '&:hover': { boxShadow: theme.shadows[6] } }}>
                            <Box sx={{ p: 3, background: "linear-gradient(135deg, #2A9D8F 0%, #238A7E 100%)", color: "white", textAlign: "center" }}>
                                <LockOutlined sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h5" component="h1" fontWeight="500">Admin Panel Sign In</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>Enter your credentials below</Typography>
                            </Box>
                            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                <form onSubmit={handleEmailPasswordLogin} noValidate>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField fullWidth required id="email" label="Email Address" name="email" type="email" autoComplete="email" variant="outlined" value={loginInfo.email} onChange={handleChange} disabled={loading || googleLoading} InputProps={{ sx: { borderRadius: 1 } }} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth required id="password" label="Password" name="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="current-password" variant="outlined"
                                                value={loginInfo.password} onChange={handleChange} disabled={loading || googleLoading}
                                                InputProps={{
                                                    sx: { borderRadius: 1 },
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton aria-label={showPassword ? "Hide password" : "Show password"} onClick={togglePasswordVisibility} edge="end" disabled={loading || googleLoading}>
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sx={{ textAlign: 'right' }}>
                                            <Link component="button" type="button" variant="body2" onClick={handleForgotPassword} disabled={loading || googleLoading} sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' }, cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer' }}>
                                                Forgot password?
                                            </Link>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading || googleLoading}
                                                sx={{ py: 1.5, borderRadius: 1, fontWeight: "medium", background: "linear-gradient(90deg, #2A9D8F 0%, #238A7E 100%)", transition: "all 0.2s ease-in-out", position: 'relative', '&:hover': { background: "linear-gradient(90deg, #238A7E 0%, #2A9D8F 100%)", transform: "translateY(-1px)", boxShadow: "0 2px 6px rgba(42, 157, 143, 0.3)" }, '&.Mui-disabled': { background: theme.palette.action.disabledBackground, cursor: 'not-allowed' } }}
                                            >
                                                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                                <Divider sx={{ my: 2.5 }}>
                                    <Typography variant="body2" color="text.secondary">OR</Typography>
                                </Divider>
                                <Button
                                    fullWidth variant="outlined" color="primary" size="large"
                                    startIcon={<GoogleIcon />}
                                    onClick={handleGoogleLogin}
                                    disabled={loading || googleLoading}
                                    sx={{ py: 1.5, borderRadius: 1, borderColor: 'primary.main', color: 'primary.main', '&:hover': { backgroundColor: 'rgba(42, 157, 143, 0.04)'} }}
                                >
                                     {googleLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In with Google"}
                                </Button>
                                <Box sx={{ mt: 2.5, textAlign: "center" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Don't have an account?{" "}
                                        <Link href="/signup" underline="hover" color="primary.main" fontWeight="500">
                                            Sign Up
                                        </Link>
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default Login;
