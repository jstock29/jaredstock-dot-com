import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { shareDescription, shareImage } from '../../data/content';

// Roughly what Bluesky, iMessage and Slack show for a shared link.
export default function ShareCardPreview({ entry }) {
  const image = shareImage(entry);
  return (
    <Paper variant="outlined" sx={{ maxWidth: 520, borderRadius: 3, overflow: 'hidden' }}>
      {image ? (
        <Box
          role="img"
          aria-label="Share image"
          sx={{ aspectRatio: '1.91 / 1', backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: 'center', bgcolor: 'action.hover' }}
        />
      ) : (
        <Box sx={{ aspectRatio: '1.91 / 1', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.secondary', p: 2, textAlign: 'center' }}>
          <Typography variant="body2">No hero or share image yet, so previews fall back to the site's default image.</Typography>
        </Box>
      )}
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary">jaredstock.com</Typography>
        <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }}>{entry.title || 'Untitled'}</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {shareDescription(entry)}
        </Typography>
      </Box>
    </Paper>
  );
}
