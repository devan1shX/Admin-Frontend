import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import AddTechnology from "./pages/AddTechnology"; 
import EditTechnology from "./pages/EditTechnology";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EditEvents from "./pages/EditEvents";
import AddEvents from "./pages/AddEvents";
import EditLinks from "./pages/EditLinks";
import Login from "./pages/Login/Login";
import Signup from "./pages/SignUp/Signup";

function App() {
  const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem("token");
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/add-technology"
          element={
            <ProtectedRoute>
              <AddTechnology />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-technology/:id"
          element={
            <ProtectedRoute>
              <EditTechnology />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-event/:title/:day"
          element={
            <ProtectedRoute>
              <EditEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-event"
          element={
            <ProtectedRoute>
              <AddEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-links"
          element={
            <ProtectedRoute>
              <EditLinks />
            </ProtectedRoute>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/admin-dashboard" />} />
      </Routes>
    </>
  );
}

export default App;
