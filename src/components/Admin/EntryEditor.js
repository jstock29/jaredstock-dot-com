import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDocFromServer, updateDoc } from 'firebase/firestore';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, FormControlLabel, IconButton, Menu, MenuItem, Paper, Snackbar, Switch, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoIcon from '@mui/icons-material/AddPhotoAlternate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotesIcon from '@mui/icons-material/Notes';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { db } from '../../firebase';
import {
  ENTRY_TYPES, RESERVED_PAGE_SLUGS, entrySlug, getEntries, hasPage, readingStats, shareDescription, shareImage, slugify,
} from '../../data/content';
import { BlockRenderer, Media } from '../EntryPage/blocks/Blocks';
import { PostArticle } from '../Blog/PostPage';
import MarkdownField from './MarkdownField';
import MediaField, { uploadMedia } from './MediaField';

const newId = () => Math.random().toString(36).slice(2, 10);

const BLOCK_TYPES = {
  text: { label: 'Text (markdown)', make: () => ({ md: '' }) },
  image: { label: 'Image / GIF', make: () => ({ src: '', alt: '', caption: '', width: 'column' }) },
  video: { label: 'Video (or looping "gif")', make: () => ({ src: '', poster: '', caption: '', width: 'wide', autoplay: true }) },
  gallery: { label: 'Gallery', make: () => ({ items: [], columns: 2, caption: '', width: 'wide' }) },
  embed: { label: 'Embed (YouTube / Vimeo)', make: () => ({ url: '', caption: '', width: 'wide' }) },
  quote: { label: 'Pull quote', make: () => ({ text: '', cite: '' }) },
};

const makeBlock = (type, patch = {}) => ({ id: newId(), type, ...BLOCK_TYPES[type].make(), ...patch });
const mediaBlock = ({ src, video }) => makeBlock(video ? 'video' : 'image', { src });

const WIDTHS = [
  { value: 'column', label: 'Column' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full bleed' },
];

// The "Basics" fields for each content type. Rows of fields sit side by side.
const BASICS = {
  projects: [
    [{ key: 'tagline', label: 'Tagline', help: 'One-liner under the title on the project page and in the orbit' }],
    [{ key: 'text', label: 'Card description', multiline: true, help: 'Shown on the home page card' }],
    [{ key: 'year', label: 'Year' }, { key: 'role', label: 'Role' }],
    [{ key: 'tags', label: 'Tags', kind: 'tags', help: 'Comma separated' }],
    [{ key: 'link', label: 'Live link' }, { key: 'github', label: 'GitHub URL' }],
    [{ key: 'image', label: 'Card image', kind: 'media', accept: 'image/*', help: 'Home page card and the planet in the orbit' }],
  ],
  publications: [
    [{ key: 'text', label: 'Where it was published', help: 'e.g. "Towards Data Science"' }],
    [{ key: 'link', label: 'Article URL', help: 'Leave the story below empty and the card links straight here' }],
    [{ key: 'tagline', label: 'Tagline', help: 'Shown under the title on its page' }],
    [{ key: 'year', label: 'Year' }, { key: 'tags', label: 'Tags', kind: 'tags', help: 'Comma separated' }],
    [{ key: 'image', label: 'Card image', kind: 'media', accept: 'image/*' }],
  ],
  pages: [
    [{ key: 'tagline', label: 'Tagline', help: 'Shown under the title' }],
    [
      { key: 'showInNav', label: 'Show in the home page menu', kind: 'switch' },
      { key: 'navLabel', label: 'Menu label', help: 'Defaults to the title' },
    ],
  ],
  // Title, subtitle and hero sit at the top of a post; these are tucked into "Post settings".
  posts: [
    [{ key: 'publishedAt', label: 'Publish date', kind: 'date', help: 'Set automatically the first time you publish' }],
    [{ key: 'tags', label: 'Tags', kind: 'tags', help: 'Comma separated' }],
    [{
      key: 'blueskyPost',
      label: 'Bluesky post URL',
      help: 'Paste the link to the Bluesky post that shares this, and its replies show under the post',
    }],
  ],
};

const EMPTY_ENTRY = {
  title: '', slug: '', tagline: '', text: '', year: '', role: '', tags: [],
  link: '', github: '', image: '', published: false, showInNav: false, navLabel: '',
  hero: { type: 'image', src: '', poster: '', alt: '', caption: '' },
  blocks: [],
};

const EMPTY_POST = {
  title: '', slug: '', tagline: '', excerpt: '', tags: [], published: false, publishedAt: '',
  shareImage: '', blueskyPost: '',
  hero: { type: 'image', src: '', poster: '', alt: '', caption: '' },
  blocks: [],
};

function Select({ label, value, onChange, options }) {
  return (
    <TextField select label={label} value={value} onChange={(e) => onChange(e.target.value)} size="small" sx={{ minWidth: 140 }}>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
      ))}
    </TextField>
  );
}

