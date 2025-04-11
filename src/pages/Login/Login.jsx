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
  Divider,
  useMediaQuery,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Link,
} from "@mui/material"
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/iiitdlogo.png"

const Login = () => {
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const isMobile = useMediaQuery("(max-width:600px)")

  // Custom theme based on the IIIT Delhi website colors
  const theme = createTheme({
    palette: {
      primary: {
        main: "#2A9D8F",
      },
      secondary: {
        main: "#8A6FDF",
      },
      background: {
        default: "#f5f5f7",
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              "&.Mui-focused fieldset": {
                borderColor: "#2A9D8F",
              },
            },
          },
        },
      },
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setLoginInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = "http://localhost:5001/auth/login"; // Ensure your backend runs on 5001
      const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginInfo),
      });
      const result = await response.json();

      if (!response.ok) {
        // Existing error handling...
        // Use result.message which is sent from the backend on failure
        toast.error(result.message || "Login failed. Please try again.", { position: "top-center" });
        return;
      }

      toast.success("Login successful! 🎉", { position: "top-center" });
      // *** FIX HERE: Use 'result.token' instead of 'result.jwtToken' ***
      localStorage.setItem("token", result.token);
      // Optionally store user info too if needed
      if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
      }

      setTimeout(() => {
        navigate("/admin-dashboard"); // Or wherever you redirect after login
      }, 1000);
    } catch (err) {
      console.error("Error during login request:", err); // Log the actual error
      toast.error("Login failed. Check connection or server status.", { position: "top-center" });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer />
      <Box
        sx={{
          minHeight: "100vh",
          overflow: "hidden", // Prevent scrolling
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.default",
        }}
      >
        {/* Header with logo */}
        <Box
          component="header"
          sx={{
            height: 70, // Fixed header height
            px: 3,
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="IIIT Delhi Logo"
            sx={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%) scale(1.2)", // Enlarged logo with vertical centering
              maxWidth: 180,
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Main content */}
        <Container maxWidth="sm" sx={{ flex: 1, py: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: isMobile ? 2 : 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                overflow: "hidden",
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: "linear-gradient(135deg, #2A9D8F 0%, #238A7E 100%)",
                  color: "white",
                  textAlign: "center",
                  borderBottom: "4px solid rgba(138, 111, 223, 0.5)",
                }}
              >
                <LockOutlined sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="h1" fontWeight="500">
                  Sign in to your account
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Enter your credentials to access the admin dashboard
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        variant="outlined"
                        required
                        value={loginInfo.email}
                        onChange={handleChange}
                        placeholder="admin@example.com"
                        InputProps={{ sx: { borderRadius: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        variant="outlined"
                        required
                        value={loginInfo.password}
                        onChange={handleChange}
                        InputProps={{
                          sx: { borderRadius: 1 },
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={togglePasswordVisibility}
                                edge="end"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                        <Link href="#" variant="body2" underline="hover" color="primary">
                          Forgot password?
                        </Link>
                      </Box>
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{
                          py: 1.5,
                          borderRadius: 1,
                          fontWeight: "medium",
                          background: "linear-gradient(90deg, #2A9D8F 0%, #238A7E 100%)",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            background: "linear-gradient(90deg, #238A7E 0%, #2A9D8F 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 8px rgba(42, 157, 143, 0.25)",
                          },
                        }}
                      >
                        Sign In
                      </Button>
                    </Grid>
                  </Grid>
                </form>

                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{" "}
                    <Link href="/signup" underline="hover" color="primary" fontWeight="500">
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
  )
}

export default Login
