import React, { useRef, useState } from 'react';
import { connectStorageEmulator, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { Box, Button, LinearProgress, TextField, Typography } from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUpload';
import { app, usingEmulators } from '../../firebase';
import { isVideoUrl } from '../../data/content';

const storage = getStorage(app);
if (usingEmulators) connectStorageEmulator(storage, '127.0.0.1', 9199);

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const GIF_WARN_BYTES = 4 * 1024 * 1024;

const isPdfUrl = (url = '') => /\.pdf(\?|#|$)/i.test(decodeURIComponent(url));

export function uploadMedia(file, folder, onProgress) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const storageRef = ref(storage, `${folder}/${Date.now()}-${safeName}`);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000, immutable',
  });
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve, reject),
    );
  });
}

// A URL field with an upload button: paste any URL, or upload to Firebase Storage.
const MediaField = ({ label, value, onChange, folder, accept = 'image/*,video/*', helperText }) => {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isPdf = file.type === 'application/pdf';
    const limit = isPdf ? MAX_PDF_BYTES : MAX_BYTES;
    if (file.size > limit) {
      setMessage({ severity: 'error', text: `That file is ${(file.size / 1e6).toFixed(0)} MB. Keep ${isPdf ? 'PDFs' : 'uploads'} under ${limit / 1024 / 1024} MB.` });
      return;
    }
    setMessage(
      file.type === 'image/gif' && file.size > GIF_WARN_BYTES
        ? { severity: 'warning', text: 'Big GIF! An MP4 of the same clip is usually ~10x smaller and plays the same as a looping video block.' }
        : null,
    );
    setProgress(0);
    try {
      const url = await uploadMedia(file, folder, setProgress);
      onChange(url);
    } catch (err) {
      setMessage({ severity: 'error', text: `Upload failed: ${err.message}` });
    } finally {
      setProgress(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          label={label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          fullWidth
          helperText={helperText}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          sx={{ flexShrink: 0, height: 40 }}
        >
          Upload
        </Button>
        <input ref={inputRef} type="file" accept={accept} hidden onChange={handleFile} />
      </Box>
      {progress !== null && <LinearProgress variant="determinate" value={progress * 100} sx={{ mt: 1 }} />}
      {message && (
        <Typography variant="caption" color={message.severity === 'error' ? 'error' : 'warning.main'} sx={{ display: 'block', mt: 0.5 }}>
          {message.text}
        </Typography>
      )}
      {value && (
        <Box sx={{ mt: 1, '& img, & video': { maxHeight: 120, maxWidth: '100%', borderRadius: 1, display: 'block' } }}>
          {isPdfUrl(value) ? (
            <a href={value} target="_blank" rel="noreferrer">Open the current PDF</a>
          ) : isVideoUrl(value) ? (
            <video src={value} muted playsInline preload="metadata" />
          ) : (
            <img src={value} alt="" />
          )}
        </Box>
      )}
    </Box>
  );
};

export default MediaField;
