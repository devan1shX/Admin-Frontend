"use client";

import React, { useState } from "react";
import {
  CssBaseline,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu,
  Dashboard,
  Storage,
  ChevronLeft,
  ChevronRight,
  Event,
  Edit,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import logo from "../../src/assets/iiitdlogo.png";

const drawerWidth = 260;
const collapsedDrawerWidth = 60; // width when drawer is collapsed

export default function Layout({ children, title, showBackButton = true }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State for mobile drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);
  // State for desktop drawer collapsed/expanded
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // On mobile, always use full width, otherwise use collapsed or expanded width.
  const currentDrawerWidth = isMobile ? drawerWidth : (collapsed ? collapsedDrawerWidth : drawerWidth);

  // Drawer content
  const drawer = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: theme.palette.background.default,
        position: "relative",
      }}
    >
      {/* Always show logo on mobile. On desktop, show logo only if not collapsed */}
      {(isMobile || !collapsed) && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <img
            src={logo}
            alt="Logo"
            style={{
              height: "50px",
              transition: "height 0.3s",
            }}
          />
        </Box>
      )}
      <Divider />
      <List>
        <ListItem button onClick={() => navigate("/admin-dashboard")}>
          <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: "40px" }}>
            <Dashboard />
          </ListItemIcon>
          {(isMobile || !collapsed) && (
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{ sx: { color: "black", cursor: "pointer" } }}
            />
          )}
        </ListItem>
        {/* <ListItem button onClick={() => navigate("/admin")}>
          <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: "40px" }}>
            <Storage />
          </ListItemIcon>
          {(isMobile || !collapsed) && (
            <ListItemText
              primary="Technologies"
              primaryTypographyProps={{ sx: { color: "black", cursor: "pointer" } }}
            />
          )}
        </ListItem> */}
        {/* New options: Add Events and Edit Links */}
        <ListItem button onClick={() => navigate("/admin-events")}>
          <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: "40px" }}>
            <Event />
          </ListItemIcon>
          {(isMobile || !collapsed) && (
            <ListItemText
              primary="Events"
              primaryTypographyProps={{ sx: { color: "black", cursor: "pointer" } }}
            />
          )}
        </ListItem>
        {/* <ListItem button onClick={() => navigate("/edit-links")}>
          <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: "40px" }}>
            <Edit />
          </ListItemIcon>
          {(isMobile || !collapsed) && (
            <ListItemText
              primary="Edit Links"
              primaryTypographyProps={{ sx: { color: "black", cursor: "pointer" } }}
            />
          )}
        </ListItem> */}
      </List>
      {/* Collapse toggle (shown only on desktop) */}
      {!isMobile && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            py: 1,
            textAlign: "center",
          }}
        >
          <IconButton onClick={toggleCollapse} sx={{ color: "black" }}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Mobile Header with Hamburger Menu */}
      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: !mobileOpen ? "white" : "transparent",
            zIndex: theme.zIndex.drawer + 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1,
            height: 56,
          }}
        >
          {!mobileOpen && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: "black" }}>
              <Menu />
            </IconButton>
          )}
          {!mobileOpen && (
            <Box sx={{ flexGrow: 1, textAlign: "center" }}>
              <img src={logo} alt="Logo" style={{ height: "40px" }} />
            </Box>
          )}
          {mobileOpen && <Box sx={{ flexGrow: 1 }} />}
        </Box>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: currentDrawerWidth },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: currentDrawerWidth,
              background: "white",
              color: "#fff",
              // On mobile, ensure the drawer appears above the app bar when open.
              ...(isMobile && mobileOpen && { zIndex: theme.zIndex.drawer + 2 }),
              transition: "width 0.3s",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3, lg: 4 },
          backgroundColor: "#f5f5f5",
          minHeight: "100vh",
          mt: isMobile ? "56px" : 0, // Offset for mobile header
        }}
      >
        {children}
        <Box sx={{ mt: 4 }}>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}
