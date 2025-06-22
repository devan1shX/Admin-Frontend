"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import TechList from "./TechList";
import { auth, signOut as firebaseSignOut } from "../firebase";
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
  MenuItem,
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
  Logout as LogoutIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = "https://otmt.iiitd.edu.in/api";

const getUserInfoFromStorage = () => {
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

const getTokenFromStorage = () => {
  return localStorage.getItem("token");
};

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 2020; year--) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
};
const yearOptions = generateYearOptions();

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(() => getUserInfoFromStorage());
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!(getTokenFromStorage() && getUserInfoFromStorage())
  );

  const [data, setData] = useState(() => {
    const cachedData = localStorage.getItem("techData");
    try {
      return cachedData ? JSON.parse(cachedData) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(!data.length);
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
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDateType, setFilterDateType] = useState("createdAt");
  const [showExtraStats, setShowExtraStats] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [techToDelete, setTechToDelete] = useState(null);
  const perPage = 9;

  const clearSessionAndLogout = useCallback(
    async (toastMessage) => {
      if (toastMessage) {
        toast.error(toastMessage, { position: "top-center" });
      }
      await firebaseSignOut(auth).catch(console.error);
      localStorage.clear();
      setIsAuthenticated(false);
      setUserInfo(null);
      setData([]);
      navigate("/login");
    },
    [navigate]
  );

  useEffect(() => {
    if (
      !isAuthenticated &&
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/signup"
    ) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const getAllTechs = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    const token = getTokenFromStorage();

    if (!token) {
      clearSessionAndLogout("Authentication error. Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/technologies`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        let errorMsg = result.message || "Failed to fetch technologies";

        if (response.status === 401 || response.status === 403) {
          const sessionEndMsg =
            result.message || "Access Denied. Your session might have expired.";
          await clearSessionAndLogout(sessionEndMsg);
        }
        throw new Error(errorMsg);
      }

      const res = await response.json();
      if (Array.isArray(res)) {
        setData(res);
        localStorage.setItem("techData", JSON.stringify(res));
      } else {
        setData([]);
        setError("Received invalid data format.");
      }
    } catch (err) {
      console.error("Error in getAllTechs:", err);
      if (!String(err.message).includes("session")) {
        setError(err.message || "An error occurred while fetching data.");
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, navigate, clearSessionAndLogout]);

  useEffect(() => {
    if (isAuthenticated) {
      getAllTechs();
    } else {
      setLoading(false);
      setData([]);
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

    (data || []).forEach((tech) => {
      if (tech?.genre) {
        genreMap[tech.genre] = (genreMap[tech.genre] || 0) + 1;
      }
      if (tech?.innovators) {
        let names = [];
        if (Array.isArray(tech.innovators)) {
          names = tech.innovators
            .map((innovator) => innovator?.name?.trim())
            .filter(Boolean);
        } else if (typeof tech.innovators === "string") {
          names = tech.innovators
            .split(/[\/,]/)
            .map((name) => name.trim())
            .filter(Boolean);
        }
        names.forEach((name) => {
          innovatorMap[name] = (innovatorMap[name] || 0) + 1;
        });
      }
      if (Array.isArray(tech.applications))
        appCount += tech.applications.length;
      if (Array.isArray(tech.useCases)) caseCount += tech.useCases.length;
    });

    return {
      totalTechs: (data || []).length,
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

  const filteredData = useMemo(
    () =>
      (data || []).filter((item) => {
        const lowerQuery = searchQuery.toLowerCase();

        const generalMatch =
          !searchQuery ||
          item.name?.toLowerCase().includes(lowerQuery) ||
          item.id?.toString().toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery);

        if (!generalMatch) return false;

        const genreMatch =
          !filterGenre ||
          item.genre?.toLowerCase() === filterGenre.toLowerCase();
        if (!genreMatch) return false;

        if (filterInnovators) {
          let innovatorsString = "";
          if (Array.isArray(item.innovators)) {
            innovatorsString = item.innovators.map((i) => i.name).join(", ");
          } else if (typeof item.innovators === "string") {
            innovatorsString = item.innovators;
          }
          if (
            !innovatorsString
              .toLowerCase()
              .includes(filterInnovators.toLowerCase())
          ) {
            return false;
          }
        }

        if ((filterMonth || filterYear) && item[filterDateType]) {
          try {
            const itemDate = new Date(item[filterDateType]);
            const monthMatch =
              !filterMonth || itemDate.getMonth() + 1 === parseInt(filterMonth);
            const yearMatch =
              !filterYear || itemDate.getFullYear() === parseInt(filterYear);

            if (!monthMatch || !yearMatch) {
              return false;
            }
          } catch (e) {
            return false;
          }
        }

        return true;
      }),
    [
      data,
      searchQuery,
      filterGenre,
      filterInnovators,
      filterMonth,
      filterYear,
      filterDateType,
    ]
  );

  const totalPages = Math.ceil(filteredData.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentPageData = filteredData.slice(startIndex, startIndex + perPage);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "height=600,width=800");
    if (printWindow) {
      const currentDate = new Date();
      const month = filterMonth
        ? monthOptions.find((m) => m.value === parseInt(filterMonth))?.label
        : currentDate.toLocaleString("default", { month: "long" });
      const year = filterYear || currentDate.getFullYear();
      const reportTitle = `Technology Report - ${month} ${year}`;

      const innovatorFilterText = filterInnovators
        ? `Innovator: ${filterInnovators}`
        : "";
      const genreFilterText = filterGenre ? `Genre: ${filterGenre}` : "";
      const monthFilterText = filterMonth
        ? `Month: ${
            monthOptions.find((m) => m.value === parseInt(filterMonth))?.label
          }`
        : "";
      const yearFilterText = filterYear ? `Year: ${filterYear}` : "";

      const activeFilters = [
        innovatorFilterText,
        genreFilterText,
        monthFilterText,
        yearFilterText,
      ]
        .filter(Boolean)
        .join(" | ");

      const reportHtml = `
        <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; padding: 20px; }
              h1, h2 { color: #333; }
              h2 { font-size: 1.2em; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f7f7f7; font-weight: 600; }
              tr:nth-child(even) { background-color: #fdfdfd; }
              .no-print { display: none; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>${reportTitle}</h1>
            ${activeFilters ? `<h2>Filters Applied: ${activeFilters}</h2>` : ""}
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>TRL</th>
                  <th>Description</th>
                  <th>Innovator(s)</th>
                  <th>Genre</th>
                  <th>Created At</th>
                  <th>Edited At</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData
                  .map((tech) => {
                    const innovators = Array.isArray(tech.innovators)
                      ? tech.innovators.map((i) => i.name).join(", ")
                      : tech.innovators || "N/A";
                    const createdAt = tech.createdAt
                      ? new Date(tech.createdAt).toLocaleDateString()
                      : "N/A";
                    const editedAt = tech.editedAt
                      ? new Date(tech.editedAt).toLocaleDateString()
                      : "N/A";

                    return `
                      <tr>
                        <td>${tech.name || "N/A"}</td>
                        <td>${tech.trl || "N/A"}</td>
                        <td>${tech.description || "NA"}</td>
                        <td>${innovators}</td>
                        <td>${tech.genre || "N/A"}</td>
                        <td>${createdAt}</td>
                        <td>${editedAt}</td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250); 
    } else {
      toast.error(
        "Could not open print window. Please disable pop-up blockers."
      );
    }
  };

  const canAddTech = userInfo?.addTech || userInfo?.role === "superAdmin";
  const canEditTech = userInfo?.editTech || userInfo?.role === "superAdmin";
  const canDeleteTech = userInfo?.deleteTech || userInfo?.role === "superAdmin";

  const requestEditTechnology = (techId) => {
    if (canEditTech) {
      navigate(`/edit-technology/${techId}`);
    } else {
      toast.error("You do not have permission to edit technologies.", {
        position: "top-center",
      });
    }
  };

  const requestShowDetails = (technology) => {
    navigate(`/tech-detail/${technology.id}`, { state: { technology } });
  };

  const requestDeleteTechnology = (id) => {
    if (!canDeleteTech) {
      toast.error("You do not have permission to delete technologies.", {
        position: "top-center",
      });
      return;
    }
    setTechToDelete(id);
    setOpenDeleteDialog(true);
  };

  const deleteTechAPI = async (id) => {
    const token = getTokenFromStorage();
    if (!token) throw new Error("Authentication token missing.");
    if (!canDeleteTech) throw new Error("Permission denied.");

    const response = await fetch(`${API_BASE_URL}/technologies/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.message || "Failed to delete technology";
      if (response.status === 401) {
        await clearSessionAndLogout(
          "Authentication failed. Please log in again."
        );
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  };

  const confirmDeleteTechnology = async () => {
    if (!techToDelete || !canDeleteTech) {
      toast.error("Action not allowed or item not selected.", {
        position: "top-center",
      });
      setOpenDeleteDialog(false);
      setTechToDelete(null);
      return;
    }
    try {
      const result = await deleteTechAPI(techToDelete);
      toast.success(result.message || "Technology archived successfully!", {
        position: "top-center",
      });
      getAllTechs();
      if (currentPageData.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      toast.error(`Error archiving technology: ${error.message}`, {
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

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast.info("You have been logged out.", { position: "top-center" });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error("Error signing out. Please try again.", {
        position: "top-center",
      });
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
      setUserInfo(null);
      setData([]);
      navigate("/login");
    }
  };

  const consistentHeight = 56;

  if (!loading && !isAuthenticated && window.location.pathname !== "/login") {
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
            Authentication session ended or invalid. Please log in.
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
            Go to Login
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <ToastContainer position="top-center" autoClose={3000} />
      <Box
        sx={{
          background: "#F5F5F5",
          p: { xs: 1, sm: 2 },
          minHeight: "calc(100vh - 64px)",
        }}
      >
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
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor, manage and analyze your technology innovations
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
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
                      {" "}
                      <Divider sx={{ mt: 2 }} />{" "}
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
                                        width: `${
                                          (count / (totalTechs || 1)) * 100
                                        }%`,
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
                  <Grid item xs={12} sm>
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
                  <Grid item xs={12} sm="auto">
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                      fullWidth={isMobile}
                      sx={{
                        height: consistentHeight,
                        borderRadius: 2,
                        mr: canAddTech ? 1 : 0,
                      }}
                    >
                      Print
                    </Button>
                  </Grid>
                  {canAddTech && (
                    <Grid item xs={12} sm="auto">
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate("/add-technology")}
                        fullWidth={isMobile}
                        sx={{
                          height: consistentHeight,
                          borderRadius: 2,
                          background:
                            "linear-gradient(90deg, #141E30, #243B55)",
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
                  )}
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
                      <Grid item xs={12} sm={6} md={3}>
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
                      <Grid item xs={12} sm={6} md={3}>
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
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          select
                          fullWidth
                          label="Filter by Date Type"
                          variant="outlined"
                          size="small"
                          value={filterDateType}
                          onChange={(e) => {
                            setFilterDateType(e.target.value);
                            setPage(1);
                          }}
                        >
                          <MenuItem value="createdAt">Created Date</MenuItem>
                          <MenuItem value="editedAt">Updated Date</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          select
                          fullWidth
                          label="Filter by Month"
                          variant="outlined"
                          size="small"
                          value={filterMonth}
                          onChange={(e) => {
                            setFilterMonth(e.target.value);
                            setPage(1);
                          }}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>All Months</em>
                          </MenuItem>
                          {monthOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          select
                          fullWidth
                          label="Filter by Year"
                          variant="outlined"
                          size="small"
                          value={filterYear}
                          onChange={(e) => {
                            setFilterYear(e.target.value);
                            setPage(1);
                          }}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>All Years</em>
                          </MenuItem>
                          {yearOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
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
                        canEdit={canEditTech}
                        canDelete={canDeleteTech}
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
              Confirm Archive
            </DialogTitle>
            <DialogContent sx={{ pb: 0 }}>
              <DialogContentText
                sx={{ fontSize: "0.875rem", color: "#586069" }}
              >
                Are you sure you want to archive this technology? It will be
                moved to an archive page and will be permanently deleted after
                30 days.
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
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  backgroundColor: "#d13a34",
                  color: "white",
                  "&:hover": { backgroundColor: "#b02a25" },
                }}
                autoFocus
              >
                Archive
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;
