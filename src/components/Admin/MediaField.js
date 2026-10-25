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

const MAX_EDGE = 2400;
const RECOMPRESS_BYTES = 1.5 * 1024 * 1024;

// Phone photos are often 4000px+ and several MB. Scale big photos down to 2400px on the
// long edge and re-encode as JPEG, which looks the same on the site and loads far faster.
// GIFs, SVGs, PNGs with transparency, small files and anything the browser can't decode
// are uploaded untouched.
export async function prepareImage(file) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < RECOMPRESS_BYTES) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  if (file.type === 'image/png') {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return file;
  }
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

export async function uploadMedia(original, folder, onProgress) {
  const file = await prepareImage(original);
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

  const [dragging, setDragging] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (e.target.value) e.target.value = '';
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
    <Box
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        setDragging(false);
        if (e.dataTransfer.files?.length) {
          e.preventDefault();
          handleFile({ target: { files: e.dataTransfer.files } });
        }
      }}
      sx={{ borderRadius: 1, outline: dragging ? '2px dashed' : 'none', outlineColor: 'primary.main', outlineOffset: 4 }}
    >
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
