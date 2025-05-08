"use client";

import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Grow,
  Tooltip, // Added for tooltip on new icon
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility"; // Ensure this is imported
import { motion } from "framer-motion";

const TechList = ({ techs, onDeleteTech, onEditTech, onShowDetails, isAdmin }) => { // Added onEditTech, onShowDetails, isAdmin
  const navigate = useNavigate();

  const formatInnovators = (innovators) => {
    if (!innovators) return "";
    if (Array.isArray(innovators)) {
      return innovators
        .map((inv) => inv.name?.trim() || "Unnamed Innovator")
        .join(", ");
    }
    if (typeof innovators === "string") {
      return innovators;
    }
    return String(innovators);
  };

  return (
    <Grid container spacing={4} alignItems="stretch">
      {techs.map((tech, index) => {
        const { id, name, description, genre, innovators, trl } = tech;
        return (
          <Grow
            in={true}
            style={{ transformOrigin: "0 0 0" }}
            {...{ timeout: 800 + index * 100 }}
            key={id}
          >
            <Grid item xs={12}>
              <Card
                component={motion.div}
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.3s ease",
                  "&:hover .action-buttons": { opacity: 1, visibility: 'visible' }, // Make buttons visible on hover
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: { xs: 1, sm: 2 },
                        flexGrow: 1, // Allow title area to take up space
                        overflow: "hidden", // Prevent long titles from breaking layout
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          wordBreak: "break-word",
                          mr: 1, // Add some margin to the right of the name
                        }}
                      >
                        {name}
                      </Typography>
                      {trl !== undefined && (
                        <Box
                          sx={{
                            mt: { xs: 0.5, sm: 0 }, // Adjusted margin top for TRL
                            px: 1,
                            py: 0.5,
                            bgcolor: "black",
                            color: "white",
                            borderRadius: 1,
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            flexShrink: 0, // Prevent TRL box from shrinking
                          }}
                        >
                          TRL: {trl}
                        </Box>
                      )}
                    </Box>
                    <Box
                      className="action-buttons"
                      sx={{
                        display: "flex",
                        gap: 0.5, // Reduced gap
                        opacity: { xs: 1, sm: 0 }, // Visible on mobile, hidden on desktop until hover
                        visibility: { xs: 'visible', sm: 'hidden'},
                        transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
                        alignItems: 'center', // Vertically align icons
                        flexShrink: 0, // Prevent action buttons from shrinking
                      }}
                    >
                      <Tooltip title="Show Details">
                        <IconButton
                          component={motion.div}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          size="small"
                          onClick={() => onShowDetails(tech)} // Pass the whole tech object
                          sx={{
                            color: "text.secondary", // Adjusted color
                            bgcolor: "rgba(0,0,0,0.04)", // Subtle background
                            boxShadow: "none", // Removed shadow for a cleaner look
                            "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isAdmin && ( // Only show Edit and Delete if isAdmin
                        <>
                          <Tooltip title="Edit Technology">
                            <IconButton
                              component={motion.div}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              size="small"
                              onClick={() => onEditTech(id)} // Use onEditTech prop
                              sx={{
                                color: "text.secondary",
                                bgcolor: "rgba(0,0,0,0.04)",
                                boxShadow: "none",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Technology">
                            <IconButton
                              component={motion.div}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              size="small"
                              onClick={() => onDeleteTech(id)}
                              sx={{
                                color: "error.main", // Use error color for delete
                                bgcolor: "rgba(211, 47, 47, 0.06)", // Subtle red background
                                boxShadow: "none",
                                "&:hover": { bgcolor: "rgba(211, 47, 47, 0.12)" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 2,
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3, // Show 3 lines of description
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '3.6em' // Approx height for 3 lines (3 * 1.2em line-height for body2) - adjust if needed
                    }}
                  >
                    {description}
                  </Typography>

                  {(genre || innovators) && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "grey.50", // Lighter grey
                        borderRadius: 1.5, // Slightly more rounded
                      }}
                    >
                      {genre && (
                        <Typography
                          variant="caption" // Changed to caption for smaller text
                          display="block" // Make it a block to ensure margin bottom works
                          sx={{
                            fontWeight: 500,
                            mb: innovators ? 0.5 : 0, // Add margin bottom only if innovators are present
                            wordBreak: "break-word",
                            color: "text.secondary",
                          }}
                        >
                          <strong>Genre:</strong> {genre}
                        </Typography>
                      )}
                      {innovators && (
                        <Typography
                          variant="caption" // Changed to caption
                          display="block"
                          sx={{
                            fontWeight: 500,
                            wordBreak: "break-word",
                            color: "text.secondary",
                          }}
                        >
                          <strong>Innovators:</strong> {formatInnovators(innovators)}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grow>
        );
      })}
    </Grid>
  );
};

export default TechList;