"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import TechList from "./TechList";

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Button,
  InputAdornment,
  Pagination,
  Fade,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  Category,
  Group,
  Analytics,
  Search,
  Add,
  FilterList,
  Info,
  Login as LoginIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = "http://192.168.1.148:5001";

const getUserInfo = () => {
  const userString = localStorage.getItem("user");
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (e) {
      console.error("Failed to parse user info from localStorage", e);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  }
  return null;
};

const getToken = () => {
  return localStorage.getItem("token");
};

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState(
    () => localStorage.getItem("techSearchQuery") || ""
  );
  const [filterGenre, setFilterGenre] = useState("");
  const [filterInnovators, setFilterInnovators] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(
    () => Number(localStorage.getItem("techPage")) || 1
  );
  const perPage = 9;

  const [showExtraStats, setShowExtraStats] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [techToDelete, setTechToDelete] = useState(null);

  useEffect(() => {
    const token = getToken();
    const userInfo = getUserInfo();
    if (token && userInfo && userInfo.role) {
      setUserRole(userInfo.role);
      setIsAuthenticated(true);
      setLoading(true);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setLoading(false);
      console.warn("Dashboard: User not authenticated or role missing.");
      navigate("/login");
    }
  }, [navigate]);

  const getAllTechs = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const token = getToken();

    if (!token) {
      setError("Authentication error. Please log in again.");
      setIsAuthenticated(false);
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/technologies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        let errorMsg = "Failed to fetch technologies";
        if (response.status === 401 || response.status === 403) {
          errorMsg =
            "Access Denied fetching technologies. Your session might have expired.";
          setIsAuthenticated(false);
          setUserRole(null);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("techData");
          setData([]);
          navigate("/login");
        }
        throw new Error(errorMsg);
      }
      const res = await response.json();
      if (Array.isArray(res)) {
        setData(res);
        localStorage.setItem("techData", JSON.stringify(res));
      } else {
        console.error("Unexpected data format received for technologies:", res);
        setData([]);
        setError("Received invalid data format.");
      }
    } catch (err) {
      console.error("Error in getAllTechs:", err);
      setError(err.message || "An error occurred while fetching data.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      getAllTechs();
    }
  }, [isAuthenticated, getAllTechs]);

  useEffect(() => {
    localStorage.setItem("techSearchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("techPage", String(page));
  }, [page]);

  const {
    totalTechs,
    uniqueGenresCount,
    totalInnovators,
    totalApplications,
    totalUseCases,
    genreCounts,
    innovatorsTechMap,
  } = useMemo(() => {
    const genreMap = {};
    const innovatorMap = {};
    let appCount = 0;
    let caseCount = 0;

    data.forEach((tech) => {
      if (tech?.genre) {
        genreMap[tech.genre] = (genreMap[tech.genre] || 0) + 1;
      }
      if (tech?.innovators) {
        if (Array.isArray(tech.innovators)) {
          tech.innovators.forEach((innovator) => {
            if (innovator?.name) {
              const name = innovator.name.trim();
              if (name) innovatorMap[name] = (innovatorMap[name] || 0) + 1;
            }
          });
        } else if (typeof tech.innovators === "string") {
          tech.innovators.split(/[\/,]/).forEach((name) => {
            const trimmed = name.trim();
            if (trimmed)
              innovatorMap[trimmed] = (innovatorMap[trimmed] || 0) + 1;
          });
        }
      }
      if (Array.isArray(tech.applications))
        appCount += tech.applications.length;
      if (Array.isArray(tech.useCases)) caseCount += tech.useCases.length;
    });

    return {
      totalTechs: data.length,
      genreCounts: genreMap,
      uniqueGenresCount: Object.keys(genreMap).length,
      innovatorsTechMap: innovatorMap,
      totalInnovators: Object.keys(innovatorMap).length,
      totalApplications: appCount,
      totalUseCases: caseCount,
    };
  }, [data]);

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(230, 230, 230, 0.5)",
        borderRadius: "16px",
        p: 1,
        transition: "transform 0.2s ease-in-out",
        wordBreak: "break-word",
        "&:hover": { transform: "translateY(-4px)" },
      }}
    >
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box
            sx={{
              p: 0.5,
              borderRadius: "12px",
              backgroundColor: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 0.5,
            }}
          >
            <Icon sx={{ color: color, fontSize: "1.2rem" }} />
          </Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontWeight: 500, wordBreak: "break-word" }}
          >
            {title}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          sx={{ mb: 0.25, fontWeight: 600, wordBreak: "break-word" }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ wordBreak: "break-word" }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const filteredData = data.filter((item) => {
    const lowerQuery = searchQuery.toLowerCase();
    if (!item?.name) return false;
    const nameMatch = item.name.toLowerCase().includes(lowerQuery);
    const idMatch = item.id?.toString().toLowerCase().includes(lowerQuery);
    const descriptionMatch = item.description
      ?.toLowerCase()
      .includes(lowerQuery);
    if (!nameMatch && !idMatch && !descriptionMatch && searchQuery) {
      return false;
    }
    if (
      filterGenre &&
      item.genre?.toLowerCase() !== filterGenre.toLowerCase()
    ) {
      return false;
    }
    if (filterInnovators && item.innovators) {
      let innovatorMatch = false;
      if (Array.isArray(item.innovators)) {
        innovatorMatch = item.innovators.some((innovator) =>
          innovator?.name
            ?.toLowerCase()
            .includes(filterInnovators.toLowerCase())
        );
      } else if (typeof item.innovators === "string") {
        innovatorMatch = item.innovators
          .toLowerCase()
          .includes(filterInnovators.toLowerCase());
      }
      if (!innovatorMatch) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentPageData = filteredData.slice(startIndex, startIndex + perPage);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const isAdmin = isAuthenticated && userRole === "admin";

  const requestEditTechnology = (techId) => {
    if (isAdmin) {
      navigate(`/edit-technology/${techId}`);
    } else if (userRole === "employee") {
      toast.error("Permission denied. Employees cannot edit technologies.", {
        position: "top-center",
      });
    } else {
      toast.error("You do not have permission to edit technologies.", {
        position: "top-center",
      });
    }
  };

  const requestShowDetails = (technology) => { // New function
    navigate(`/tech-detail/${technology.id}`, { state: { technology } });
  };

  const requestDeleteTechnology = (id) => {
    if (!isAdmin) {
      toast.error("Permission denied. Only Admins can delete technologies.", {
        position: "top-center",
      });
      return;
    }
    setTechToDelete(id);
    setOpenDeleteDialog(true);
  };

  const deleteTechAPI = async (id) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token missing.");
    }
    if (!isAdmin) {
      throw new Error("Permission denied.");
    }
    const response = await fetch(`${API_BASE_URL}/technologies/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      let errorMsg = "Failed to delete technology";
      if (response.status === 403) {
        errorMsg = "Permission denied to delete technology.";
      } else if (response.status === 401) {
        errorMsg = "Authentication failed. Please log in again.";
        setIsAuthenticated(false);
        setUserRole(null);
        localStorage.clear();
        navigate("/login");
      } else if (response.status === 404) {
        errorMsg = "Technology not found.";
      }
      try {
        const errData = await response.json();
        errorMsg = errData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return await response.json();
  };

  const confirmDeleteTechnology = async () => {
    if (!techToDelete || !isAdmin) {
      toast.error("Action not allowed or item not selected.", {
        position: "top-center",
      });
      setOpenDeleteDialog(false);
      setTechToDelete(null);
      return;
    }
    try {
      const result = await deleteTechAPI(techToDelete);
      toast.success(result.message || "Technology deleted successfully!", {
        position: "top-center",
      });
      getAllTechs();
      if (currentPageData.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error("Error deleting technology:", error);
      toast.error(`Error deleting technology: ${error.message}`, {
        position: "top-center",
      });
    } finally {
      setOpenDeleteDialog(false);
      setTechToDelete(null);
    }
  };

  const cancelDeleteTechnology = () => {
    setOpenDeleteDialog(false);
    setTechToDelete(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("techData");
    setIsAuthenticated(false);
    setUserRole(null);
    navigate("/login");
  };

  const consistentHeight = 56;

  if (!loading && !isAuthenticated) {
    return (
      <Layout title="Dashboard - Login Required">
        <ToastContainer position="top-center" autoClose={3000} />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "calc(100vh - 150px)",
          }}
        >
          <Alert
            severity="warning"
            sx={{ mb: 3, width: "100%", maxWidth: "500px" }}
          >
            Please log in to access the Admin Dashboard.
            {error && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                ({error})
              </Typography>
            )}
          </Alert>
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={() => navigate("/login")}
          >
            {" "}
            Go to Login{" "}
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <ToastContainer position="top-center" autoClose={3000} />
      <Box sx={{ background: "#F5F5F5", p: { xs: 1, sm: 2 } }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
              px: 2,
              wordBreak: "break-word",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, mb: 1, color: "black" }}
              >
                {" "}
                Dashboard Overview{" "}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {" "}
                Monitor, manage and analyze your technology innovations{" "}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ textTransform: "none" }}
            >
              {" "}
              Logout{" "}
            </Button>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
              }}
            >
              <CircularProgress size={60} />
            </Box>
          ) : error ? (
            <Paper
              sx={{
                p: 3,
                bgcolor: "#fff3f3",
                color: "error.main",
                borderRadius: 2,
                mx: 2,
              }}
            >
              <Typography>Error loading dashboard data: {error}</Typography>
              <Button onClick={getAllTechs} sx={{ mt: 1 }}>
                Retry
              </Button>
            </Paper>
          ) : (
            <>
              <Box sx={{ px: 2 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={TrendingUp}
                      title="Total Technologies"
                      value={totalTechs}
                      subtitle="Active innovations"
                      color="#2196f3"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={Category}
                      title="Unique Genres"
                      value={uniqueGenresCount}
                      subtitle={`Across ${totalTechs} techs`}
                      color="#4caf50"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={Group}
                      title="Total Innovators"
                      value={totalInnovators}
                      subtitle="Unique contributors"
                      color="#ff9800"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={Analytics}
                      title="Applications"
                      value={totalApplications}
                      subtitle={`${totalUseCases} use cases`}
                      color="#9c27b0"
                    />
                  </Grid>
                </Grid>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Button
                    onClick={() => setShowExtraStats((prev) => !prev)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      color: "black",
                      minWidth: "40px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ExpandMoreIcon
                      sx={{
                        transform: showExtraStats
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.4s ease",
                      }}
                    />
                  </Button>
                  {!showExtraStats && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  )}
                </Box>
              </Box>

              <Collapse
                in={showExtraStats}
                timeout={{ enter: 600, exit: 400 }}
                easing={{ enter: "ease-out", exit: "ease-in" }}
              >
                <Box sx={{ px: 2, mb: 4, pt: 1 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: "16px",
                          border: "1px solid rgba(230, 230, 230, 0.5)",
                          height: "100%",
                          wordBreak: "break-word",
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                              Genre Distribution
                            </Typography>
                            <Tooltip title="Distribution of technologies across different genres">
                              <IconButton size="small">
                                <Info fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                            {Object.entries(genreCounts).map(
                              ([genre, count], index) => (
                                <Box key={genre} sx={{ mb: 2 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mb: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {genre}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight="500"
                                    >
                                      {count}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      width: "100%",
                                      height: "6px",
                                      borderRadius: "3px",
                                      bgcolor: "grey.100",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${(count / totalTechs) * 100}%`,
                                        height: "100%",
                                        bgcolor: `hsl(${
                                          index * 137.5
                                        }, 70%, 50%)`,
                                        transition: "width 0.5s ease-in-out",
                                      }}
                                    />
                                  </Box>
                                </Box>
                              )
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: "16px",
                          border: "1px solid rgba(230, 230, 230, 0.5)",
                          height: "100%",
                          wordBreak: "break-word",
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{ mb: 2, fontWeight: 500 }}
                          >
                            Top Innovators
                          </Typography>
                          <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                            {Object.entries(innovatorsTechMap)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 10)
                              .map(([innovator, count], index) => (
                                <Box
                                  key={innovator}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: "8px",
                                    bgcolor:
                                      index % 2 === 0
                                        ? "rgba(0,0,0,0.02)"
                                        : "transparent",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  <Typography variant="body2">
                                    {innovator}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 500,
                                      color: "primary.main",
                                    }}
                                  >
                                    {count}{" "}
                                    {count === 1
                                      ? "technology"
                                      : "technologies"}
                                  </Typography>
                                </Box>
                              ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ px: 2, mb: 2 }}>
                  <Divider />
                </Box>
              </Collapse>

              <Box sx={{ mb: 4, mt: 2, px: 2, wordBreak: "break-word" }}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      background: "linear-gradient(45deg, #141E30, #243B55)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Technology Innovations
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Explore and manage cutting-edge technologies
                  </Typography>
                </Box>

                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={true}>
                    <Paper
                      component="form"
                      onSubmit={(e) => e.preventDefault()}
                      sx={{
                        p: "4px 8px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 2,
                        boxShadow: "none",
                        border: `1px solid ${theme.palette.divider}`,
                        transition: "border-color 0.3s",
                        "&:hover": { borderColor: theme.palette.text.primary },
                        minHeight: consistentHeight,
                      }}
                    >
                      <InputAdornment position="start" sx={{ pl: 1 }}>
                        <Search color="action" />
                      </InputAdornment>
                      <TextField
                        placeholder="Search technologies..."
                        variant="standard"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        InputProps={{
                          disableUnderline: true,
                          sx: { ml: 1 },
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowFilters((prev) => !prev)}
                              >
                                <FilterList color="action" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={"auto"}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate("/add-technology")}
                      fullWidth={isMobile}
                      sx={{
                        height: consistentHeight,
                        borderRadius: 2,
                        background: "linear-gradient(90deg, #141E30, #243B55)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        transition: "all 0.3s",
                        "&:hover": {
                          boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      Add Technology
                    </Button>
                  </Grid>
                </Grid>

                <Collapse in={showFilters} timeout={400} unmountOnExit>
                  <Paper
                    sx={{
                      p: 2,
                      mb: 3,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      mt: 1,
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Filter by Genre"
                          variant="outlined"
                          size="small"
                          value={filterGenre}
                          onChange={(e) => {
                            setFilterGenre(e.target.value);
                            setPage(1);
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Filter by Innovators"
                          variant="outlined"
                          size="small"
                          value={filterInnovators}
                          onChange={(e) => {
                            setFilterInnovators(e.target.value);
                            setPage(1);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Collapse>

                <Fade in={!loading}>
                  <Box>
                    {currentPageData.length > 0 ? (
                      <TechList
                        techs={currentPageData}
                        onDeleteTech={requestDeleteTechnology}
                        onEditTech={requestEditTechnology}
                        onShowDetails={requestShowDetails} 
                        isAdmin={isAdmin}
                      />
                    ) : (
                      <Typography
                        variant="h6"
                        textAlign="center"
                        sx={{ mt: 4, color: "text.secondary" }}
                      >
                        No technologies found matching your criteria.
                      </Typography>
                    )}
                    {totalPages > 1 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mt: 6,
                        }}
                      >
                        <Pagination
                          count={totalPages}
                          page={page}
                          onChange={handlePageChange}
                          color="primary"
                          size={isMobile ? "small" : "large"}
                          shape="rounded"
                        />
                      </Box>
                    )}
                  </Box>
                </Fade>
              </Box>
            </>
          )}

          <Dialog
            open={openDeleteDialog}
            onClose={cancelDeleteTechnology}
            aria-labelledby="delete-confirmation-dialog"
            PaperProps={{
              sx: {
                borderRadius: 2,
                backgroundColor: "#f6f8fa",
                boxShadow: "0 4px 12px rgba(27,31,35,0.15)",
                border: "1px solid #d1d5da",
                maxWidth: "400px",
                m: 2,
              },
            }}
          >
            <DialogTitle
              id="delete-confirmation-dialog"
              sx={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#24292e",
                pb: 0,
              }}
            >
              Confirm Deletion
            </DialogTitle>
            <DialogContent sx={{ pb: 0 }}>
              <DialogContentText
                sx={{ fontSize: "0.875rem", color: "#586069" }}
              >
                Are you sure you want to delete this technology? This action
                cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ pt: 2, pb: 2, px: 3 }}>
              <Button
                onClick={cancelDeleteTechnology}
                variant="outlined"
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  borderColor: "#d1d5da",
                  color: "#586069",
                  "&:hover": {
                    borderColor: "#c6cbd1",
                    backgroundColor: "#f6f8fa",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteTechnology}
                variant="contained"
                color="error"
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  backgroundColor: "black",
                  "&:hover": { backgroundColor: "gray" },
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;
