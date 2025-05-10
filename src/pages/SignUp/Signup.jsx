"use client"

import { useState } from "react";
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
    Divider,
    useMediaQuery,
    createTheme,
    ThemeProvider,
    CssBaseline,
    Link,
    CircularProgress
} from "@mui/material";
import { Visibility, VisibilityOff, PersonAddOutlined, Google as GoogleIcon } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/iiitdlogo.png";
import {
    auth,
    googleProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut
} from "../../firebase"; // Ensure this path is correct (e.g., src/firebase.js)

const API_BASE_URL = "http://192.168.1.148:5001";

const Signup = () => {
    const [signUpInfo, setSignUpInfo] = useState({ name: "", email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:600px)");

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
                            transition: "all 0.2s ease-in-out",
                            "&:hover": { "& > fieldset": { borderColor: "#2A9D8F" } },
                            "&.Mui-focused fieldset": { borderColor: "#2A9D8F", borderWidth: "2px" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#2A9D8F" },
                    },
                },
            },
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSignUpInfo((prev) => ({ ...prev, [name]: value }));
    };

    const createProfileOnBackend = async (firebaseUser, nameFromForm) => {
        if (!firebaseUser) {
            toast.error("Firebase user not available for profile creation.", { position: "top-center" });
            return false;
        }
        try {
            const idToken = await firebaseUser.getIdToken(true);
            const profileData = {
                name: nameFromForm || firebaseUser.displayName || firebaseUser.email.split('@')[0]
            };

            const response = await fetch(`${API_BASE_URL}/auth/create-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify(profileData),
            });

            const result = await response.json();
            if (!response.ok) {
                toast.error(result.message || "Failed to create user profile on backend.", { position: "top-center" });
                return false;
            }
            toast.success("Signup successful! Profile created. Please login.", { position: "top-center", autoClose: 2500 });
            return true;
        } catch (err) {
            console.error("Error creating profile on backend:", err);
            toast.error("Signup error: Could not create profile on backend.", { position: "top-center" });
            return false;
        }
    };

    const handleEmailPasswordSignup = async (e) => {
        e.preventDefault();
        if (!signUpInfo.email || !signUpInfo.password) {
            toast.error("Email and password are required.", { position: "top-center" });
            return;
        }
        if (signUpInfo.password.length < 6) {
            toast.error("Password should be at least 6 characters long.", { position: "top-center" });
            return;
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, signUpInfo.email, signUpInfo.password);
            const profileCreated = await createProfileOnBackend(userCredential.user, signUpInfo.name);
            
            await firebaseSignOut(auth);
            
            if (profileCreated) {
                setTimeout(() => navigate("/login"), 2500);
            }
        } catch (error) {
            console.error("Firebase email signup error:", error);
            let message = "Signup failed. Please try again.";
            if (error.code === "auth/email-already-in-use") {
                message = "This email is already registered. Try logging in.";
            } else if (error.code === "auth/invalid-email") {
                message = "Invalid email format.";
            } else if (error.code === "auth/weak-password") {
                message = "Password is too weak. Please choose a stronger password.";
            }
            toast.error(message, { position: "top-center" });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            
            const profileCreated = await createProfileOnBackend(firebaseUser, firebaseUser.displayName);
            
            await firebaseSignOut(auth);

            if (profileCreated) {
                setTimeout(() => navigate("/login"), 2500);
            }
        } catch (error) {
            console.error("Google sign-up error:", error);
            let message = "Google Sign-Up failed.";
            if (error.code === "auth/popup-closed-by-user") {
                message = "Sign-up popup closed. Please try again.";
            } else if (error.code === "auth/email-already-in-use" || error.code === "auth/account-exists-with-different-credential") {
                 message = "This email is already registered. Try logging in or use a different Google account.";
            } else if (error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-blocked") {
                message = "Popup blocked or cancelled. Please enable popups and try again.";
            }
            toast.error(message, { position: "top-center" });
        } finally {
            setGoogleLoading(false);
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
                <Box component="header" sx={{ height: 70, px: 3, borderBottom: "1px solid #e0e0e0", backgroundColor: "#fff", display: "flex", justifyContent: "center", alignItems: "center", position: "sticky", top: 0, zIndex: 1100, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <Box component="img" src={logo} alt="IIIT Delhi Logo" sx={{ maxHeight: '80%', maxWidth: 180, objectFit: "contain" }} />
                </Box>
                <Container maxWidth="sm" sx={{ flex: 1, py: isMobile ? 2 : 4, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Paper elevation={3} sx={{ width: "100%", maxWidth: 500, overflow: "hidden", borderRadius: 2, transition: "box-shadow 0.3s ease-in-out", '&:hover': { boxShadow: theme.shadows[6] } }}>
                            <Box sx={{ p: 3, background: "linear-gradient(135deg, #2A9D8F 0%, #238A7E 100%)", color: "white", textAlign: "center", borderBottom: "4px solid rgba(138, 111, 223, 0.5)" }}>
                                <PersonAddOutlined sx={{ fontSize: 32, mb: 1 }} />
                                <Typography variant="h5" component="h1" fontWeight="500">Create Admin Account</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>Join the admin panel</Typography>
                            </Box>
                            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                <form onSubmit={handleEmailPasswordSignup} noValidate>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField fullWidth label="Full Name (Optional)" name="name" id="name" autoComplete="name" variant="outlined" value={signUpInfo.name} onChange={handleChange} disabled={loading || googleLoading} InputProps={{ sx: { borderRadius: 1 } }} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField fullWidth required label="Email Address" name="email" id="email" type="email" autoComplete="email" variant="outlined" value={signUpInfo.email} onChange={handleChange} disabled={loading || googleLoading} InputProps={{ sx: { borderRadius: 1 } }} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth required label="Password (min. 6 characters)" name="password" id="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="new-password" variant="outlined"
                                                value={signUpInfo.password} onChange={handleChange} disabled={loading || googleLoading}
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
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth type="submit" variant="contained" color="primary" size="large" disabled={loading || googleLoading}
                                                sx={{ py: 1.5, borderRadius: 1, fontWeight: "medium", background: "linear-gradient(90deg, #2A9D8F 0%, #238A7E 100%)", transition: "all 0.2s ease-in-out", position: 'relative', '&:hover': { background: "linear-gradient(90deg, #238A7E 0%, #2A9D8F 100%)", transform: "translateY(-1px)", boxShadow: "0 2px 6px rgba(42, 157, 143, 0.3)" }, '&.Mui-disabled': { background: theme.palette.action.disabledBackground, cursor: 'not-allowed' } }}
                                            >
                                                {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                                <Divider sx={{ my: 2.5 }}><Typography variant="body2" color="text.secondary">OR</Typography></Divider>
                                <Button
                                    fullWidth variant="outlined" color="primary" size="large"
                                    startIcon={<GoogleIcon />}
                                    onClick={handleGoogleSignup}
                                    disabled={loading || googleLoading}
                                    sx={{ py: 1.5, borderRadius: 1, borderColor: 'primary.main', color: 'primary.main', '&:hover': { backgroundColor: 'rgba(42, 157, 143, 0.04)'} }}
                                >
                                    {googleLoading ? <CircularProgress size={24} color="inherit" /> : "Sign Up with Google"}
                                </Button>
                                <Box sx={{ mt: 2.5, textAlign: "center" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Already have an account?{" "}
                                        <Link href="/login" underline="hover" color="primary.main" fontWeight="500">
                                            Sign In
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

export default Signup;
