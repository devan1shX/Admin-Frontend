import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Grow,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { motion } from "framer-motion";

const TechList = ({ techs, onDeleteTech }) => {
  const navigate = useNavigate();

  // This is a function to properly format innovators for display in your TechList component
  const formatInnovators = (innovators) => {
    if (!innovators) return "";

    // New schema: array of { name, mail }
    if (Array.isArray(innovators)) {
      return innovators
        .map((inv) => inv.name?.trim() || "Unnamed Innovator")
        .join(", ");
    }

    // Legacy format: just a string
    if (typeof innovators === "string") {
      return innovators;
    }

    // Fallback
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
                  "&:hover .action-buttons": { opacity: 1 },
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Header: Title with TRL on the left, action buttons on the right */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row", // Outer container remains row
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      mb: 2,
                    }}
                  >
                    {/* Left side: Title and TRL */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: { xs: 1, sm: 2 },
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          wordBreak: "break-word",
                        }}
                      >
                        {name}
                      </Typography>
                      {trl !== undefined && (
                        <Box
                          sx={{
                            mt: { xs: 1, sm: 0 },
                            px: 1,
                            py: 0.5,
                            bgcolor: "black",
                            color: "white",
                            borderRadius: 1,
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                          }}
                        >
                          TRL: {trl}
                        </Box>
                      )}
                    </Box>
                    {/* Right side: Action buttons */}
                    <Box
                      className="action-buttons"
                      sx={{
                        display: "flex",
                        gap: 1,
                        opacity: 0,
                        transition: "opacity 0.3s ease-in-out",
                      }}
                    >
                      <IconButton
                        component={motion.div}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        size="small"
                        onClick={() => navigate(`/edit-technology/${id}`)}
                        sx={{
                          color: "black",
                          bgcolor: "background.paper",
                          boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                          "&:hover": { bgcolor: "grey.200" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        component={motion.div}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        size="small"
                        onClick={() => onDeleteTech(id)}
                        sx={{
                          color: "black",
                          bgcolor: "background.paper",
                          boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                          "&:hover": { bgcolor: "grey.200" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.6, wordBreak: "break-word" }}
                  >
                    {description}
                  </Typography>

                  {/* Optional extra information */}
                  {(genre || innovators) && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "grey.100",
                        borderRadius: 1,
                      }}
                    >
                      {genre && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            mb: 0.5,
                            wordBreak: "break-word",
                          }}
                        >
                          Genre: {genre}
                        </Typography>
                      )}
                      {innovators && (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, wordBreak: "break-word" }}
                        >
                          Innovators: {formatInnovators(innovators)}
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
