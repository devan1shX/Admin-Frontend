"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Pagination,
  Fade,
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
} from "@mui/material"
import { Search, Add, FilterList, Edit, Delete } from "@mui/icons-material"
import Layout from "./Layout"

const API_BASE_URL = "http://localhost:5001"

const getEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/events`)
  if (!response.ok) throw new Error("Failed to fetch events")
  return await response.json()
}

const deleteEvent = async (title, day) => {
  const response = await fetch(`${API_BASE_URL}/events/${title}/${day}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete event")
  return await response.json()
}


const Events = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Main data state
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem("eventsData")
    return cached ? JSON.parse(cached) : []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem("eventsSearchQuery") || "")
  const [filterCategory, setFilterCategory] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(() => Number(localStorage.getItem("eventsPage")) || 1)
  const perPage = 9

  // Delete modal state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)

  const getAllEvents = useCallback(async () => {
    try {
      const res = await getEvents()
      if (Array.isArray(res)) {
        setData(res)
        localStorage.setItem("eventsData", JSON.stringify(res))
      } else {
        console.error("Unexpected data format:", res)
        setData([])
      }
    } catch (err) {
      console.error("Error fetching events:", err)
      setError(err.message || "Error fetching events")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getAllEvents()
  }, [getAllEvents])

  useEffect(() => {
    localStorage.setItem("eventsSearchQuery", searchQuery)
  }, [searchQuery])

  useEffect(() => {
    localStorage.setItem("eventsPage", page)
  }, [page])

  // Filter events using search query and category
  const filteredData = data.filter((item) => {
    const lowerQuery = searchQuery.toLowerCase()
    if (
      !item.title.toLowerCase().includes(lowerQuery) &&
      !(item.id && item.id.toString().toLowerCase().includes(lowerQuery))
    ) {
      return false
    }
    if (
      filterCategory &&
      (!item.fieldCategory || !item.fieldCategory.toLowerCase().includes(filterCategory.toLowerCase()))
    ) {
      return false
    }
    return true
  })

  const totalPages = Math.ceil(filteredData.length / perPage)
  const startIndex = (page - 1) * perPage
  const currentPageData = filteredData.slice(startIndex, startIndex + perPage)

  const handlePageChange = (event, value) => {
    setPage(value)
  }

  // Delete functionality
  const requestDeleteEvent = (event) => {
    setEventToDelete(event)
    setOpenDeleteDialog(true)
  }
  

  const confirmDeleteEvent = async () => {
    try {
      await deleteEvent(eventToDelete.title, eventToDelete.day)
      const newEvents = data.filter((ev) => ev.id !== eventToDelete.id)
      setData(newEvents)
      localStorage.setItem("eventsData", JSON.stringify(newEvents))
    } catch (error) {
      console.error("Error deleting event:", error)
    } finally {
      setOpenDeleteDialog(false)
      setEventToDelete(null)
    }
  }
  

  const cancelDeleteEvent = () => {
    setOpenDeleteDialog(false)
    setEventToDelete(null)
  }

  return (
    <Layout title="Events">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: "#1e293b" }}>
          Events
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Explore and manage upcoming events
        </Typography>
      </Box>

      {/* Search & Add Button Row */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
        <Paper
          component="form"
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            flexGrow: 1,
            border: "1px solid #e2e8f0",
            "&:hover": { boxShadow: "0 2px 5px rgba(0,0,0,0.15)" },
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="search">
            <Search />
          </IconButton>
          <TextField
            fullWidth
            placeholder="Search events..."
            variant="standard"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
        </Paper>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/add-event")}
          sx={{
            height: 48,
            borderRadius: 2,
            bgcolor: "#0f172a",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            px: 3,
            whiteSpace: "nowrap",
            "&:hover": {
              bgcolor: "#1e293b",
              boxShadow: "0 6px 8px rgba(0,0,0,0.15)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          ADD EVENT
        </Button>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showFilters} timeout="auto" unmountOnExit>
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Filter by Category"
                variant="outlined"
                size="small"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setPage(1)
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : error ? (
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
      ) : (
        <Fade in={!loading}>
          <Box>
            {currentPageData.length > 0 ? (
              <Grid container spacing={3}>
                {currentPageData.map((event) => (
                  <Grid item xs={12} key={event.id}>
  <Paper
    sx={{
      p: 3,
      borderRadius: "16px",
      border: "1px solid rgba(230,230,230,0.5)",
      wordBreak: "break-word",
      transition: "all 0.3s ease",
      position: "relative",
      "&:hover": {
        boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
        "& .action-icons": {
          opacity: 1,
        },
      },
    }}
  >
    {/* Header: Title and Action Icons aligned horizontally */}
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#141E30" }}>
        {event.title}
      </Typography>
      <Box
        className="action-icons"
        sx={{
          display: "flex",
          gap: 1,
          opacity: 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(`/edit-event/${event.title}/${event.day}`)}
          sx={{ color: "black", backgroundColor: "rgba(255,255,255,0.8)" }}
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => requestDeleteEvent(event)}
          sx={{ color: "black", backgroundColor: "rgba(255,255,255,0.8)" }}
        >
          <Delete fontSize="small" />
        </IconButton>

      </Box>
    </Box>
    {/* Event Details */}
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <strong>Month:</strong> {event.month}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <strong>Day:</strong> {event.day}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <strong>Location:</strong> {event.location}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <strong>Time:</strong> {event.time}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <strong>Description:</strong> {event.description}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <strong>Registration:</strong> {event.registration}
      </Typography>
    </Box>
  </Paper>
</Grid>

                ))}
              </Grid>
            ) : (
              <Paper
                sx={{
                  p: 4,
                  borderRadius: 2,
                  textAlign: "center",
                  bgcolor: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
                  No events found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try a different search or add a new event.
                </Typography>
              </Paper>
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
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={cancelDeleteEvent}
        aria-labelledby="delete-confirmation-dialog"
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxWidth: "400px",
            m: 2,
          },
        }}
      >
        <DialogTitle id="delete-confirmation-dialog" sx={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", pb: 1 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.875rem", color: "#64748b" }}>
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={cancelDeleteEvent}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderColor: "#e2e8f0",
              color: "#64748b",
              "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteEvent}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              backgroundColor: "#ef4444",
              "&:hover": { backgroundColor: "#dc2626" },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default Events
