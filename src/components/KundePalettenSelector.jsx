import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Stack, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function KundePalettenSelector() {
  const navigate = useNavigate();

  const [kunden, setKunden] = useState([]);
  const [selectedKunde, setSelectedKunde] = useState(null);

  const [kategorien, setKategorien] = useState([]);
  const [selectedKategorie, setSelectedKategorie] = useState('');

  const [paletten, setPaletten] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Kunden laden
  useEffect(() => {
    axios.get('/api/kunden')
      .then(res => setKunden(res.data))
      .catch(err => console.error(err));
  }, []);

  // Kategorien laden
  useEffect(() => {
    axios.get('/api/customer-case-types')
      .then(res => {
        setKategorien(res.data);
        if (res.data.length > 0) setSelectedKategorie(res.data[0].name);
      })
      .catch(err => console.error(err));
  }, []);

  // Paletten laden, wenn Kunde und Kategorie ausgewählt
  useEffect(() => {
    if (!selectedKunde || !selectedKategorie) return;

    axios.get(`/api/kunden/${selectedKunde.id}/paletten?caseType=${selectedKategorie}`)
      .then(res => setPaletten(res.data))
      .catch(err => console.error(err));
  }, [selectedKunde, selectedKategorie]);

  // Kunden filtern
  const filteredKunden = kunden.filter(k =>
    k.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold' }}>
        Kunden Dashboard
      </Typography>

      {/* Suchfeld */}
      <TextField
        fullWidth
        placeholder="Kunde suchen..."
        variant="outlined"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        sx={{ mb: 3, backgroundColor: 'white', borderRadius: 2 }}
      />

      {/* Kunden auswählen */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Kunde auswählen</InputLabel>
        <Select
          value={selectedKunde ? selectedKunde.id : ''}
          onChange={e => setSelectedKunde(kunden.find(k => k.id === e.target.value))}
        >
          {filteredKunden.map(k => (
            <MenuItem key={k.id} value={k.id}>{k.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Kategorie auswählen */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Kategorie auswählen</InputLabel>
        <Select
          value={selectedKategorie}
          onChange={e => setSelectedKategorie(e.target.value)}
        >
          {kategorien.map(cat => (
            <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Paletten Buttons */}
      {paletten.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          {paletten.map(palette => (
            <Button
              key={palette}
              variant="contained"
              onClick={() => navigate(`/kunde/${selectedKunde.id}/${palette}`)}
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 2,
                mb: 1,
                '&:hover': { backgroundColor: '#0D47A1' }
              }}
            >
              {palette}
            </Button>
          ))}
        </Stack>
      )}

      {selectedKunde && selectedKategorie && paletten.length === 0 && (
        <Typography sx={{ mt: 2, color: 'gray' }}>Keine Paletten verfügbar</Typography>
      )}
    </Box>
  );
}
