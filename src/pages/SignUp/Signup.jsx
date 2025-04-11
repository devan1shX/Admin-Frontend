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
import { Visibility, VisibilityOff, PersonAddOutlined } from "@mui/icons-material"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/iiitdlogo.png"

const Signup = () => {
  const [signUpInfo, setSignUpInfo] = useState({
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
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                "& > fieldset": {
                  borderColor: "#2A9D8F",
                },
              },
              "&.Mui-focused fieldset": {
                borderColor: "#2A9D8F",
                borderWidth: "2px",
              },
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#2A9D8F",
            },
          },
        },
      },
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setSignUpInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validation
    if (signUpInfo.password.length < 6) {
      toast.error("Password should be at least 6 characters long", { position: "top-center" })
      return
    }

    try {
      const url = "http://192.168.1.148:5001/auth/signup"
      const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signUpInfo.email,
          password: signUpInfo.password,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 409) {
          toast.error("User already exists. Please try with a different email.", { position: "top-center" })
        } else if (response.status === 400) {
          toast.error(result.error || "Invalid signup details", { position: "top-center" })
        } else {
          toast.error("Signup failed. Please try again later.", { position: "top-center" })
        }
        return
      }

      toast.success("Signup successful! 🎉", { position: "top-center" })
      setTimeout(() => {
        navigate("/login")
      }, 1000)
    } catch (err) {
      console.error("Error during signup:", err)
      toast.error("Signup failed. Please try again.", { position: "top-center" })
    }
  }

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
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.default",
        }}
      >
        {/* Header with logo */}
        <Box
          component="header"
          sx={{
            height: 70,
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
              transform: "translateY(-50%) scale(1.2)",
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
                <PersonAddOutlined sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="h1" fontWeight="500">
                  Create an account
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Sign up with your email and password
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    {/* Email Address */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        variant="outlined"
                        required
                        value={signUpInfo.email}
                        onChange={handleChange}
                        placeholder="example@example.com"
                        InputProps={{ sx: { borderRadius: 1 } }}
                      />
                    </Grid>
                    {/* Password */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        variant="outlined"
                        required
                        value={signUpInfo.password}
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
                    {/* Submit Button */}
                    <Grid item xs={12}>
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
                        Create Account
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
                    Already have an account?{" "}
                    <Link href="/login" underline="hover" color="primary" fontWeight="500">
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
  )
}

export default Signup
