import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query
} from 'firebase/firestore';
import {
  Container, Typography, Button, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
  Tabs, Tab, Chip, CircularProgress, Tooltip, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Login from './Login';

// ─── Collection schemas ────────────────────────────────────────────────────────
const SCHEMAS = {
  projects: [
    { key: 'title', label: 'Title', required: true },
    { key: 'text', label: 'Description', multiline: true },
    { key: 'image', label: 'Image URL' },
    { key: 'link', label: 'Live Link' },
    { key: 'github', label: 'GitHub URL' },
    { key: 'order', label: 'Order', type: 'number' },
  ],
  work: [
    { key: 'text', label: 'Text (e.g. "Software Engineer @ Acme")', required: true },
    { key: 'date', label: 'Date (e.g. "Jan 2023" or "2022 – 2024")', required: true },
    { key: 'color', label: 'Shape Color — "blue" or "primary" for professional, "gold" or "secondary" for personal' },
    { key: 'order', label: 'Order', type: 'number' },
  ],
  publications: [
    { key: 'title', label: 'Title', required: true },
    { key: 'text', label: 'Description', multiline: true },
    { key: 'image', label: 'Image URL' },
    { key: 'link', label: 'Link' },
    { key: 'order', label: 'Order', type: 'number' },
  ],
  skills: [
    { key: 'label', label: 'Label', required: true },
    { key: 'type', label: 'Type (languages / frameworks_tools / skills)', required: true },
    { key: 'color', label: 'Color (hex)' },
  ],
};

// ─── Empty record factories ────────────────────────────────────────────────────
const emptyRecord = (collectionName) =>
  Object.fromEntries(SCHEMAS[collectionName].map((f) => [f.key, '']));

// ─── Record Form Dialog ────────────────────────────────────────────────────────
const RecordDialog = ({ open, onClose, onSave, collectionName, initial }) => {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial, open]);

  const fields = SCHEMAS[collectionName] || [];

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const cleaned = { ...form };
    fields.forEach((f) => {
      if (f.type === 'number') cleaned[f.key] = Number(cleaned[f.key]) || 0;
    });
    onSave(cleaned);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {initial.id ? 'Edit Record' : 'New Record'}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {collectionName}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {fields.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              value={form[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              multiline={f.multiline}
              rows={f.multiline ? 3 : 1}
              required={f.required}
              type={f.type || 'text'}
              size="small"
              fullWidth
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Delete Confirmation Dialog ────────────────────────────────────────────────
const DeleteDialog = ({ open, onClose, onConfirm, title }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs">
    <DialogTitle>Delete record?</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete <strong>{title}</strong>? This cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="inherit">Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="error">Delete</Button>
    </DialogActions>
  </Dialog>
);

// ─── Collection Tab ────────────────────────────────────────────────────────────
const CollectionTab = ({ collectionName }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const fields = SCHEMAS[collectionName] || [];
  const displayFields = fields.slice(0, 3); // show first 3 cols in table

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, collectionName));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // sort by order field if present, else by first field
      data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setRecords(data);
    } catch (err) {
      showSnack(`Failed to load ${collectionName}: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenAdd = () => {
    setEditRecord(emptyRecord(collectionName));
    setDialogOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditRecord(record);
    setDialogOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editRecord.id) {
        const { id, ...data } = formData;
        await updateDoc(doc(db, collectionName, editRecord.id), data);
        showSnack('Record updated.');
      } else {
        await addDoc(collection(db, collectionName), formData);
        showSnack('Record created.');
      }
      setDialogOpen(false);
      fetchRecords();
    } catch (err) {
      showSnack(`Save failed: ${err.message}`, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, collectionName, deleteTarget.id));
      showSnack('Record deleted.');
      setDeleteTarget(null);
      fetchRecords();
    } catch (err) {
      showSnack(`Delete failed: ${err.message}`, 'error');
    }
  };

  const getDisplayTitle = (record) =>
    record.title || record.label || record.company || record.id;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
          {collectionName}
          <Chip label={records.length} size="small" sx={{ ml: 1 }} />
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          Add
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No records yet. Click "Add" to create one.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                {displayFields.map((f) => (
                  <TableCell key={f.key} sx={{ fontWeight: 600 }}>
                    {f.label}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} hover>
                  {displayFields.map((f) => (
                    <TableCell key={f.key} sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(record[f.key] ?? '—')}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEdit(record)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(record)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RecordDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        collectionName={collectionName}
        initial={editRecord || emptyRecord(collectionName)}
      />

      <DeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget ? getDisplayTitle(deleteTarget) : ''}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Main Admin Component ──────────────────────────────────────────────────────
const COLLECTIONS = ['projects', 'work', 'publications', 'skills'];

const Admin = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => signOut(auth);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Admin Panel
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Button onClick={handleLogout} variant="outlined" size="small">
            Logout
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Collection Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {COLLECTIONS.map((name) => (
          <Tab
            key={name}
            label={name.charAt(0).toUpperCase() + name.slice(1)}
            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
          />
        ))}
      </Tabs>

      {COLLECTIONS.map((name, i) =>
        activeTab === i ? (
          <CollectionTab key={name} collectionName={name} />
        ) : null
      )}
    </Container>
  );
};

export default Admin;
