import React, { useRef, useState } from 'react';
import { Box, IconButton, LinearProgress, TextField, Tooltip, Typography } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import TitleIcon from '@mui/icons-material/Title';
import { uploadMedia } from './MediaField';

// Wraps the selection (or inserts `before…after` at the cursor) and keeps the selection
// on the wrapped text, like a word processor's bold button.
function wrap(el, value, before, after = before, placeholder = '') {
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  return { next, select: [start + before.length, start + before.length + selected.length] };
}

// Prefixes every line touched by the selection, e.g. "## " or "- ".
function prefixLines(el, value, prefix) {
  const start = value.lastIndexOf('\n', (el.selectionStart ?? 0) - 1) + 1;
  const endIdx = value.indexOf('\n', el.selectionEnd ?? value.length);
  const end = endIdx === -1 ? value.length : endIdx;
  const lines = value.slice(start, end).split('\n').map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : prefix + l));
  const block = lines.join('\n');
  return { next: value.slice(0, start) + block + value.slice(end), select: [start, start + block.length] };
}

const imageFiles = (list) => Array.from(list || []).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));

// The writing surface for a text block: a roomy textarea with a formatting bar. Pasting,
// dropping or picking an image uploads it and splits the text around it at the cursor,
// so a photo lands exactly where you were typing as its own image block.
export default function MarkdownField({ value = '', onChange, folder, onInsertMedia, autoFocus }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const apply = ({ next, select }) => {
    onChange(next);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(...select);
    });
  };

  const tools = [
    { label: 'Bold', icon: <FormatBoldIcon />, run: (el) => wrap(el, value, '**', '**', 'bold') },
    { label: 'Italic', icon: <FormatItalicIcon />, run: (el) => wrap(el, value, '_', '_', 'italic') },
    { label: 'Heading', icon: <TitleIcon />, run: (el) => prefixLines(el, value, '## ') },
    { label: 'Link', icon: <LinkIcon />, run: (el) => wrap(el, value, '[', '](https://)', 'link text') },
    { label: 'Quote', icon: <FormatQuoteIcon />, run: (el) => prefixLines(el, value, '> ') },
    { label: 'List', icon: <FormatListBulletedIcon />, run: (el) => prefixLines(el, value, '- ') },
  ];

  const upload = async (files) => {
    const media = imageFiles(files);
    if (!media.length || !onInsertMedia) return false;
    const at = ref.current?.selectionStart ?? value.length;
    setError(null);
    try {
      const uploaded = [];
      for (const [i, file] of media.entries()) {
        setProgress((i + 0.01) / media.length);
        const src = await uploadMedia(file, folder, (p) => setProgress((i + p) / media.length));
        uploaded.push({ src, video: file.type.startsWith('video/') });
      }
      onInsertMedia(at, uploaded);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setProgress(null);
    }
    return true;
  };

  const onKeyDown = (e) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const tool = { b: tools[0], i: tools[1], k: tools[3] }[e.key.toLowerCase()];
    if (tool) {
      e.preventDefault();
      apply(tool.run(e.target));
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
        if (imageFiles(e.dataTransfer.files).length) {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }
      }}
      sx={{
        borderRadius: 1,
        outline: dragging ? '2px dashed' : 'none',
        outlineColor: 'primary.main',
        outlineOffset: 4,
      }}
    >
      <Box
        role="toolbar"
        aria-label="Formatting"
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mb: 0.5, color: 'text.secondary' }}
      >
        {tools.map((t) => (
          <Tooltip key={t.label} title={t.label}>
            <IconButton
              size="small"
              aria-label={t.label}
              onMouseDown={(e) => e.preventDefault()} // keep the textarea's selection
              onClick={() => ref.current && apply(t.run(ref.current))}
            >
              {t.icon}
            </IconButton>
          </Tooltip>
        ))}
        {onInsertMedia && (
          <Tooltip title="Insert images or video at the cursor">
            <IconButton
              size="small"
              aria-label="Insert images or video"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              disabled={progress !== null}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => {
            const files = e.target.files;
            upload(files).finally(() => {
              e.target.value = '';
            });
          }}
        />
      </Box>
      <TextField
        inputRef={ref}
        multiline
        minRows={6}
        fullWidth
        autoFocus={autoFocus}
        value={value}
        placeholder="Write…"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={(e) => {
          if (imageFiles(e.clipboardData?.files).length) {
            e.preventDefault();
            upload(e.clipboardData.files);
          }
        }}
        inputProps={{ 'aria-label': 'Text (markdown)', spellCheck: true, autoCapitalize: 'sentences' }}
        sx={{
          // 16px+ keeps iOS from zooming in on focus; a reading-sized font makes long drafts bearable.
          '& textarea': { fontSize: 17, lineHeight: 1.65 },
        }}
      />
      {progress !== null && <LinearProgress variant="determinate" value={progress * 100} sx={{ mt: 1 }} />}
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
