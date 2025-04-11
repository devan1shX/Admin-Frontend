import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const API_BASE_URL = "http://192.168.1.148:5001";

const Dashboard = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  // Check if user is authenticated on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Logout handler - clear token and redirect immediately
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // States for data and error
  const [data, setData] = useState(() => {
    const cachedData = localStorage.getItem("techData");
    return cachedData ? JSON.parse(cachedData) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for search, filters and pagination
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

  // State for extra stats collapse (genre distribution and top innovators)
  const [showExtraStats, setShowExtraStats] = useState(false);

  // States for deletion modal
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [techToDelete, setTechToDelete] = useState(null);

  // Fetch technology data with authentication
  const getAllTechs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/technologies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch technologies");
      }
      const res = await response.json();
      if (Array.isArray(res)) {
        setData(res);
        localStorage.setItem("techData", JSON.stringify(res));
      } else {
        console.error("Unexpected data format:", res);
        setData([]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllTechs();
  }, []);

  useEffect(() => {
    localStorage.setItem("techSearchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("techPage", page);
  }, [page]);

  // Compute dashboard statistics
  const totalTechs = data.length;
  const genreCounts = {};
  data.forEach((tech) => {
    if (tech.genre) {
      genreCounts[tech.genre] = (genreCounts[tech.genre] || 0) + 1;
    }
  });
  const uniqueGenresCount = Object.keys(genreCounts).length;

  const innovatorsTechMap = {};
  data.forEach((tech) => {
    if (tech.innovators) {
      if (Array.isArray(tech.innovators)) {
        // Handle the new schema format where innovators is an array of objects
        tech.innovators.forEach((innovator) => {
          if (innovator && innovator.name) {
            const name = innovator.name.trim();
            if (name) {
              innovatorsTechMap[name] = (innovatorsTechMap[name] || 0) + 1;
            }
          }
        });
      } else if (typeof tech.innovators === "string") {
        // Handle legacy format where innovators was a string
        const names = tech.innovators.split(/[\/,]/);
        names.forEach((name) => {
          const trimmed = name.trim();
          if (trimmed) {
            innovatorsTechMap[trimmed] = (innovatorsTechMap[trimmed] || 0) + 1;
          }
        });
      }
    }
  });

  const totalInnovators = Object.keys(innovatorsTechMap).length;

  let totalAdvantages = 0;
  let totalApplications = 0;
  let totalUseCases = 0;
  data.forEach((tech) => {
    if (Array.isArray(tech.advantages))
      totalAdvantages += tech.advantages.length;
    if (Array.isArray(tech.applications))
      totalApplications += tech.applications.length;
    if (Array.isArray(tech.useCases)) totalUseCases += tech.useCases.length;
  });

  // Smaller Stat Card for hero section
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
        "&:hover": {
          transform: "translateY(-4px)",
        },
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

  // Filter data for the technology list
  const filteredData = data.filter((item) => {
    const lowerQuery = searchQuery.toLowerCase();
    if (
      !item.name.toLowerCase().includes(lowerQuery) &&
      !(item.id && item.id.toString().toLowerCase().includes(lowerQuery))
    ) {
      return false;
    }
    if (
      filterGenre &&
      (!item.genre ||
        !item.genre.toLowerCase().includes(filterGenre.toLowerCase()))
    ) {
      return false;
    }
    if (filterInnovators && item.innovators) {
      // Updated filtering for new innovators structure
      if (Array.isArray(item.innovators)) {
        const hasMatchingInnovator = item.innovators.some(
          (innovator) =>
            innovator &&
            innovator.name &&
            innovator.name
              .toLowerCase()
              .includes(filterInnovators.toLowerCase())
        );
        if (!hasMatchingInnovator) return false;
      } else if (typeof item.innovators === "string") {
        // For backward compatibility with old format
        if (
          !item.innovators
            .toLowerCase()
            .includes(filterInnovators.toLowerCase())
        ) {
          return false;
        }
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentPageData = filteredData.slice(startIndex, startIndex + perPage);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Delete functionality
  const requestDeleteTechnology = (id) => {
    setTechToDelete(id);
    setOpenDeleteDialog(true);
  };

  const deleteTech = async (id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/technologies/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to delete technology");
    return await response.json();
  };

  const confirmDeleteTechnology = async () => {
    try {
      await deleteTech(techToDelete);
      const newUpdatedTechs = data.filter(
        (currTech) => currTech.id !== techToDelete
      );
      setData(newUpdatedTechs);
      localStorage.setItem("techData", JSON.stringify(newUpdatedTechs));
    } catch (error) {
      console.error("Error deleting technology:", error);
    } finally {
      setOpenDeleteDialog(false);
      setTechToDelete(null);
    }
  };

  const cancelDeleteTechnology = () => {
    setOpenDeleteDialog(false);
    setTechToDelete(null);
  };

  // Consistent height for search bar & add button
  const consistentHeight = 56;

  return (
    <Layout title="Admin Dashboard">
      {/* Wrap main content inside a container Box with a specified maxWidth */}
      <Box sx={{ background: "#F5F5F5", p: 0 }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          {/* Header Section with Logout Button */}
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
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor, manage and analyze your technology innovations
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ textTransform: "none" }}
            >
              Logout
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
              <Typography>Error: {error.message}</Typography>
            </Paper>
          ) : (
            <>
              {/* Hero Section: Stat Cards */}
              <Box sx={{ px: 2 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={TrendingUp}
                      title="Total Technologies"
                      value={totalTechs}
                      subtitle="Active techs"
                      color="#2196f3"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={Category}
                      title="Unique Genres"
                      value={uniqueGenresCount}
                      subtitle={`Out of ${totalTechs}`}
                      color="#4caf50"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={Group}
                      title="Total Innovators"
                      value={totalInnovators}
                      subtitle="Contributors"
                      color="#ff9800"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                      icon={Analytics}
                      title="Total Applications"
                      value={totalApplications}
                      subtitle={`${totalUseCases} use cases`}
                      color="#9c27b0"
                    />
                  </Grid>
                </Grid>

                {/* Toggle Extra Stats Section with centered arrow */}
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
                  {/* When extra stats are closed, render divider right here */}
                  {!showExtraStats && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Extra Stats: Genre Distribution & Top Innovators (Collapsible) */}
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
                {/* When extra stats are open, render divider after them */}
                <Box sx={{ px: 2, mb: 2 }}>
                  <Divider />
                </Box>
              </Collapse>

              {/* Technology Management Section */}
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

                {/* Search & Filter Bar */}
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={8} md={8}>
                    <Paper
                      component="form"
                      sx={{
                        p: "4px 8px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 2,
                        boxShadow: "none",
                        border: `1px solid ${theme.palette.divider}`,
                        transition: "border-color 0.3s",
                        "&:hover": {
                          borderColor: theme.palette.text.primary,
                        },
                        minHeight: consistentHeight,
                      }}
                    >
                      <InputAdornment sx={{ pl: 1 }}>
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
                  <Grid item xs={12} sm={4} md={4}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate("/add-technology")}
                      fullWidth
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

                {/* Advanced Filters */}
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

                {loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 400,
                    }}
                  >
                    <CircularProgress size={60} thickness={4} />
                  </Box>
                ) : (
                  <Fade in={!loading}>
                    <Box>
                      {currentPageData.length > 0 ? (
                        <TechList
                          techs={currentPageData}
                          onDeleteTech={requestDeleteTechnology}
                        />
                      ) : (
                        <Typography
                          variant="h6"
                          textAlign="center"
                          sx={{ mt: 4, color: "text.secondary" }}
                        >
                          No technologies found. Try a different search or add a
                          new technology.
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
                            color="gray"
                            size={isMobile ? "small" : "large"}
                            shape="rounded"
                          />
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}
              </Box>
            </>
          )}

          {/* Delete Confirmation Dialog */}
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
