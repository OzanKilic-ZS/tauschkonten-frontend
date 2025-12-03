import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Stack, Typography } from '@mui/material';

export default function CustomerCaseTypes({ kundeId, onSelect }) {
  const [customerCaseTypes, setCustomerCaseTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kundeId) return;
    setLoading(true);

    axios.get(`/api/kunden/${kundeId}/customerCaseTypes`)
      .then(res => setCustomerCaseTypes(res.data))
      .catch(err => console.error('Fehler beim Laden der customerCaseTypes:', err))
      .finally(() => setLoading(false));
  }, [kundeId]);

  if (!kundeId) {
    return <Typography variant="body1">Bitte zuerst einen Kunden auswählen.</Typography>;
  }

  if (loading) {
    return <Typography variant="body1">Lade Paletten...</Typography>;
  }

  if (customerCaseTypes.length === 0) {
    return <Typography variant="body1">Keine Paletten für diesen Kunden vorhanden.</Typography>;
  }

  return (
    <Stack direction="row" spacing={2}>
      {customerCaseTypes.map((p) => (
        <Button
          key={p.name}
          variant="contained"
          onClick={() => onSelect(p.name)}
          sx={{
            backgroundColor: '#1976d2',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: 2,
            '&:hover': { backgroundColor: '#0D47A1' }
          }}
        >
          {p.name}
        </Button>
      ))}
    </Stack>
  );
}
