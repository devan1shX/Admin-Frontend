import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { Plus } from "lucide-react";

export function AddTechnologyButton() {
  const navigate = useNavigate();

  return (
    <Button variant="contained" onClick={() => navigate("/add-technology")}>
      <Plus style={{ marginRight: 8, height: 16, width: 16 }} /> Add Technology
    </Button>
  );
}
