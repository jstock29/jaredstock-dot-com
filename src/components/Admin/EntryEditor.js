import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDocFromServer, updateDoc } from 'firebase/firestore';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Container, Divider, FormControlLabel,
  IconButton, Menu, MenuItem, Snackbar, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { db } from '../../firebase';
import { ENTRY_TYPES, RESERVED_PAGE_SLUGS, entrySlug, getEntries, hasPage, slugify } from '../../data/content';
import MediaField from './MediaField';

const newId = () => Math.random().toString(36).slice(2, 10);

const BLOCK_TYPES = {
  text: { label: 'Text (markdown)', make: () => ({ md: '' }) },
  image: { label: 'Image / GIF', make: () => ({ src: '', alt: '', caption: '', width: 'column' }) },
  video: { label: 'Video (or looping "gif")', make: () => ({ src: '', poster: '', caption: '', width: 'wide', autoplay: true }) },
  gallery: { label: 'Gallery', make: () => ({ items: [], columns: 2, caption: '', width: 'wide' }) },
  embed: { label: 'Embed (YouTube / Vimeo)', make: () => ({ url: '', caption: '', width: 'wide' }) },
  quote: { label: 'Pull quote', make: () => ({ text: '', cite: '' }) },
};

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
};

const EMPTY_ENTRY = {
  title: '', slug: '', tagline: '', text: '', year: '', role: '', tags: [],
  link: '', github: '', image: '', published: false, showInNav: false, navLabel: '',
  hero: { type: 'image', src: '', poster: '', alt: '' },
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
function BlockFields({ block, update, folder }) {
  switch (block.type) {
    case 'text':
      return (
        <Field
          label="Markdown"
          multiline
          minRows={6}
          value={block.md}
          onChange={(e) => update({ md: e.target.value })}
          helperText="## headings, **bold**, [links](https://…), - lists, `code`"
          sx={{ '& textarea': { fontFamily: 'monospace' } }}
        />
      );
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
          <Field label="Alt text" value={block.alt} onChange={(e) => update({ alt: e.target.value })} />
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
    case 'gallery': {
      const items = block.items || [];
      const setItem = (i, patch) => update({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
      return (
        <>
          {items.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, p: 1.5, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MediaField label={`Item ${i + 1}`} value={item.src} onChange={(src) => setItem(i, { src })} folder={folder} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Field label="Alt text" value={item.alt} onChange={(e) => setItem(i, { alt: e.target.value })} />
                  <Field label="Caption" value={item.caption} onChange={(e) => setItem(i, { caption: e.target.value })} />
                </Box>
              </Box>
              <IconButton size="small" color="error" aria-label="Remove item" onClick={() => update({ items: items.filter((_, j) => j !== i) })}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Box>
            <Button size="small" startIcon={<AddIcon />} onClick={() => update({ items: [...items, { src: '', alt: '', caption: '' }] })}>
              Add item
            </Button>
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

function AddBlockButton({ onAdd, label = 'Add block' }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={(e) => setAnchor(e.currentTarget)}>
        {label}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {Object.entries(BLOCK_TYPES).map(([type, def]) => (
          <MenuItem
            key={type}
            onClick={() => {
              onAdd({ id: newId(), type, ...def.make() });
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

const publicPath = (type, slug) => `${ENTRY_TYPES[type].basePath}/${slug}`;

// ─── Editor ────────────────────────────────────────────────────────────────────
export default function EntryEditor() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const config = ENTRY_TYPES[type];
  const [entry, setEntry] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [snack, setSnack] = useState(null);

  useEffect(() => {
    if (!config) return;
    if (isNew) {
      setEntry(EMPTY_ENTRY);
      setSlugTouched(false);
      return;
    }
    getDocFromServer(doc(db, type, id))
      .then((snap) => {
        if (!snap.exists()) throw new Error(`That ${config.singular} doesn't exist.`);
        const data = snap.data();
        setEntry({
          ...EMPTY_ENTRY,
          ...data,
          // Older docs have no slug or published flag yet.
          slug: entrySlug(data),
          published: data.published !== false,
          tags: data.tags || [],
          hero: { ...EMPTY_ENTRY.hero, ...(data.hero || {}) },
          blocks: (data.blocks || []).map((b) => ({ id: b.id || newId(), ...b })),
        });
        setSlugTouched(true);
      })
      .catch((err) => setSnack({ severity: 'error', message: err.message }));
  }, [type, id, isNew, config]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const folder = useMemo(() => `${type}/${entry?.slug || 'untitled'}`, [type, entry?.slug]);

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
  const insertBlock = (i, block) => set({ blocks: [...blocks.slice(0, i), block, ...blocks.slice(i)] });

  const handleSave = async () => {
    const title = entry.title.trim();
    const slug = slugify(entry.slug || title);
    if (!title) return setSnack({ severity: 'error', message: 'A title is required.' });
    if (!slug) return setSnack({ severity: 'error', message: 'A slug is required.' });
    if (type === 'pages' && RESERVED_PAGE_SLUGS.includes(slug)) {
      return setSnack({ severity: 'error', message: `"${slug}" is already a section of the site. Pick another slug.` });
    }

    setSaving(true);
    try {
      const others = await getEntries(type, { includeDrafts: true, fresh: true });
      const clash = others.find((p) => p.id !== id && entrySlug(p) === slug);
      if (clash) throw new Error(`"${clash.title}" already uses the slug "${slug}".`);

      const data = {
        ...entry,
        title,
        slug,
        tags: (entry.tags || []).map((t) => t.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };
      delete data.id;

      let savedId = id;
      if (isNew) {
        // New entries go to the end of the list; reorder them from the list view.
        data.order = others.reduce((max, p) => Math.max(max, Number(p.order) || 0), 0) + 1;
        const created = await addDoc(collection(db, type), data);
        savedId = created.id;
      } else {
        await updateDoc(doc(db, type, id), data);
      }

      // Read it back from the server so "Saved" means the site really has it.
      const check = await getDocFromServer(doc(db, type, savedId));
      if (!check.exists() || check.data().updatedAt !== data.updatedAt) {
        throw new Error("the database didn't confirm the change. Try again.");
      }

      setDirty(false);
      setEntry((p) => ({ ...p, slug }));
      getEntries(type, { fresh: true }); // refresh the public-site cache
      const live = data.published && hasPage(type, data);
      setSnack({ severity: 'success', message: live ? "Saved. It's on the site now." : 'Saved as a draft.' });
      if (isNew) navigate(`/admin/${type}/${savedId}`, { replace: true });
    } catch (err) {
      setSnack({ severity: 'error', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const pagePath = publicPath(type, entry.slug || '…');

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Button component={RouterLink} to={`/admin?tab=${type}`} startIcon={<ArrowBackIcon />} color="inherit">
          {config.label}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          {isNew ? `New ${config.singular}` : entry.title || 'Untitled'}
        </Typography>
        <FormControlLabel
          control={<Switch checked={entry.published} onChange={(e) => set({ published: e.target.checked })} />}
          label={entry.published ? 'Published' : 'Draft'}
        />
        {!isNew && hasPage(type, entry) && (
          <Tooltip title={dirty ? 'Save first to preview your latest changes' : 'Opens in a new tab; drafts are visible to you only'}>
            <Button component="a" href={`${pagePath}?preview=1`} target="_blank" rel="noreferrer" startIcon={<VisibilityIcon />}>
              Preview
            </Button>
          </Tooltip>
        )}
        <Button variant="contained" onClick={handleSave} disabled={saving || (!dirty && !isNew)}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Typography variant="overline" color="text.secondary">Basics</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        <Field label="Title" required value={entry.title} onChange={setTitle} />
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
        {BASICS[type].map((row, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {row.map((field) => (
              <BasicField key={field.key} field={field} entry={entry} set={set} folder={folder} />
            ))}
          </Box>
        ))}
      </Box>

      <Typography variant="overline" color="text.secondary">Hero</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
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
          helperText={type === 'pages' ? 'Optional big picture at the top' : 'Falls back to the card image when empty'}
        />
        {entry.hero.type === 'video' && (
          <MediaField label="Hero poster" value={entry.hero.poster} onChange={(poster) => setHero({ poster })} folder={folder} accept="image/*" />
        )}
        <Field label="Hero alt text" value={entry.hero.alt} onChange={(e) => setHero({ alt: e.target.value })} />
      </Box>

      <Typography variant="overline" color="text.secondary">
        {type === 'pages' ? 'Content' : 'Story'}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {blocks.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            {type === 'publications'
              ? 'No blocks yet, so the card links straight to the article. Add blocks to give it its own page.'
              : 'No blocks yet. Add some text, images, GIFs, videos or embeds.'}
          </Typography>
        )}
        {blocks.map((block, i) => (
          <Card key={block.id} variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700 }}>
                  {i + 1}. {BLOCK_TYPES[block.type]?.label || block.type}
                </Typography>
                <Tooltip title="Move up">
                  <span>
                    <IconButton size="small" disabled={i === 0} onClick={() => moveBlock(i, -1)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton size="small" disabled={i === blocks.length - 1} onClick={() => moveBlock(i, 1)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Delete block">
                  <IconButton size="small" color="error" onClick={() => removeBlock(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <BlockFields block={block} update={(patch) => updateBlock(i, patch)} folder={folder} />
              <Box>
                <AddBlockButton label="Insert below" onAdd={(b) => insertBlock(i + 1, b)} />
              </Box>
            </CardContent>
          </Card>
        ))}
        <Box>
          <AddBlockButton onAdd={(b) => insertBlock(blocks.length, b)} />
        </Box>
      </Box>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
