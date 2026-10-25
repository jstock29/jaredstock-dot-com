import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Paper, Snackbar, Switch, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { db } from '../../firebase';
import { ENTRY_TYPES, entryPath, formatDate, getEntries, hasPage, isPublished } from '../../data/content';

// Projects, publications, pages and blog posts: a list with ordering (posts are newest
// first instead) and publishing, and a link into the block editor for everything else.
export default function EntryList({ type }) {
  const config = ENTRY_TYPES[type];
  const dated = Boolean(config.dated);
  const [entries, setEntries] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState(null);

  const load = useCallback(async () => {
    try {
      setEntries(await getEntries(type, { includeDrafts: true, fresh: true }));
    } catch (err) {
      setEntries([]);
      setSnack({ severity: 'error', message: `Couldn't load ${config.label.toLowerCase()}: ${err.message}` });
    }
  }, [type, config]);

  useEffect(() => {
    setEntries(null);
    load();
  }, [load]);

  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      if (success) setSnack({ severity: 'success', message: success });
    } catch (err) {
      setSnack({ severity: 'error', message: err.message });
    } finally {
      await load();
      getEntries(type, { fresh: true }); // refresh the public-site cache
      setBusy(false);
    }
  };

  // Rewrites every entry's order as 1..n so gaps and duplicate orders from older data go away.
  const move = (index, dir) =>
    run(async () => {
      const next = [...entries];
      [next[index], next[index + dir]] = [next[index + dir], next[index]];
      const batch = writeBatch(db);
      next.forEach((e, i) => batch.update(doc(db, type, e.id), { order: i + 1 }));
      await batch.commit();
    });

  const togglePublished = (entry) =>
    run(
      () => {
        const now = new Date().toISOString();
        const patch = { published: !isPublished(entry), updatedAt: now };
        if (dated && patch.published && !entry.publishedAt) patch.publishedAt = now;
        return updateDoc(doc(db, type, entry.id), patch);
      },
      isPublished(entry) ? `"${entry.title}" is now a draft.` : `"${entry.title}" is live.`,
    );

  const remove = () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    run(() => deleteDoc(doc(db, type, target.id)), `Deleted "${target.title}".`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {config.label}
          {entries && <Chip label={entries.length} size="small" sx={{ ml: 1 }} />}
        </Typography>
        <Button component={RouterLink} to={`/admin/${type}/new`} variant="contained" size="small" startIcon={<AddIcon />}>
          New {config.singular}
        </Button>
      </Box>

      {type === 'pages' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pages live at their own address (jaredstock.com/your-slug). Turn on "Show in the home page menu" in a page's
          basics to link it from the home page menu.
        </Typography>
      )}
      {dated && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Posts live at jaredstock.com/blog, newest first. Drafts are private: only you can see them, even with the
          link.
        </Typography>
      )}
      {type === 'publications' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A publication links straight to the article until you add blocks to it; then it gets its own page.
        </Typography>
      )}

      {!entries ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          Nothing here yet. Click "New {config.singular}" to start one.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                {dated ? (
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                ) : (
                  <TableCell sx={{ fontWeight: 600, width: 88 }}>Order</TableCell>
                )}
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Published</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry, i) => {
                const live = isPublished(entry) && hasPage(type, entry);
                return (
                  <TableRow key={entry.id} hover>
                    {dated ? (
                      <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>
                        {entry.publishedAt ? formatDate(entry.publishedAt) : 'Not yet'}
                      </TableCell>
                    ) : (
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" disabled={busy || i === entries.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                    <TableCell>
                      <RouterLink to={`/admin/${type}/${entry.id}`} style={{ color: 'inherit', fontWeight: 500 }}>
                        {entry.title || 'Untitled'}
                      </RouterLink>
                      {type === 'pages' && entry.showInNav && <Chip label="in nav" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: 13, display: { xs: 'none', sm: 'table-cell' } }}>
                      {hasPage(type, entry) ? entryPath(type, entry) : 'links out'}
                    </TableCell>
                    <TableCell>
                      <Switch size="small" checked={isPublished(entry)} disabled={busy} onChange={() => togglePublished(entry)} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" component={RouterLink} to={`/admin/${type}/${entry.id}`}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {hasPage(type, entry) && (
                        <Tooltip title={live ? 'View on the site' : 'Preview the draft'}>
                          <IconButton
                            size="small"
                            component="a"
                            href={live ? entryPath(type, entry) : `${entryPath(type, entry)}?preview=1`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" disabled={busy} onClick={() => setDeleteTarget(entry)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete {config.singular}?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.title}</strong>? This can't be undone. Uploaded media stays in Storage.
            To hide it for now, switch it to a draft instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={remove} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        ) : <span />}
      </Snackbar>
    </Box>
  );
}
