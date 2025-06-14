"use client"

import { useState, useEffect, useCallback } from "react"
import Layout from "./Layout"
import { auth, onAuthStateChanged } from "../firebase"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  Button,
  Avatar,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Tooltip,
  IconButton,
  useMediaQuery,
  Snackbar,
} from "@mui/material"
import { Delete as DeleteIcon, Info as InfoIcon, Save as SaveIcon } from "@mui/icons-material"
import { ThemeProvider, createTheme } from "@mui/material/styles"

export const API_BASE_URL = "https://otmt.iiitd.edu.in/api"
// const API_BASE_URL = "http://localhost:5001/api";

const ASSIGNABLE_ROLES = ["admin", "employee"]
const PERMISSION_DEFINITIONS = [
  { key: "addTech", label: "Add Tech", shortLabel: "Add Tech" },
  { key: "editTech", label: "Edit Tech", shortLabel: "Edit Tech" },
  { key: "deleteTech", label: "Delete Tech", shortLabel: "Delete Tech" },
  { key: "addEvent", label: "Add Event", shortLabel: "Add Event" },
  { key: "editEvent", label: "Edit Event", shortLabel: "Edit Event" },
  { key: "deleteEvent", label: "Delete Event", shortLabel: "Delete Event" },
]

const theme = createTheme({
  palette: {
    primary: {
      main: "#328d89",
      light: "#5ab9b5",
      dark: "#20635f",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2c7a76",
      light: "#56a6a2",
      dark: "#1d524f",
    },
    error: {
      main: "#d32f2f",
    },
    background: {
      default: "#f5f7f8",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: "#edf2f7",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
})

const Admin_Panel = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [originalUsers, setOriginalUsers] = useState([])
  const [editableUsers, setEditableUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [changedUserUids, setChangedUserUids] = useState(new Set())
  const [userToDelete, setUserToDelete] = useState(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    if (successMessage || error) {
      setSnackbarOpen(true)
    }
  }, [successMessage, error])

  useEffect(() => {
    let timer
    if (snackbarOpen) {
      timer = setTimeout(() => {
        setSnackbarOpen(false)
      }, error ? 7000 : 4000)
    }
    return () => clearTimeout(timer)
  }, [snackbarOpen, successMessage, error])

  const fetchAllUsersWithPermissions = useCallback(async (token) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/all-users`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Server error: ${response.status}`)
      }

      // --- FIX START ---
      // Process users to ensure frontend UI correctly reflects employee permissions on load.
      const processedUsers = (data.users || []).map(user => {
        const newUser = { ...user };
        // If the user is an employee, ensure their default permissions are correctly set for display.
        if (newUser.role === 'employee') {
          newUser.addTech = newUser.addTech === true;
          newUser.editTech = newUser.editTech === true; // This ensures the checkbox is ticked
          newUser.deleteTech = newUser.deleteTech === true;
          newUser.addEvent = newUser.addEvent === true;
          newUser.editEvent = newUser.editEvent === true;
          newUser.deleteEvent = newUser.deleteEvent === true;
        }
        return newUser;
      });
      // --- FIX END ---
      
      setOriginalUsers(JSON.parse(JSON.stringify(processedUsers)))
      setEditableUsers(processedUsers)
      setChangedUserUids(new Set())
    } catch (err) {
      console.error("Error fetching all users:", err)
      setError(`Failed to load users: ${err.message}.`)
      setOriginalUsers([])
      setEditableUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setCurrentUser(user)
          user
            .getIdToken(true)
            .then((token) => {
              fetchAllUsersWithPermissions(token)
            })
            .catch((tokenError) => {
              console.error("Error getting ID token:", tokenError)
              setError("Failed to authenticate for fetching users.")
              setIsLoading(false)
              setOriginalUsers([])
              setEditableUsers([])
            })
        } else {
          setCurrentUser(null)
          setError("You must be logged in to view the admin panel.")
          setOriginalUsers([])
          setEditableUsers([])
          setIsLoading(false)
        }
      },
      (authError) => {
        console.error("Firebase Auth State Error:", authError)
        setError(`Authentication Error: ${authError.message}`)
        setCurrentUser(null)
        setOriginalUsers([])
        setEditableUsers([])
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [fetchAllUsersWithPermissions])

  const handlePermissionChange = (userUid, permissionKey, isChecked) => {
    setEditableUsers((prevUsers) =>
      prevUsers.map((user) => (user.uid === userUid ? { ...user, [permissionKey]: isChecked } : user))
    )
    setChangedUserUids((prev) => new Set(prev).add(userUid))
    setSuccessMessage("")
    setError('');
  }

  // --- FIX START ---
  // This function now correctly sets the default permissions when a role is changed to 'employee'.
  const handleRoleChange = (userUid, newRole) => {
    setEditableUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.uid === userUid) {
          const updatedUser = { ...user, role: newRole }
          if (newRole === "admin") {
            PERMISSION_DEFINITIONS.forEach((pDef) => {
              updatedUser[pDef.key] = true
            })
          } else if (newRole === "employee") {
            // Set the default permissions for an employee
            updatedUser.addTech = true;
            updatedUser.editTech = true; // This is the key change
            updatedUser.deleteTech = false;
            updatedUser.addEvent = true;
            updatedUser.editEvent = false;
            updatedUser.deleteEvent = false;
          }
          return updatedUser
        }
        return user
      })
    )
    setChangedUserUids((prev) => new Set(prev).add(userUid))
    setSuccessMessage("")
    setError('');
  }
  // --- FIX END ---

  const handleSaveChanges = async () => {
    if (!currentUser) {
      setError("Authentication token not available. Please re-login.")
      return
    }
    if (changedUserUids.size === 0) {
      setSuccessMessage("No changes to save.")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccessMessage("")
    let successfulUpdates = 0
    let failedUpdates = 0
    let cumulativeErrorMessages = ""

    const idToken = await currentUser.getIdToken(true)

    const updatePromises = Array.from(changedUserUids).map(async (uid) => {
      const userToUpdate = editableUsers.find((u) => u.uid === uid)
      const originalUser = originalUsers.find((u) => u.uid === uid);
      if (!userToUpdate) return

      if (
        userToUpdate.uid === currentUser.uid &&
        originalUser?.role === "superAdmin" &&
        userToUpdate.role !== "superAdmin"
      ) {
        cumulativeErrorMessages += `Super admin cannot change their own role. `
        failedUpdates++
        setEditableUsers(prev => prev.map(u => u.uid === uid ? {...u, role: 'superAdmin'} : u));
        return
      }

      const payload = {
        role: userToUpdate.role,
        addTech: userToUpdate.addTech,
        editTech: userToUpdate.editTech,
        deleteTech: userToUpdate.deleteTech,
        addEvent: userToUpdate.addEvent,
        editEvent: userToUpdate.editEvent,
        deleteEvent: userToUpdate.deleteEvent,
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/${uid}/permissions`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          console.error(`Server error updating user ${uid}: ${data.message || response.status}`)
          throw new Error(data.message || `Failed to update ${userToUpdate.email || uid}`)
        }
        successfulUpdates++
      } catch (err) {
        console.error(`Error updating user ${uid}:`, err)
        cumulativeErrorMessages += `Failed for ${userToUpdate.email || uid}: ${err.message}. `
        failedUpdates++
      }
    })

    await Promise.all(updatePromises)
    setIsSaving(false)

    if (successfulUpdates > 0 && failedUpdates === 0) {
      setSuccessMessage(`${successfulUpdates} user(s) updated successfully.`)
      fetchAllUsersWithPermissions(idToken)
    } else if (successfulUpdates > 0 && failedUpdates > 0) {
      setError(cumulativeErrorMessages.trim() + ` ${successfulUpdates} updated, ${failedUpdates} failed.`);
      fetchAllUsersWithPermissions(idToken);
    } else if (failedUpdates > 0) {
      setError(cumulativeErrorMessages.trim() + ` All ${failedUpdates} update(s) failed.`)
    } else if (changedUserUids.size > 0) {
      setError("Attempted to save but no updates were processed. This might indicate an issue with identifying changes or a self-update restriction.");
    }
  }
  
  const handleDeleteUserClick = (user) => {
    if (user.uid === currentUser?.uid) {
      setError("You cannot delete your own account from this panel.")
      return
    }
    setUserToDelete(user)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete || !currentUser) return

    setError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const idToken = await currentUser.getIdToken(true)
      const response = await fetch(`${API_BASE_URL}/admin/users/${userToDelete.uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to delete user ${userToDelete.email}`);
      }
      
      setSuccessMessage(`User ${userToDelete.email} has been deleted successfully.`)
      fetchAllUsersWithPermissions(idToken)
    } catch (err) {
      console.error("Error deleting user:", err)
      setError(`Failed to delete user ${userToDelete.email}: ${err.message}`)
    } finally {
      setUserToDelete(null)
      setIsSaving(false)
    }
  }

  if (isLoading && editableUsers.length === 0) {
    return (
      <Layout>
        <ThemeProvider theme={theme}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100vh - 250px)",
              p: 4,
              textAlign: "center",
            }}
          >
            <CircularProgress size={60} color="primary" aria-label="Loading admin panel" />
            <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
              Loading Admin Panel...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we fetch user data.
            </Typography>
          </Box>
        </ThemeProvider>
      </Layout>
    )
  }

  if (!currentUser && !isLoading) {
    return (
      <Layout>
        <ThemeProvider theme={theme}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100vh - 250px)",
              p: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 3, sm: 5 },
                maxWidth: "sm",
                width: "100%",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <Box sx={{ color: "error.main", mb: 2 }}>
                <InfoIcon sx={{ fontSize: 60 }} />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                Access Denied
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {error || "You must be logged in with appropriate permissions."}
              </Typography>
            </Paper>
          </Box>
        </ThemeProvider>
      </Layout>
    )
  }

  return (
    <Layout>
      <ThemeProvider theme={theme}>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
                  User Permissions Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Modify roles and permissions for registered users.
                </Typography>
              </Box>
              {currentUser && (
                <Chip
                  label={`Admin: ${currentUser.email}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{
                    fontWeight: 500,
                    backgroundColor: "rgba(50, 141, 137, 0.1)",
                    borderColor: "primary.main",
                  }}
                />
              )}
            </Box>
          </Box>

          {editableUsers.length === 0 && !isLoading && !error && (
            <Paper
              elevation={1}
              sx={{ py: 6, px: 3, textAlign: "center", borderRadius: 2, backgroundColor: "white" }}
            >
              <InfoIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" gutterBottom>No Users Found</Typography>
              <Typography variant="body2" color="text.secondary">
                There are currently no users to display.
              </Typography>
            </Paper>
          )}

          {editableUsers.length > 0 && (
            <>
              <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
                <TableContainer sx={{ maxHeight: "70vh" }}>
                  <Table stickyHeader aria-label="user permissions table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", minWidth: 220, position: 'sticky', left: 0, zIndex: 101, backgroundColor: '#edf2f7' }}>User</TableCell>
                        <TableCell sx={{ fontWeight: "bold", minWidth: 130 }}>Role</TableCell>
                        {!isSmallScreen && PERMISSION_DEFINITIONS.map((p) => (
                          <TableCell key={p.key} align="center" sx={{ width: 60, py: 1 }}>
                            <Tooltip title={p.label} arrow placement="top">
                              <Typography variant="caption" fontWeight="bold">{p.shortLabel}</Typography>
                            </Tooltip>
                          </TableCell>
                        ))}
                        {isSmallScreen && (
                            <TableCell align="center" sx={{ fontWeight: "bold" }}>
                              <Tooltip title="Permissions (A:Add, E:Edit, D:Delete - T:Tech, V:Event)" arrow placement="top">
                                <Typography variant="caption" fontWeight="bold">Perms</Typography>
                              </Tooltip>
                            </TableCell>
                        )}
                        <TableCell align="center" sx={{ fontWeight: "bold", width: 80 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editableUsers.map((user) => (
                        <TableRow
                          key={user.uid}
                          sx={{
                            "&:hover": { backgroundColor: "rgba(50, 141, 137, 0.04)" },
                            backgroundColor: changedUserUids.has(user.uid) ? "rgba(255, 244, 229, 0.7)" : "inherit",
                            transition: "background-color 0.2s",
                          }}
                        >
                          <TableCell sx={{ position: 'sticky', left: 0, zIndex: 100, backgroundColor: changedUserUids.has(user.uid) ? "rgba(255, 244, 229, 0.7)" : "white", '&:hover': {backgroundColor: changedUserUids.has(user.uid) ? "rgba(255, 230, 200, 0.7)" : "rgba(50, 141, 137, 0.04)"} }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar src={user.photoURL} alt={user.displayName || user.email} sx={{ width: 32, height: 32, mr: 1.5, fontSize: '0.875rem' }}>
                                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight="medium" noWrap title={user.displayName || "N/A"}>
                                  {user.displayName || "N/A"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={user.email}>
                                  {user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {user.role === "superAdmin" ? (
                              <Chip label="Super Admin" size="small" sx={{ bgcolor: 'secondary.dark', color: 'white', fontWeight: 'medium' }}/>
                            ) : (
                              <FormControl fullWidth size="small" variant="outlined">
                                <Select
                                  value={user.role || ""}
                                  onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                  displayEmpty
                                  inputProps={{ "aria-label": "Select role", id: `role-select-${user.uid}`}}
                                  sx={{ fontSize: '0.8rem', '.MuiSelect-select': {py: 0.8, px: 1} }}
                                  disabled={user.uid === currentUser?.uid}
                                >
                                  <MenuItem value="" disabled sx={{fontSize: '0.8rem'}}>
                                    <em>{user.role && ASSIGNABLE_ROLES.includes(user.role) ? 'Select Role' : (user.role || 'N/A')}</em>
                                  </MenuItem>
                                  {ASSIGNABLE_ROLES.map((role) => (
                                    <MenuItem key={role} value={role} sx={{ textTransform: "capitalize", fontSize: '0.8rem' }}>
                                      {role.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </TableCell>
                          
                          {!isSmallScreen && PERMISSION_DEFINITIONS.map((pDef) => (
                            <TableCell key={pDef.key} align="center" sx={{p:0.5}}>
                              <Tooltip title={pDef.label} arrow>
                                <span>
                                  <Checkbox
                                    checked={!!user[pDef.key]}
                                    onChange={(e) => handlePermissionChange(user.uid, pDef.key, e.target.checked)}
                                    disabled={user.role === "superAdmin" || (user.uid === currentUser?.uid && currentUser?.role === "superAdmin")}
                                    color="primary"
                                    size="small"
                                    inputProps={{ "aria-label": `${pDef.label} for user ${user.displayName || user.email}`}}
                                    sx={{ p: 0.5 }}
                                  />
                                </span>
                              </Tooltip>
                            </TableCell>
                          ))}

                          {isSmallScreen && (
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                    {PERMISSION_DEFINITIONS.map(pDef => (
                                        <FormControlLabel
                                            key={pDef.key}
                                            control={
                                                <Checkbox
                                                    checked={!!user[pDef.key]}
                                                    onChange={(e) => handlePermissionChange(user.uid, pDef.key, e.target.checked)}
                                                    disabled={user.role === "superAdmin" || (user.uid === currentUser?.uid && currentUser?.role === "superAdmin")}
                                                    size="small"
                                                    color="primary"
                                                    sx={{p:0.25}}
                                                />
                                            }
                                            label={<Typography variant="caption">{pDef.shortLabel}</Typography>}
                                            sx={{mr:0, height: 20}}
                                            title={pDef.label}
                                        />
                                    ))}
                                </Box>
                            </TableCell>
                          )}
                          
                          <TableCell align="center">
                            {user.role !== "superAdmin" && user.uid !== currentUser?.uid && (
                              <Tooltip title={`Delete user ${user.email}`} arrow>
                                <span>
                                  <IconButton
                                    onClick={() => handleDeleteUserClick(user)}
                                    disabled={isSaving}
                                    color="error"
                                    size="small"
                                    aria-label={`Delete user ${user.email}`}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 3, gap: 2 }}>
                {changedUserUids.size > 0 && (
                  <Typography variant="body2" color="orange.dark" sx={{ animation: "pulse 2s infinite", "@keyframes pulse": {"0%, 100%": { opacity: 1 },"50%": { opacity: 0.6 }}}}>
                    {changedUserUids.size} user(s) have unsaved changes
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={isSaving && changedUserUids.size > 0 ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveChanges}
                  disabled={isSaving || changedUserUids.size === 0}
                  sx={{ px: 2.5, py: 1, borderRadius: 1.5, boxShadow: 1, "&:hover": { boxShadow: 2 } }}
                >
                  {isSaving && changedUserUids.size > 0 ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </>
          )}

          <Dialog
            open={!!userToDelete}
            onClose={() => !isSaving && setUserToDelete(null)}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                Are you sure you want to delete the user <strong>{userToDelete?.email}</strong>? This action will
                permanently remove their account and cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setUserToDelete(null)} disabled={isSaving} variant="outlined">
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteUser}
                disabled={isSaving}
                variant="contained"
                color="error"
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
              >
                {isSaving ? "Deleting..." : "Delete User"}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={error ? 7000 : 4000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            {error ? (
                <Alert onClose={() => { setSnackbarOpen(false); setError('');}} severity="error" variant="filled" sx={{ width: '100%' }}>
                    <AlertTitle sx={{fontWeight: 'bold'}}>Error</AlertTitle>
                    {error}
                </Alert>
            ) : successMessage ? (
                <Alert onClose={() => { setSnackbarOpen(false); setSuccessMessage('');}} severity="success" variant="filled" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            ) : undefined}
          </Snackbar>
        </Box>
      </ThemeProvider>
    </Layout>
  )
}

export default Admin_Panel