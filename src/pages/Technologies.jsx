"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Pagination,
  Fade,
  InputAdornment,
  Grid,
  Paper,
  Collapse,
  useTheme,
  useMediaQuery,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Search, Add, FilterList } from "@mui/icons-material";
import Layout from "./Layout";
import TechList from "./TechList";

const API_BASE_URL = "http://localhost:5001";

const getTech = async () => {
  const response = await fetch(`${API_BASE_URL}/technologies`);
  if (!response.ok) throw new Error("Failed to fetch technologies");
  return await response.json();
};

const deleteTech = async (id) => {
  const response = await fetch(`${API_BASE_URL}/technologies/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete technology");
  return await response.json();
};

const Technologies = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Main data state
  const [data, setData] = useState(() => {
    const cachedData = localStorage.getItem("techData");
    return cachedData ? JSON.parse(cachedData) : [];
  });
  const [loading, setLoading] = useState(true);

  // Search and filter states
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

  // Delete Modal states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [techToDelete, setTechToDelete] = useState(null);

  const getAllTechs = async () => {
    try {
      const res = await getTech();
      if (Array.isArray(res)) {
        setData(res);
        localStorage.setItem("techData", JSON.stringify(res));
      } else {
        console.error("Unexpected data format:", res);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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

  // Filter data using search query and advanced filters (Genre & Innovators)
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
    if (
      filterInnovators &&
      (!item.innovators ||
        !item.innovators.toLowerCase().includes(filterInnovators.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentPageData = filteredData.slice(startIndex, startIndex + perPage);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Instead of immediately deleting, open the confirmation modal
  const requestDeleteTechnology = (id) => {
    setTechToDelete(id);
    setOpenDeleteDialog(true);
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

  // Consistent height for search bar & add button (56px)
  const consistentHeight = 56;

  return (
    <Layout title="Technology Innovations" showBackButton={false}>
      <Box sx={{ mb: 4 }}>
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
                    <IconButton onClick={() => setShowFilters((prev) => !prev)}>
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
      <Collapse in={showFilters} timeout="auto" unmountOnExit>
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
              <TechList techs={currentPageData} onDeleteTech={requestDeleteTechnology} />
            ) : (
              <Typography
                variant="h6"
                textAlign="center"
                sx={{ mt: 4, color: "text.secondary" }}
              >
                No technologies found. Try a different search or add a new technology.
              </Typography>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
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

      {/* Delete Confirmation Modal styled to be modern (GitHub-like) */}
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
          sx={{ fontSize: "1.25rem", fontWeight: 600, color: "#24292e", pb: 0 }}
        >
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ pb: 0 }}>
          <DialogContentText sx={{ fontSize: "0.875rem", color: "#586069" }}>
            Are you sure you want to delete this technology? This action cannot be undone.
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
              "&:hover": { borderColor: "#c6cbd1", backgroundColor: "#f6f8fa" },
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
    </Layout>
  );
};

export default Technologies;
