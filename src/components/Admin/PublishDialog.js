import React from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem,
  ListItemIcon, ListItemText, Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ENTRY_TYPES, shareDescription, shareImage } from '../../data/content';
import ShareCardPreview from './ShareCardPreview';

const ICONS = {
  ok: <CheckCircleIcon color="success" fontSize="small" />,
  warn: <WarningAmberIcon color="warning" fontSize="small" />,
  info: <InfoOutlinedIcon color="action" fontSize="small" />,
};

// What to look at before something goes live. Nothing here blocks publishing except a
// missing title; the rest are things you'd want to know about first.
function checks(type, entry, stats) {
  const list = [];
  const hasBody = (entry.blocks || []).some((b) => b.type !== 'text' || (b.md || '').trim());
  list.push(
    hasBody
      ? { level: 'ok', text: type === 'posts' ? `${stats.words.toLocaleString()} words, about ${stats.minutes} min to read` : 'It has content' }
      : { level: 'warn', text: type === 'publications' ? 'No blocks yet, so its card links straight to the article' : "There's nothing in the body yet" },
  );
  if (type === 'posts') {
    list.push(
      shareImage(entry)
        ? { level: 'ok', text: 'Link previews will show the hero image' }
        : { level: 'warn', text: "No hero image, so link previews will use the site's default picture" },
    );
    list.push(
      shareDescription(entry)
        ? { level: 'ok', text: 'Link previews have a description' }
        : { level: 'warn', text: 'No subtitle or opening text for the link preview description' },
    );
    list.push(
      entry.blueskyPost
        ? { level: 'ok', text: 'Replies from your Bluesky post will show under it' }
        : { level: 'info', text: 'To show replies, share it on Bluesky and paste that post’s link into Post settings' },
    );
  }
  return list;
}

export default function PublishDialog({ mode, type, entry, pagePath, stats, onClose, onConfirm }) {
  const config = ENTRY_TYPES[type];
  const isPost = type === 'posts';
  const open = Boolean(mode);

  if (mode === 'unpublish') {
    return (
      <Dialog open onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Unpublish this {config.singular}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            It comes off the site right away and goes back to a draft that only you can see. Anyone with the link gets
            a not-found page. Your latest edits are saved too.
            {isPost && ' Link previews, the feed and its AT Protocol record update within about 15 minutes.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button onClick={() => onConfirm(false)} variant="contained" color="warning">Unpublish</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ pb: 0.5 }}>
        Publish this {config.singular}?
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          jaredstock.com{pagePath}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <List dense disablePadding sx={{ mb: isPost ? 2 : 0 }}>
          {open &&
            checks(type, entry, stats).map((c) => (
              <ListItem key={c.text} disableGutters sx={{ alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>{ICONS[c.level]}</ListItemIcon>
                <ListItemText primary={c.text} />
              </ListItem>
            ))}
        </List>
        {isPost && open && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary">How a shared link looks</Typography>
            <ShareCardPreview entry={entry} />
          </Box>
        )}
        <DialogContentText variant="body2">
          It goes live on the site right away.
          {isPost && ' Link previews, the feed and its AT Protocol record catch up within about 15 minutes.'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Not yet</Button>
        <Button onClick={() => onConfirm(true)} variant="contained">Publish now</Button>
      </DialogActions>
    </Dialog>
  );
}
