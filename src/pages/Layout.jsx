"use client";

import React, { useState, useEffect } from "react";
import {
    CssBaseline, Box, IconButton, Drawer, List, ListItem,
    ListItemIcon, ListItemText, Divider, useTheme, useMediaQuery,
} from "@mui/material";
import {
    Menu, Dashboard, ChevronLeft, ChevronRight, Event, Delete, // 1. Import the Delete icon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import logo from "../../src/assets/iiitdlogo.png";
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

// 2. Remove the incorrect import of the DeletedTechs page
// import DeletedTechs from "./src/pages/DeletedTechs"; 

const drawerWidth = 260;
const collapsedDrawerWidth = 60;

// Helper function to get user info from localStorage (similar to AddEvents)
const getUserInfoFromStorage = () => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available
        const userString = localStorage.getItem("user");
        if (userString) {
            try {
                return JSON.parse(userString);
            } catch (e) {
                console.error("Failed to parse user info from localStorage in Layout", e);
                return null;
            }
        }
    }
    return null;
};

export default function Layout({ children, title, showBackButton = true }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    useEffect(() => {
        const userInfo = getUserInfoFromStorage();
        if (userInfo && userInfo.role) {
            setCurrentUserRole(userInfo.role);
        }
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const currentDrawerWidth = isMobile ? drawerWidth : (collapsed ? collapsedDrawerWidth : drawerWidth);

    const drawer = (
        <Box
            sx={{
                height: "100%",
                backgroundColor: theme.palette.background.default,
                position: "relative",
            }}
        >
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
                {currentUserRole === "superAdmin" && (
                    <ListItem button onClick={() => navigate("/admin-panel")}>
                        <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: "40px" }}>
                            <SupervisorAccountIcon />
                        </ListItemIcon>
                        {(isMobile || !collapsed) && (
                            <ListItemText
                                primary="Admins"
                                primaryTypographyProps={{ sx: { color: "black", cursor: "pointer" } }}
                            />
                        )}
                    </ListItem>
                )}
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
                <ListItem button onClick={() => navigate("/deleted-techs")}>
                    <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: "40px" }}>
                        {/* 3. Use the imported Delete icon here */}
                        <Delete />
                    </ListItemIcon>
                    {(isMobile || !collapsed) && (
                        <ListItemText
                            primary="Deleted Technologies"
                            primaryTypographyProps={{ sx: { color: "black", cursor: "pointer" } }}
                        />
                    )}
                </ListItem>
            </List>
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
                            ...(isMobile && mobileOpen && { zIndex: theme.zIndex.drawer + 2 }),
                            transition: "width 0.3s",
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 3, lg: 4 },
                    backgroundColor: "#f5f5f5",
                    minHeight: "100vh",
                    mt: isMobile ? "56px" : 0,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}