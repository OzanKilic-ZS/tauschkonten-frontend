import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import Assignment from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";

export default function CustomerCaseTypesGrid({ kundeId, liste = [] }) {
  const [customerCaseTypes, setCustomerCaseTypes] = useState(Array.isArray(liste) ? liste : []);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Wenn sich die Prop `liste` ändert, aktualisiere den State
  useEffect(() => {
    setCustomerCaseTypes(Array.isArray(liste) ? liste : []);
    setLoading(false);
  }, [liste]);

  // Filterung
  useEffect(() => {
    if (!Array.isArray(customerCaseTypes)) return setFiltered([]);
    if (search.trim() === "") {
      setFiltered(customerCaseTypes);
    } else {
      const searchLower = search.toLowerCase();
      setFiltered(
        customerCaseTypes.filter((p) =>
          (p?.name || "").toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, customerCaseTypes]);

  // --- Fallbacks, wenn keine Daten ---
  if (!kundeId) {
    return (
      <Typography variant="body1" sx={{ color: "gray" }}>
        Bitte zuerst einen Kunden auswählen.
      </Typography>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!Array.isArray(customerCaseTypes) || customerCaseTypes.length === 0) {
    return (
      <Typography variant="body1" sx={{ color: "gray" }}>
        Keine CustomerCaseType für diesen Kunden vorhanden.
      </Typography>
    );
  }

  // Sicherer Zugriff auf das erste Element
  const firstItem = customerCaseTypes[0] || {};

  return (
    <Box
      sx={{
        p: 2,
        textAlign: "center",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-10px) scale(1.05)",
        },
      }}
    >
      {/* Header mit dunklem Blau */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #27568d 0%, #27568d 100%)",
          p: 2,
          borderRadius: "8px 8px 0 0",
          color: "white",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}
        //onClick={() => navigate(`/custtransaction/${p?.customer2CaseAndTypeId}`)}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {firstItem?.name || "Unbekannt"}
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
          {firstItem?.strasse || ""}
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
          {firstItem?.plz || ""} {firstItem?.ort || ""}
        </Typography>
      </Box>

      {/* Scrollbare Liste */}
      <List
        sx={{
          cursor: "pointer",
          height: 130,
          bgcolor: "background.paper",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
          maxHeight: "65vh",
          overflowY: "auto",
        }}
      >
      {filtered.map((p, index) => {
        const caseName = p?.caseTypeName || "Unbekannt";

        return (
          <React.Fragment key={p?.customer2CaseAndTypeId}>
              <ListItem
                sx={{
                  cursor: "pointer",
                  borderRadius: 3,
                  mb: 1,
                  p: 0,
                  backgroundColor: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  transition: "0.25s",
                  "&:hover": {
                    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                    transform: "translateY(-3px)",
                  },
                }}
                onClick={() => navigate(`/custtransaction/${p?.customer2CaseAndTypeId}`)}
                secondaryAction={
                  <Tooltip title="Details anzeigen">
                    <IconButton edge="end">
                      <ArrowForwardIos fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemIcon>
                  <Assignment sx={{ color: "#ea9119" }} />
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {caseName}
                    </Typography>
                  }
                />
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>       
    </Box>
  );
}
