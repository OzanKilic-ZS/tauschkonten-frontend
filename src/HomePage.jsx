// src/HomePage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Tabs, Tab, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import CustomerCaseTypesGrid from './components/CustomerCaseTypesGrid';

export default function HomePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [kunden, setKunden] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kategorien, setKategorien] = useState([]);
  const [selectedType, setSelectedType] = useState('');

  const parentRef = useRef(); // Scrollcontainer
  const columnWidth = 300;
  const rowHeight = 280;

  // Responsive Columns
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  let columnCount = 6;
  if (isXs) columnCount = 1;
  else if (isSm) columnCount = 2;
  else if (isMd) columnCount = 3;

  // --- Debounce für Suche
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // --- Kategorien laden
  useEffect(() => {
    axios.get('/api/customer-case-types')
      .then(res => {
        const cats = res.data || [];
        setKategorien(cats);
        if (cats.length > 0 && !selectedType) setSelectedType(cats[0].name);
      })
      .catch(err => console.error(err));
  }, []);

  // --- Kunden laden
  useEffect(() => {
    if (!selectedType) return;
    axios.get(`/api/kunden?typ=${selectedType}`)
      .then(res => setKunden(res.data || []))
      .catch(err => console.error(err));
  }, [selectedType]);

  // --- Gefilterte Kunden
  const filteredKunden = useMemo(() => {
    if (!kunden) return [];
    if (!debouncedSearch) return kunden;
    const searchLower = debouncedSearch.toLowerCase();
    return kunden.filter(k =>
      (k.name?.toLowerCase() || '').includes(searchLower) ||
      (k.strasse?.toLowerCase() || '').includes(searchLower) ||
      (k.plz?.toString() || '').includes(searchLower) ||
      (k.ort?.toLowerCase() || '').includes(searchLower) ||
      (k.caseTypeName?.toLowerCase() || '').includes(searchLower)||
      (k.caseTypeBeschreibung?.toLowerCase() || '').includes(searchLower)
    );
  }, [kunden, debouncedSearch]);

  // --- Virtualizer
  const groupedKunden = Map.groupBy(filteredKunden, item => item.id);
  const rowCount = Math.ceil(groupedKunden.size / columnCount) || 1;
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
  });

  // Dynamische Höhe für Scrollcontainer
  const headerHeight = 250; // Höhe des Fixed-Headers (px)
  const viewportHeight = window.innerHeight - headerHeight;

  return (
    <Box sx={{ width: '100%', mx: 5, mt: 5 }}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          bgcolor: 'white',
          boxShadow: 2,
          zIndex: theme.zIndex.appBar + 1,
          py: 3,
          px: 2,
        }}
      >
        <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', color: '#27568d', mb: 2 }}>
          Kundendashboard
        </Typography>

        <Tabs
          value={selectedType}
          centered
          onChange={(e, newValue) => setSelectedType(newValue)}
          sx={{ mb: 3 }}
        >
          {kategorien.map((kat) => (
            <Tab key={kat.id} label={kat.name} value={kat.name} />
          ))}
        </Tabs>

        <Box sx={{ width: { xs: '90%', sm: '50%', md: '25%' }, mx: 'auto' }}>
          <TextField
            label="Kunde suchen..."
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </Box>
      </Box>

      {/* Virtualized Grid */}
      <Box
        ref={parentRef}
        sx={{
          mt: `${headerHeight}px`,
          height: `${viewportHeight}px`,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const rowIndex = virtualRow.index;
            const top = virtualRow.start;
            const itemsInRow = [];
            if (filteredKunden.length == 0) return;
            const grouped = Map.groupBy(filteredKunden, item => item.id);
            const idArrays = [...grouped.keys()];

            for (let col = 0; col < columnCount; col++) {
              const itemIndex = rowIndex * columnCount + col;
              const id = idArrays[itemIndex];
              const kunde = grouped.get(id);
              if (!kunde) continue;
              itemsInRow.push(
                <Box
                  key={`${id}-${rowIndex}-${col}`}
                  sx={{
                    position: 'absolute',
                    top: top,
                    left: col * columnWidth,
                    width: columnWidth,
                    height: rowHeight,
                    p: 1,
                  }}
                >
                  <CustomerCaseTypesGrid
                    kundeId={id}
                    liste={kunde}
                  />
                </Box>
              );
            }
            return itemsInRow;
          })}
        </Box>
      </Box>
    </Box>
  );
}
