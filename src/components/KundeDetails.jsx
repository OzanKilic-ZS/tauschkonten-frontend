// Updated KundeDetails.jsx with improved date handling
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import EditIcon from "@mui/icons-material/Edit";
import VerifiedIcon from "@mui/icons-material/Verified";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import axios from 'axios';
import { generatePdf } from "./generatePdf";

import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  TablePagination, Tabs, Tab
} from '@mui/material';

export default function KundeDetails({ infoMode = false }) {
  const { customer2CaseANdTypeId } = useParams();
  const navigate = useNavigate();
  const tableContainerRef = useRef();

  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("de-DE");
  };

  const dateFields = [
    "lieferAbholdatum",
    "saldenbestaetigungsDatum",
    "geaendertAm"
  ];

  const columnGroups = [
    { label: 'Buchungsdaten', fields: ['lieferAbholdatum','lieferscheinNr','abholscheinNr','auftragsNrZS','auftragsNrKunde','rechnungsNrZS','buchungsinfo','lieferungZS','abholungZS','saldo'] },
    { label: 'Änderungsdaten', fields: ['saldenbestaetigungsDatum','saldenbestaetigungsPerson','geaendertVon','geaendertAm', 'bemerkungen'] }
  ];

  const editableFields = [
    'lieferAbholdatum','lieferscheinNr','abholscheinNr','auftragsNrZS','auftragsNrKunde',
    'rechnungsNrZS','buchungsinfo','lieferungZS','abholungZS','bemerkungen'
  ];

  const fieldLabels = {
    lieferAbholdatum: 'Liefer-/Abholdatum',
    lieferscheinNr: 'Lieferschein Nr.',
    abholscheinNr: 'Abholschein Nr.',
    auftragsNrZS: 'Auftragsnr ZS',
    auftragsNrKunde: 'Auftragsnr Kunde',
    rechnungsNrZS: 'Rechnungsnr ZS',
    buchungsinfo: 'Buchungsinfo',
    lieferungZS: 'Lieferung ZS / Abholung Kunde',
    abholungZS: 'Abholung ZS / Anlieferung Kunde',
    saldo: 'Saldo',
    saldenbestaetigungsDatum: 'Saldenbestätigung Datum',
    saldenbestaetigungsPerson: 'Saldenbestätigung Person',
    bemerkungen: 'Bemerkungen',
    geaendertVon: 'Geändert von',
    geaendertAm: 'Geändert am'
  };

  const calculateSaldo = (rows) => {
    return rows.map((row, index) => {
      const prevSaldo = index > 0 ? parseFloat(rows[index-1].saldo || 0) : 0;
      const lieferung = parseFloat(row.lieferungZS || 0);
      const abholung = parseFloat(row.abholungZS || 0);
      const saldoBerechnet = prevSaldo + lieferung - abholung;
      return { ...row, saldoBerechnet };
    });
  };

  const getLastPage = (totalRows) => Math.max(0, Math.floor((totalRows - 1) / rowsPerPage));

  useEffect(() => {
    axios.get(`/api/kundenTransactions/${customer2CaseANdTypeId}`)
      .then(res => {
        const sorted = res.data.sort((a,b) => a.creationDate ? new Date(a.creationDate) - new Date(b.creationDate) : a.id.localeCompare(b.id));
        const withSaldo = calculateSaldo(sorted);
        setRows(withSaldo);

        if (withSaldo.length > 0 && !infoMode) {
          const filteredLength = withSaldo.filter(r =>
            Object.values(r).some(val => String(val).toLowerCase().includes(filter.toLowerCase()))
          ).length;
          setPage(getLastPage(filteredLength));
        }
      })
      .catch(err => console.error(err));
  }, [customer2CaseANdTypeId, infoMode, rowsPerPage, filter]);

  const filteredRows = rows.filter(r =>
    Object.values(r).some(val => String(val).toLowerCase().includes(filter.toLowerCase()))
  );
  const paginatedRows = filteredRows.slice(page*rowsPerPage, page*rowsPerPage+rowsPerPage);

  const handleOpenDialog = (transactionId = null) => {
    if(infoMode) return;
    const index = transactionId ? rows.findIndex(r => r.transactionId === transactionId) : null;
    if(index !== null && index >= 0){
      setForm({...rows[index]});
      setEditIndex(index);
    } else {
      const initialForm = {};
      editableFields.forEach(f => initialForm[f]='');
      const lastSaldo = rows.length>0 ? rows[rows.length-1].saldo || 0 : 0;
      initialForm.saldo = lastSaldo;
      setForm(initialForm);
      setEditIndex(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => setDialogOpen(false);

  const handleSave = () => {
    let newForm = {...form};
    if(editIndex===null){
      const lastSaldo = rows.length>0 ? rows[rows.length-1].saldo || 0 : 0;
      newForm.saldo = lastSaldo + (parseFloat(newForm.lieferungZS)||0) - (parseFloat(newForm.abholungZS)||0);

      axios.post(`/api/kundenTransactions/${customer2CaseANdTypeId}`, newForm)
        .then(res => {
          const updatedRows = [...rows,res.data];
          setRows(updatedRows);

          const filteredLength = updatedRows.filter(r =>
            Object.values(r).some(val => String(val).toLowerCase().includes(filter.toLowerCase()))
          ).length;
          setPage(getLastPage(filteredLength));
        });
    } else {
      axios.put(`/api/kundenTransactions/${customer2CaseANdTypeId}/${rows[editIndex].transactionId}`, newForm)
        .then(res => {
          const updated = [...rows];
          updated[editIndex] = res.data;
          setRows(updated);
        });
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (transactionId) => {
    if(infoMode) return;
    setDeleteId(transactionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    axios.delete(`/api/kundenTransactions/${deleteId}`)
       .then(() => {
      const updatedRows = rows.filter(r => r.transactionId !== deleteId);
      setRows(updatedRows);

      const filteredLength = updatedRows.filter(r =>
        Object.values(r).some(val => String(val).toLowerCase().includes(filter.toLowerCase()))
      ).length;
      setPage(prevPage => Math.min(prevPage, getLastPage(filteredLength)));
    })
    .catch(err => console.error(err))
    .finally(() => {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    });
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleJumpLive = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setSearchTerm(value);

    if (!value) return;

    const searchFields = [
      'lieferAbholdatum','lieferscheinNr','abholscheinNr',
      'auftragsNrZS','auftragsNrKunde','rechnungsNrZS',
      'buchungsinfo','lieferungZS','abholungZS',
      'saldo','bemerkungen'
    ];

    const index = rows.findIndex(r =>
      searchFields.some(f =>
        String(r[f] || '').toLowerCase().includes(value)
      )
    );

    if (index === -1) return;

    const row = rows[index];

    const newPage = Math.floor(index / rowsPerPage);
    setPage(newPage);

    setTimeout(() => {
      document
        .querySelector(`#row-${row.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  const highlightReactSafe = (text, term) => {
    if (!term) return text;
    if (!text) return text;

    const lower = text.toLowerCase();
    const lowerTerm = term.toLowerCase();

    const parts = [];
    let start = 0;
    let index;

    while ((index = lower.indexOf(lowerTerm, start)) !== -1) {
      parts.push(text.slice(start, index));
      parts.push(
        <span key={index} className="highlight-animated">
          {text.slice(index, index + term.length)}
        </span>
      );
      start = index + term.length;
    }

    parts.push(text.slice(start));
    return parts;
  };

  return (
    <Box sx={{width:'95%', mx:'auto', mt:5}}>
      {filteredRows.length > 0 && 
        <Typography variant="h3" sx={{mb:3, color:'#27568d', fontWeight:'bold'}}>
          <div>{filteredRows[0].custName}</div>
        </Typography>
      }{filteredRows.length > 0 &&    
        <Typography variant="h6" sx={{mb:3, color:'#FF9800', fontWeight:'normal'}}>
          <div> Info: {filteredRows[0].custCaseTypeBeschreibung} </div>
        </Typography>       
      }
      {!infoMode &&
      <Stack direction="row" spacing={2} sx={{mb:2}}>
        <Button variant="contained" sx={{backgroundColor:'#27568d'}} onClick={()=>handleOpenDialog()}>Neue Buchung</Button>
        <Button variant="contained" sx={{backgroundColor:'#FF9800'}} onClick={()=>navigate(-1)}>Zurück</Button>
        <TextField
          label="Suchen / Springen"
          size="small"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleJumpLive(e);
          }}
        />
      </Stack>
      }

      <Tabs value={tabIndex} onChange={(e,newValue)=>setTabIndex(newValue)} sx={{mb:2}}>
        {columnGroups.map((g,i)=><Tab key={i} label={g.label}/>)}}
      </Tabs>

      <TableContainer component={Paper} ref={tableContainerRef} sx={{maxHeight:'70vh', overflowY:'auto'}}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columnGroups[tabIndex].fields.map(f => (
                <TableCell key={f} sx={{
                  color:'white',
                  fontSize:'0.8rem',
                  bgcolor:'#27568d',
                  position:'sticky',
                  top:0,
                  zIndex:2
                }}>
                  {fieldLabels[f]||f}
                </TableCell>
              ))}
              {!infoMode &&
                <TableCell
                  sx={{
                    position: 'sticky',
                    right: 0,
                    bgcolor: '#27568d',
                    color: 'white',
                    fontSize: '0.8rem',
                    zIndex: 3,
                    minWidth: '120px'
                  }}
                >
                  Aktionen
                </TableCell>
              }
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow
                key={row.id}
                id={`row-${row.id}`}
                sx={{
                  backgroundColor: row.id === highlightId ? "rgb(255, 241, 150)" : "inherit",
                  transition: "background-color 0.3s ease"
                }}
              >
                {columnGroups[tabIndex].fields.map(f => {
                  if(f === 'saldo') {
                    return (
                      <TableCell
                        key={f}
                        sx={{
                          fontSize: '0.8rem',
                          bgcolor: row.saldo !== row.saldoBerechnet ? 'error.light' : row.saldo < 0 ? 'error.main' : 'success.dark',
                          color: 'white',                          
                        }}
                      >
                        {row.saldo !== row.saldoBerechnet 
                          ? `Abweichung: berechnet: ${row.saldoBerechnet}, aktuelles Saldo: ${row.saldo}` 
                          : row.saldo
                        }
                      </TableCell>
                    )
                  }

                  return (
                    <TableCell key={f} sx={{ fontSize: '0.8rem' }}>
                      {dateFields.includes(f)
                        ? formatDate(row[f])
                        : highlightReactSafe(String(row[f] ?? ""), searchTerm)
                      }
                    </TableCell>
                  );
                })}
                {!infoMode &&
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {row.saldenbestaetigungsDatum !== null  && <IconButton aria-label="verified" color="success"> <VerifiedIcon fontSize="small" /> </IconButton>}
                      {row.saldenbestaetigungsDatum === null  && <IconButton aria-label="edit" color="primary" onClick={() => handleOpenDialog(row.transactionId)}> <EditIcon fontSize="small"/> </IconButton>}
                      <IconButton aria-label="drucken" color="primary" onClick={() => generatePdf(customer2CaseANdTypeId, row.lieferAbholdatum)}> <PrintIcon fontSize="small" /> </IconButton>
                      {row.saldenbestaetigungsDatum === null  && <IconButton aria-label="delete" color="error" onClick={() => handleDeleteClick(row.transactionId)}> <DeleteIcon fontSize="small" /> </IconButton>}
                      {row.saldenbestaetigungsDatcdum === null  && <IconButton aria-label="newreleases" color="warning"> <NewReleasesIcon fontSize="small" /> </IconButton>}
                    </Stack>
                  </TableCell>
                }
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={(e,newPage)=>setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e=>{setRowsPerPage(parseInt(e.target.value,10)); setPage(0);}}
        rowsPerPageOptions={[10,20,50]}
        labelRowsPerPage="Zeilen pro Seite"
      />

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Löschen bestätigen</DialogTitle>
        <DialogContent>
          <Typography>Möchten Sie diese Buchung wirklich löschen?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Abbrechen</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>Löschen</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editIndex!==null?'Bearbeiten':'Neue Buchung'}</DialogTitle>
        <DialogContent sx={{display:'flex',flexDirection:'column',gap:2,mt:1}}>
          {editableFields.map(f => (
            infoMode ? (
              <Box key={f}>
                <Typography variant="body2">{fieldLabels[f] || f}</Typography>
                <Typography variant="body1">{form[f] || '-'}</Typography>
              </Box>
            ) : (
              dateFields.includes(f) ? (
                <TextField
                  key={f}
                  label={fieldLabels[f] || f}
                  type="date"
                  value={form[f] ? form[f].split("T")[0] : ""}
                  onChange={e => setForm({...form, [f]: e.target.value })}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              ) : (
                <TextField
                  key={f}
                  label={fieldLabels[f] || f}
                  value={form[f] || ''}
                  onChange={e => setForm({...form, [f]: e.target.value})}
                  size="small"
                  fullWidth
                />
              )
            )
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          {!infoMode && <Button variant="contained" onClick={handleSave}>{editIndex!==null?'Speichern':'Hinzufügen'}</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// --- Backend Funktionen für Hinzufügen & Bearbeiten ---
const saveKunde = async (kunde) => {
  const isUpdate = Boolean(kunde.id);
  const url = isUpdate ? `/api/kunden/${kunde.id}` : `/api/kunden`;
  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kunde)
  });

  if (!res.ok) throw new Error(`Fehler beim Speichern: ${res.status}`);
  return res.json();
};

// Dialog-Speichern Aktion Beispiel:
// const handleSave = async () => {
//   const saved = await saveKunde(form);
//   onUpdated(saved);
//   closeDialog();
// };