function Field(props) {
  return <TextField size="small" fullWidth {...props} value={props.value ?? ''} />;
}

// Big, borderless inputs for a post's title and subtitle, so writing feels like a page.
function WriterField({ size, ...props }) {
  return (
    <TextField
      variant="standard"
      fullWidth
      multiline
      {...props}
      value={props.value ?? ''}
      InputProps={{ disableUnderline: true, sx: { fontSize: size, lineHeight: 1.3, fontWeight: size > 24 ? 700 : 400 } }}
    />
  );
}

const toDateInput = (iso) => (iso ? iso.slice(0, 10) : '');
// Noon UTC keeps the chosen day the same in every US timezone.
const fromDateInput = (value) => (value ? new Date(`${value}T12:00:00Z`).toISOString() : '');

function BasicField({ field, entry, set, folder }) {
  const value = entry[field.key];
  switch (field.kind) {
    case 'tags':
      return (
        <Field
          label={field.label}
          value={(value || []).join(', ')}
          onChange={(e) => set({ [field.key]: e.target.value.split(',') })}
          helperText={field.help}
        />
      );
    case 'media':
      return (
        <MediaField
          label={field.label}
          value={value}
          onChange={(v) => set({ [field.key]: v })}
          folder={folder}
          accept={field.accept}
          helperText={field.help}
        />
      );
    case 'switch':
      return (
        <FormControlLabel
          sx={{ minWidth: 260 }}
          control={<Switch checked={Boolean(value)} onChange={(e) => set({ [field.key]: e.target.checked })} />}
          label={field.label}
        />
      );
    case 'date':
      return (
        <Field
          label={field.label}
          type="date"
          value={toDateInput(value)}
          onChange={(e) => set({ [field.key]: fromDateInput(e.target.value) })}
          helperText={field.help}
          InputLabelProps={{ shrink: true }}
        />
      );
    default:
      return (
        <Field
          label={field.label}
          multiline={field.multiline}
          minRows={field.multiline ? 2 : undefined}
          value={value}
          onChange={(e) => set({ [field.key]: e.target.value })}
          helperText={field.help}
        />
      );
  }
}

