"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { auth, signOut as firebaseSignOut } from "../firebase";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  RestoreFromTrash as RestoreIcon,
  WarningAmber as WarningIcon,
  DeleteForever as DeleteForeverIcon, 
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// const API_BASE_URL = "http://localhost:5001/api";
const API_BASE_URL = "https://otmt.iiitd.edu.in/api";

const getTokenFromStorage = () => localStorage.getItem("token");

const DeletedTechs = () => {
  const navigate = useNavigate();
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  
  // --- 2. STATE: Added state for the permanent delete flow ---
  const [deletingId, setDeletingId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [techToDelete, setTechToDelete] = useState(null);
  // ---------------------------------------------------------

  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [techToRestore, setTechToRestore] = useState(null);

  const fetchDeletedTechs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getTokenFromStorage();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/technologies/deleted`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expired. Please log in again.", {
            position: "top-center",
          });
          localStorage.clear();
          await firebaseSignOut(auth);
          navigate("/login");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || "Failed to fetch archived technologies."
        );
      }

      const data = await response.json();
      setTechs(data);
    } catch (err) {
      setError(err.message);
      console.error("Fetch Deleted Techs Error:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDeletedTechs();
  }, [fetchDeletedTechs]);

  // --- Restore Handlers ---
  const handleRestoreClick = (tech) => {
    setTechToRestore(tech);
    setOpenRestoreDialog(true);
  };

  const handleCloseRestoreDialog = () => {
    setOpenRestoreDialog(false);
    setTechToRestore(null);
  };

  const handleRestoreConfirm = async () => {
    if (!techToRestore) return;

    setRestoringId(techToRestore.id);
    setOpenRestoreDialog(false);
    const token = getTokenFromStorage();
    const techId = techToRestore.id;

    try {
      const response = await fetch(
        `${API_BASE_URL}/technologies/${techId}/restore`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to restore.");
      }

      toast.success(
        `Technology "${result.technology.name}" restored successfully!`,
        { position: "top-center" }
      );
      setTechs((prevTechs) => prevTechs.filter((t) => t.id !== techId));
    } catch (err) {
      toast.error(err.message, { position: "top-center" });
    } finally {
      setRestoringId(null);
      setTechToRestore(null);
    }
  };

  // --- 3. FUNCTIONS: Added handlers for the permanent delete flow ---
  const handleDeleteClick = (tech) => {
    setTechToDelete(tech);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setTechToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!techToDelete) return;

    setDeletingId(techToDelete.id);
    setOpenDeleteDialog(false);
    const token = getTokenFromStorage();
    const techId = techToDelete.id;

    try {
      const response = await fetch(
        `${API_BASE_URL}/technologies/deleted/${techId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to permanently delete.");
      }

      toast.success(result.message, { position: "top-center" });
      setTechs((prevTechs) => prevTechs.filter((t) => t.id !== techId));
    } catch (err) {
      toast.error(err.message, { position: "top-center" });
    } finally {
      setDeletingId(null);
      setTechToDelete(null);
    }
  };
  // -------------------------------------------------------------

  const getTimeLeft = (deletedAt) => {
    const deletionTime =
      new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const diff = deletionTime - now;

    if (diff <= 0)
      return { text: "Marked for deletion", color: "error", isExpired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 1)
      return { text: `${days} days left`, color: "success", isExpired: false };
    if (days === 1)
      return { text: `1 day left`, color: "warning", isExpired: false };
    return { text: `${hours} hours left`, color: "error", isExpired: false };
  };
  
  // --- Main Render Function ---
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error} <Button onClick={fetchDeletedTechs}>Retry</Button>
        </Alert>
      );
    }

    if (techs.length === 0) {
      return (
        <Paper
          elevation={0}
          sx={{ textAlign: "center", p: 4, m: 2, backgroundColor: "grey.100" }}
        >
          <Typography variant="h6" color="text.secondary">
            No Archived Technologies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            There are currently no technologies in the archive.
          </Typography>
        </Paper>
      );
    }

    return (
      <Grid container spacing={3}>
        {techs.map((tech) => {
          const timeLeft = getTimeLeft(tech.deletedAt);
          const isActionInProgress = restoringId === tech.id || deletingId === tech.id;
          return (
            <Grid item xs={12} key={tech.id}>
              <Card
                elevation={2}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  justifyContent: "space-between",
                  p: 2,
                  borderRadius: 2,
                  transition: "box-shadow .3s",
                  "&:hover": { boxShadow: 6 },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {tech.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    Docket: {tech.docket}
                  </Typography>
                  <Typography variant="body2" sx={{ my: 2 }}>
                    {tech.description}
                  </Typography>
                  <Chip
                    icon={<WarningIcon />}
                    label={timeLeft.text}
                    color={timeLeft.color}
                    size="small"
                    variant="outlined"
                  />
                </CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5, // Added gap for spacing
                    p: { xs: 2, md: 3 },
                    flexDirection: { xs: 'row', sm: 'row' }, // Ensure buttons are in a row
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={
                      restoringId === tech.id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <RestoreIcon />
                      )
                    }
                    onClick={() => handleRestoreClick(tech)}
                    disabled={isActionInProgress || timeLeft.isExpired}
                  >
                    {restoringId === tech.id ? "Restoring..." : "Restore"}
                  </Button>
                  
                  {/* --- 4. UI: Added permanent delete button --- */}
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={
                      deletingId === tech.id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <DeleteForeverIcon />
                      )
                    }
                    onClick={() => handleDeleteClick(tech)}
                    disabled={isActionInProgress}
                  >
                    {deletingId === tech.id ? "Deleting..." : "Delete Permanently"}
                  </Button>
                  {/* ------------------------------------------- */}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <Layout title="Restore Technologies">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
      />
      <Box sx={{ mx: "auto", p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Archived Technologies
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          These technologies have been archived and will be permanently deleted
          after 30 days. You can restore them or delete them permanently now.
        </Typography>
        {renderContent()}
      </Box>

      {/* Restore Confirmation Dialog */}
      <Dialog open={openRestoreDialog} onClose={handleCloseRestoreDialog}>
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore the technology "
            {techToRestore?.name}"? It will be moved back to the main dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRestoreDialog}>Cancel</Button>
          <Button onClick={handleRestoreConfirm} autoFocus variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* --- 5. UI: Added permanent delete confirmation dialog --- */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ color: "error.main", display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ mr: 1 }}/>
          Confirm Permanent Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Are you sure you want to permanently delete the technology "
            <strong>{techToDelete?.name}</strong>"?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: "error.dark", fontWeight: 'bold' }}>
            This action is irreversible. All associated data and files for this
            technology will be removed immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            autoFocus
            variant="contained"
            color="error"
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
      {/* --------------------------------------------------------- */}
    </Layout>
  );
};

export default DeletedTechs;