// ─── Per-type block forms ──────────────────────────────────────────────────────
function BlockFields({ block, update, folder, onInsertMedia }) {
  switch (block.type) {
    case 'text':
      return <MarkdownField value={block.md} onChange={(md) => update({ md })} folder={folder} onInsertMedia={onInsertMedia} />;
    case 'image':
    case 'video':
      return (
        <>
          <MediaField
            label={block.type === 'video' ? 'Video URL (mp4 / webm)' : 'Image or GIF URL'}
            value={block.src}
            onChange={(src) => update({ src })}
            folder={folder}
            accept={block.type === 'video' ? 'video/*' : 'image/*'}
          />
          {block.type === 'video' && (
            <MediaField label="Poster image (optional)" value={block.poster} onChange={(poster) => update({ poster })} folder={folder} accept="image/*" />
          )}
          <Field label="Alt text" value={block.alt} onChange={(e) => update({ alt: e.target.value })} helperText="Describes the picture for screen readers" />
          <Field label="Caption" value={block.caption} onChange={(e) => update({ caption: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select label="Width" value={block.width || 'column'} onChange={(width) => update({ width })} options={WIDTHS} />
            {block.type === 'video' && (
              <FormControlLabel
                control={<Switch checked={block.autoplay !== false} onChange={(e) => update({ autoplay: e.target.checked })} />}
                label="Loop silently like a gif"
              />
            )}
          </Box>
        </>
      );
    case 'gallery':
      return <GalleryFields block={block} update={update} folder={folder} />;
    case 'embed':
      return (
        <>
          <Field label="YouTube / Vimeo / https URL" value={block.url} onChange={(e) => update({ url: e.target.value })} />
          <Field label="Caption" value={block.caption} onChange={(e) => update({ caption: e.target.value })} />
          <Select label="Width" value={block.width || 'wide'} onChange={(width) => update({ width })} options={WIDTHS} />
        </>
      );
    case 'quote':
      return (
        <>
          <Field label="Quote" multiline minRows={2} value={block.text} onChange={(e) => update({ text: e.target.value })} />
          <Field label="Attribution (optional)" value={block.cite} onChange={(e) => update({ cite: e.target.value })} />
        </>
      );
    default:
      return <Typography color="text.secondary">Unknown block type "{block.type}"</Typography>;
  }
}

function GalleryFields({ block, update, folder }) {
  const items = block.items || [];
  const setItem = (i, patch) => update({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Pick several photos at once; each becomes a gallery item.
  const addFiles = async (files) => {
    setUploading(true);
    try {
      const added = [];
      for (const file of Array.from(files)) added.push({ src: await uploadMedia(file, folder), alt: '', caption: '' });
      update({ items: [...items, ...added] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {items.map((item, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, p: 1.5, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <MediaField label={`Item ${i + 1}`} value={item.src} onChange={(src) => setItem(i, { src })} folder={folder} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <Field label="Alt text" value={item.alt} onChange={(e) => setItem(i, { alt: e.target.value })} />
              <Field label="Caption" value={item.caption} onChange={(e) => setItem(i, { caption: e.target.value })} />
            </Box>
          </Box>
          <IconButton size="small" color="error" aria-label="Remove item" onClick={() => update({ items: items.filter((_, j) => j !== i) })}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" startIcon={<AddPhotoIcon />} disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Add photos'}
        </Button>
        <Button size="small" startIcon={<AddIcon />} onClick={() => update({ items: [...items, { src: '', alt: '', caption: '' }] })}>
          Add by URL
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => {
            const { files } = e.target;
            addFiles(files).finally(() => {
              e.target.value = '';
            });
          }}
        />
      </Box>
      <Field label="Gallery caption" value={block.caption} onChange={(e) => update({ caption: e.target.value })} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Select
          label="Columns"
          value={block.columns || 2}
          onChange={(columns) => update({ columns: Number(columns) })}
          options={[2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
        />
        <Select label="Width" value={block.width || 'wide'} onChange={(width) => update({ width })} options={WIDTHS} />
      </Box>
    </>
  );
}

function AddBlockButton({ onAdd, label = 'Add block', size = 'small', fullWidth = false }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <Button variant="outlined" size={size} fullWidth={fullWidth} startIcon={<AddIcon />} onClick={(e) => setAnchor(e.currentTarget)}>
        {label}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {Object.entries(BLOCK_TYPES).map(([type, def]) => (
          <MenuItem
            key={type}
            onClick={() => {
              onAdd(makeBlock(type));
              setAnchor(null);
            }}
          >
            {def.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// Roughly what Bluesky, iMessage and Slack show for a shared link.
function ShareCardPreview({ entry }) {
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

function Section({ title, summary, defaultExpanded = true, children }) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters variant="outlined" sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { minWidth: 0 } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
          {summary && (
            <Typography variant="body2" color="text.secondary" noWrap>{summary}</Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

const publicPath = (type, slug) => `${ENTRY_TYPES[type].basePath}/${slug}`;
const AUTOSAVE_MS = 2500;
const timeLabel = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// ─── Editor ────────────────────────────────────────────────────────────────────
export default function EntryEditor() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const config = ENTRY_TYPES[type];
  const isPost = type === 'posts';
  const [entry, setEntry] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [snack, setSnack] = useState(null);
  const [view, setView] = useState('write');
  // While typing on a phone the keyboard takes half the screen; hide the add bar then.
  const [typing, setTyping] = useState(false);
  // Bumped on every edit, so a save that finishes after more typing doesn't mark it clean.
  const revision = useRef(0);
  // A new entry that autosave just created: don't reload it over what's being typed.
  const createdId = useRef(null);
  const saveRef = useRef(null);
  const photoRef = useRef(null);

  useEffect(() => {
    if (!config) return;
    if (isNew) {
      setEntry(isPost ? EMPTY_POST : EMPTY_ENTRY);
      setSlugTouched(false);
      return;
    }
    if (id === createdId.current) return;
    getDocFromServer(doc(db, type, id))
      .then((snap) => {
        if (!snap.exists()) throw new Error(`That ${config.singular} doesn't exist.`);
        const data = snap.data();
        const empty = isPost ? EMPTY_POST : EMPTY_ENTRY;
        setEntry({
          ...empty,
          ...data,
          // Older docs have no slug or published flag yet.
          slug: entrySlug(data),
          published: data.published !== false,
          tags: data.tags || [],
          hero: { ...empty.hero, ...(data.hero || {}) },
          blocks: (data.blocks || []).map((b) => ({ id: b.id || newId(), ...b })),
        });
        setSlugTouched(true);
      })
      .catch((err) => setSnack({ severity: 'error', message: err.message }));
  }, [type, id, isNew, isPost, config]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Drafts save themselves a moment after you stop typing. Published entries only change
  // when you press Save, so a half-finished edit never goes live by accident.
  const canAutosave = Boolean(entry && !entry.published && entry.title.trim());
  useEffect(() => {
    if (!dirty || saving || !canAutosave) return;
    const t = setTimeout(() => saveRef.current?.({ quiet: true }), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [entry, dirty, saving, canAutosave]);

  // Cmd/Ctrl+S saves.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const folder = useMemo(() => `${type}/${entry?.slug || 'untitled'}`, [type, entry?.slug]);
  const stats = useMemo(() => readingStats(entry?.blocks), [entry?.blocks]);

  if (!config) {
    return <Alert severity="error" sx={{ m: 4 }}>Unknown content type "{type}".</Alert>;
  }

  if (!entry) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        {snack ? <Alert severity="error">{snack.message}</Alert> : <CircularProgress />}
      </Box>
    );
  }

  const set = (patch) => {
    revision.current += 1;
    setEntry((p) => ({ ...p, ...patch }));
    setDirty(true);
  };
  const setTitle = (e) => {
    const title = e.target.value;
    set(slugTouched ? { title } : { title, slug: slugify(title) });
  };
  const setHero = (patch) => set({ hero: { ...entry.hero, ...patch } });

  const blocks = entry.blocks;
  const updateBlock = (i, patch) => set({ blocks: blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const moveBlock = (i, dir) => {
    const next = [...blocks];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set({ blocks: next });
  };
  const removeBlock = (i) => set({ blocks: blocks.filter((_, j) => j !== i) });
  const insertBlocks = (i, added) => set({ blocks: [...blocks.slice(0, i), ...added, ...blocks.slice(i)] });

  // Media dropped or pasted into text block i at character `at`: the text splits there,
  // with the new image (or video) blocks in between.
  const splitWithMedia = (i, at, uploaded) => {
    const md = blocks[i].md || '';
    const before = md.slice(0, at).replace(/\s+$/, '');
    const after = md.slice(at).replace(/^\s+/, '');
    const media = uploaded.map(mediaBlock);
    const replaced = [
      ...(before ? [{ ...blocks[i], md: before }] : []),
      ...media,
      ...(after || !before ? [makeBlock('text', { md: after })] : []),
    ];
    set({ blocks: [...blocks.slice(0, i), ...replaced, ...blocks.slice(i + 1)] });
  };

  const addPhotos = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setSnack({ severity: 'info', message: `Uploading ${list.length === 1 ? 'photo' : `${list.length} photos`}…` });
    try {
      const uploaded = [];
      for (const file of list) uploaded.push({ src: await uploadMedia(file, folder), video: file.type.startsWith('video/') });
      insertBlocks(blocks.length, uploaded.map(mediaBlock));
      setSnack(null);
    } catch (err) {
      setSnack({ severity: 'error', message: `Upload failed: ${err.message}` });
    }
  };

  const save = async ({ quiet = false } = {}) => {
    if (saving) return;
    const title = entry.title.trim();
    const slug = slugify(entry.slug || title);
    const fail = (message) => !quiet && setSnack({ severity: 'error', message });
    if (!title) return fail('A title is required.');
    if (!slug) return fail('A slug is required.');
    if (type === 'pages' && RESERVED_PAGE_SLUGS.includes(slug)) {
      return fail(`"${slug}" is already a section of the site. Pick another slug.`);
    }

    const startedAt = revision.current;
    setSaving(true);
    try {
      const others = await getEntries(type, { includeDrafts: true, fresh: true });
      const editingId = createdId.current && isNew ? createdId.current : id;
      const clash = others.find((p) => p.id !== editingId && entrySlug(p) === slug);
      if (clash) throw new Error(`"${clash.title}" already uses the slug "${slug}".`);

      const data = {
        ...entry,
        title,
        slug,
        tags: (entry.tags || []).map((t) => t.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };
      delete data.id;
      const firstPublish = isPost && data.published && !data.publishedAt;
      if (firstPublish) data.publishedAt = data.updatedAt;

      let savedId = editingId;
      if (savedId === 'new') {
        // New entries go to the end of the list; reorder them from the list view.
        if (!isPost) data.order = others.reduce((max, p) => Math.max(max, Number(p.order) || 0), 0) + 1;
        const created = await addDoc(collection(db, type), data);
        savedId = created.id;
        createdId.current = savedId;
      } else {
        await updateDoc(doc(db, type, savedId), data);
      }

      // Read it back from the server so "Saved" means the site really has it.
      const check = await getDocFromServer(doc(db, type, savedId));
      if (!check.exists() || check.data().updatedAt !== data.updatedAt) {
        throw new Error("the database didn't confirm the change. Try again.");
      }

      if (revision.current === startedAt) setDirty(false);
      setEntry((p) => ({ ...p, slug, ...(firstPublish ? { publishedAt: data.publishedAt } : {}) }));
      setSavedAt(new Date());
      getEntries(type, { fresh: true }); // refresh the public-site cache
      if (!quiet) {
        const live = data.published && hasPage(type, data);
        setSnack({
          severity: 'success',
          message: !live
            ? 'Saved as a draft.'
            : isPost
              ? "Saved. It's on the site now; link previews catch up within about 15 minutes."
              : "Saved. It's on the site now.",
        });
      }
      if (savedId !== id) navigate(`/admin/${type}/${savedId}`, { replace: true });
    } catch (err) {
      setSnack({ severity: 'error', message: `${quiet ? 'Autosave' : 'Save'} failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };
  saveRef.current = save;

  const pagePath = publicPath(type, entry.slug || '…');
  const status = saving
    ? 'Saving…'
    : dirty
      ? canAutosave ? 'Unsaved changes' : 'Unsaved changes, press Save'
      : savedAt
        ? `Saved ${timeLabel(savedAt)}`
        : '';

  const heroFields = (
    <>
      <Select
        label="Hero type"
        value={entry.hero.type}
        onChange={(heroType) => setHero({ type: heroType })}
        options={[{ value: 'image', label: 'Image / GIF' }, { value: 'video', label: 'Looping video' }]}
      />
      <MediaField
        label="Hero media"
        value={entry.hero.src}
        onChange={(src) => setHero({ src })}
        folder={folder}
        accept={entry.hero.type === 'video' ? 'video/*' : 'image/*'}
        helperText={
          isPost
            ? 'The big picture at the top, and the image in link previews. Wide (about 1200×630 or larger) works best.'
            : type === 'pages' ? 'Optional big picture at the top' : 'Falls back to the card image when empty'
        }
      />
      {entry.hero.type === 'video' && (
        <MediaField label="Hero poster" value={entry.hero.poster} onChange={(poster) => setHero({ poster })} folder={folder} accept="image/*" />
      )}
      <Field label="Hero alt text" value={entry.hero.alt} onChange={(e) => setHero({ alt: e.target.value })} />
      {isPost && <Field label="Hero caption" value={entry.hero.caption} onChange={(e) => setHero({ caption: e.target.value })} />}
    </>
  );

  const basicsRows = BASICS[type].map((row, i) => (
    <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
      {row.map((field) => (
        <BasicField key={field.key} field={field} entry={entry} set={set} folder={folder} />
      ))}
    </Box>
  ));

  const slugField = (
    <Field
      label="Slug"
      value={entry.slug}
      onChange={(e) => {
        setSlugTouched(true);
        set({ slug: e.target.value });
      }}
      onBlur={() => set({ slug: slugify(entry.slug) })}
      helperText={`jaredstock.com${pagePath}`}
    />
  );

  return (
    <Container
      maxWidth="md"
      sx={{ mt: { xs: 0, sm: 2 }, mb: { xs: 14, sm: 12 }, px: { xs: 1.5, sm: 3 } }}
      onFocusCapture={(e) => setTyping(e.target.matches('textarea, input:not([type=checkbox]):not([type=file])'))}
      onBlurCapture={() => setTyping(false)}
    >
      {/* Sticky top bar: always reachable while scrolling a long post, on a phone too. */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 5, py: 1, mb: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid', borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title={`Back to ${config.label}`}>
            <IconButton component={RouterLink} to={`/admin?tab=${type}`} aria-label={`Back to ${config.label}`} edge="start">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {isNew && !entry.title ? `New ${config.singular}` : entry.title || 'Untitled'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div" aria-live="polite">
              {[isPost && `${stats.words.toLocaleString()} words · ${stats.minutes} min read`, status].filter(Boolean).join(' · ') || ' '}
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => save()} disabled={saving || (!dirty && !isNew)}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="Editor view">
            <ToggleButton value="write" sx={{ px: 1.5 }}>
              <NotesIcon fontSize="small" sx={{ mr: 0.5 }} /> Write
            </ToggleButton>
            <ToggleButton value="preview" sx={{ px: 1.5 }}>
              <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} /> Preview
            </ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            sx={{ ml: 0.5 }}
            control={<Switch checked={entry.published} onChange={(e) => set({ published: e.target.checked })} />}
            label={entry.published ? 'Published' : 'Draft'}
          />
          <Box sx={{ flex: 1 }} />
          {!isNew && hasPage(type, entry) && (
            <Tooltip title={dirty ? 'Save first to see your latest changes' : 'Opens it on the site in a new tab; drafts are visible to you only'}>
              <Button size="small" component="a" href={`${pagePath}?preview=1`} target="_blank" rel="noreferrer">
                Open on site
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {view === 'preview' ? (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', py: 2 }}>
          {isPost ? (
            <div className="blog-preview">
              <PostArticle post={{ ...entry, publishedAt: entry.publishedAt || new Date().toISOString() }} />
            </div>
          ) : (
            <div className="project-page">
              {(entry.hero.src || entry.image) && (
                <figure className="project-page-hero block-width-wide">
                  <Media
                    src={entry.hero.src || entry.image}
                    alt={entry.hero.alt || entry.title}
                    poster={entry.hero.poster}
                    video={entry.hero.type === 'video'}
                  />
                </figure>
              )}
              <article className="project-page-body">
                <BlockRenderer blocks={blocks} reveal={false} />
              </article>
            </div>
          )}
        </Paper>
      ) : (
        <>
          {isPost ? (
            <>
              <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <WriterField size={30} placeholder="Title" value={entry.title} onChange={setTitle} inputProps={{ 'aria-label': 'Title' }} />
                <WriterField
                  size={19}
                  placeholder="Subtitle (optional)"
                  value={entry.tagline}
                  onChange={(e) => set({ tagline: e.target.value })}
                  inputProps={{ 'aria-label': 'Subtitle' }}
                />
              </Box>
              <Section title="Hero image" summary={entry.hero.src ? undefined : 'None yet'} defaultExpanded={isNew || !entry.hero.src}>
                {heroFields}
              </Section>
            </>
          ) : (
            <>
              <Typography variant="overline" color="text.secondary">Basics</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                <Field label="Title" required value={entry.title} onChange={setTitle} />
                {slugField}
                {basicsRows}
              </Box>

              <Typography variant="overline" color="text.secondary">Hero</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>{heroFields}</Box>
            </>
          )}

          <Typography variant="overline" color="text.secondary">
            {type === 'pages' ? 'Content' : isPost ? 'Post' : 'Story'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            {blocks.length === 0 && (
              <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
                <Typography color="text.secondary">
                  {type === 'publications'
                    ? 'No blocks yet, so the card links straight to the article. Add blocks to give it its own page.'
                    : 'Nothing written yet.'}
                </Typography>
                {isPost && (
                  <Button variant="contained" startIcon={<NotesIcon />} onClick={() => insertBlocks(0, [makeBlock('text')])}>
                    Start writing
                  </Button>
                )}
              </Box>
            )}
            {blocks.map((block, i) => (
              <Card key={block.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: -1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {BLOCK_TYPES[block.type]?.label || block.type}
                    </Typography>
                    <Tooltip title="Move up">
                      <span>
                        <IconButton size="small" aria-label="Move up" disabled={i === 0} onClick={() => moveBlock(i, -1)}>
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton size="small" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => moveBlock(i, 1)}>
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Delete block">
                      <IconButton size="small" aria-label="Delete block" color="error" onClick={() => removeBlock(i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <BlockFields
                    block={block}
                    update={(patch) => updateBlock(i, patch)}
                    folder={folder}
                    onInsertMedia={(at, uploaded) => splitWithMedia(i, at, uploaded)}
                  />
                  <Box>
                    <AddBlockButton label="Insert below" onAdd={(b) => insertBlocks(i + 1, [b])} />
                  </Box>
                </CardContent>
              </Card>
            ))}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
              <AddBlockButton onAdd={(b) => insertBlocks(blocks.length, [b])} />
              <Button size="small" startIcon={<AddPhotoIcon />} onClick={() => photoRef.current?.click()}>
                Add photos
              </Button>
            </Box>
          </Box>

          {isPost && (
            <>
              <Section title="Post settings" summary={`jaredstock.com${pagePath}`} defaultExpanded={false}>
                {slugField}
                {basicsRows}
              </Section>
              <Section title="Link preview" summary="How it looks when shared on Bluesky, iMessage, Slack…" defaultExpanded={false}>
                <ShareCardPreview entry={entry} />
                <Field
                  label="Share description"
                  multiline
                  minRows={2}
                  value={entry.excerpt}
                  onChange={(e) => set({ excerpt: e.target.value })}
                  helperText={`${(entry.excerpt || '').length}/200. Shown in link previews and the blog list. Empty uses the subtitle, then the opening lines.`}
                />
                <MediaField
                  label="Share image (optional)"
                  value={entry.shareImage}
                  onChange={(v) => set({ shareImage: v })}
                  folder={folder}
                  accept="image/*"
                  helperText="Only if the preview should use a different picture than the hero. 1200×630 is ideal."
                />
              </Section>
            </>
          )}
        </>
      )}

      <input
        ref={photoRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          const { files } = e.target;
          addPhotos(files).finally(() => {
            e.target.value = '';
          });
        }}
      />

      {/* Phone: the two things you add most, always under your thumb. */}
      {view === 'write' && !typing && (
        <Paper
          elevation={8}
          sx={{
            display: { xs: 'flex', sm: 'none' }, position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 6,
            gap: 1, px: 1.5, pt: 1, pb: 'calc(8px + env(safe-area-inset-bottom))', borderRadius: 0,
          }}
        >
          <Button fullWidth size="medium" variant="outlined" startIcon={<NotesIcon />} onClick={() => insertBlocks(blocks.length, [makeBlock('text')])}>
            Text
          </Button>
          <Button fullWidth size="medium" variant="outlined" startIcon={<AddPhotoIcon />} onClick={() => photoRef.current?.click()}>
            Photos
          </Button>
          <AddBlockButton fullWidth size="medium" label="More" onAdd={(b) => insertBlocks(blocks.length, [b])} />
        </Paper>
      )}

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={snack?.severity === 'info' ? null : 6000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }} onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
