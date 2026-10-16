import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
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
import { getProjects, slugify } from '../../data/projects';
import AdminGate from './AdminGate';
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

const EMPTY_PROJECT = {
  title: '', slug: '', tagline: '', text: '', year: '', role: '', tags: [],
  link: '', github: '', image: '', order: 0, published: false,
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
            label={block.type === 'video' ? 'Video URL (mp4 / webm)' : 'Image URL'}
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
              <IconButton size="small" color="error" onClick={() => update({ items: items.filter((_, j) => j !== i) })}>
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

// ─── Editor ────────────────────────────────────────────────────────────────────
function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [project, setProject] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [snack, setSnack] = useState(null);

  useEffect(() => {
    if (isNew) {
      setProject(EMPTY_PROJECT);
      return;
    }
    getDoc(doc(db, 'projects', id))
      .then((snap) => {
        if (!snap.exists()) throw new Error('Project not found');
        const data = snap.data();
        setProject({
          ...EMPTY_PROJECT,
          ...data,
          // Older docs have no slug or published flag yet.
          slug: data.slug || slugify(data.title),
          published: data.published !== false,
          hero: { ...EMPTY_PROJECT.hero, ...(data.hero || {}) },
          blocks: (data.blocks || []).map((b) => ({ id: b.id || newId(), ...b })),
        });
        setSlugTouched(true);
      })
      .catch((err) => setSnack({ severity: 'error', message: err.message }));
  }, [id, isNew]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const folder = useMemo(() => `projects/${project?.slug || 'untitled'}`, [project?.slug]);

  if (!project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        {snack ? <Alert severity="error">{snack.message}</Alert> : <CircularProgress />}
      </Box>
    );
  }

  const set = (patch) => {
    setProject((p) => ({ ...p, ...patch }));
    setDirty(true);
  };
  const setField = (key) => (e) => {
    const value = e.target.value;
    if (key === 'title' && !slugTouched) set({ title: value, slug: slugify(value) });
    else set({ [key]: value });
  };
  const setHero = (patch) => set({ hero: { ...project.hero, ...patch } });

  const blocks = project.blocks;
  const updateBlock = (i, patch) => set({ blocks: blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const moveBlock = (i, dir) => {
    const next = [...blocks];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set({ blocks: next });
  };
  const removeBlock = (i) => set({ blocks: blocks.filter((_, j) => j !== i) });
  const insertBlock = (i, block) => set({ blocks: [...blocks.slice(0, i), block, ...blocks.slice(i)] });

  const handleSave = async () => {
    const title = project.title.trim();
    const slug = slugify(project.slug || title);
    if (!title) return setSnack({ severity: 'error', message: 'A title is required.' });
    if (!slug) return setSnack({ severity: 'error', message: 'A slug is required.' });

    setSaving(true);
    try {
      const others = await getProjects({ includeDrafts: true, fresh: true });
      const clash = others.find((p) => p.id !== id && (p.slug || slugify(p.title)) === slug);
      if (clash) throw new Error(`"${clash.title}" already uses the slug "${slug}".`);

      const data = {
        ...project,
        title,
        slug,
        order: Number(project.order) || 0,
        tags: project.tags.map((t) => t.trim()).filter(Boolean),
      };
      delete data.id;

      if (isNew) {
        const created = await addDoc(collection(db, 'projects'), data);
        setDirty(false);
        navigate(`/admin/projects/${created.id}`, { replace: true });
      } else {
        await updateDoc(doc(db, 'projects', id), data);
        setProject((p) => ({ ...p, slug }));
        setDirty(false);
      }
      getProjects({ fresh: true }); // refresh the public-site cache
      setSnack({ severity: 'success', message: 'Saved.' });
    } catch (err) {
      setSnack({ severity: 'error', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Button component={RouterLink} to="/admin" startIcon={<ArrowBackIcon />} color="inherit">
          Admin
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          {isNew ? 'New project' : project.title || 'Untitled'}
        </Typography>
        <FormControlLabel
          control={<Switch checked={project.published} onChange={(e) => set({ published: e.target.checked })} />}
          label={project.published ? 'Published' : 'Draft'}
        />
        {!isNew && (
          <Tooltip title={dirty ? 'Save first to preview your latest changes' : 'Opens in a new tab; drafts are visible to you only'}>
            <Button
              component="a"
              href={`/projects/${project.slug}?preview=1`}
              target="_blank"
              rel="noreferrer"
              startIcon={<VisibilityIcon />}
            >
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
        <Field label="Title" required value={project.title} onChange={setField('title')} />
        <Field
          label="Slug"
          value={project.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set({ slug: e.target.value });
          }}
          onBlur={() => set({ slug: slugify(project.slug) })}
          helperText={`jaredstock.com/projects/${project.slug || '…'}`}
        />
        <Field label="Tagline" value={project.tagline} onChange={setField('tagline')} helperText="One-liner under the title on the project page and in the orbit" />
        <Field label="Card description" multiline minRows={2} value={project.text} onChange={setField('text')} helperText="Shown on the home page card" />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Field label="Year" value={project.year} onChange={setField('year')} />
          <Field label="Role" value={project.role} onChange={setField('role')} />
          <Field label="Order" type="number" value={project.order} onChange={setField('order')} />
        </Box>
        <Field
          label="Tags"
          value={project.tags.join(', ')}
          onChange={(e) => set({ tags: e.target.value.split(',') })}
          helperText="Comma separated"
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Field label="Live link" value={project.link} onChange={setField('link')} />
          <Field label="GitHub URL" value={project.github} onChange={setField('github')} />
        </Box>
        <MediaField
          label="Card image"
          value={project.image}
          onChange={(image) => set({ image })}
          folder={folder}
          accept="image/*"
          helperText="Home page card and the planet in the orbit"
        />
      </Box>

      <Typography variant="overline" color="text.secondary">Hero</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        <Select
          label="Hero type"
          value={project.hero.type}
          onChange={(type) => setHero({ type })}
          options={[{ value: 'image', label: 'Image / GIF' }, { value: 'video', label: 'Looping video' }]}
        />
        <MediaField
          label="Hero media"
          value={project.hero.src}
          onChange={(src) => setHero({ src })}
          folder={folder}
          accept={project.hero.type === 'video' ? 'video/*' : 'image/*'}
          helperText="Falls back to the card image when empty"
        />
        {project.hero.type === 'video' && (
          <MediaField label="Hero poster" value={project.hero.poster} onChange={(poster) => setHero({ poster })} folder={folder} accept="image/*" />
        )}
        <Field label="Hero alt text" value={project.hero.alt} onChange={(e) => setHero({ alt: e.target.value })} />
      </Box>

      <Typography variant="overline" color="text.secondary">Story</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {blocks.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No blocks yet. Add some text, images, videos or embeds.
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
        autoHideDuration={4000}
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

const ProjectEditor = () => <AdminGate>{() => <Editor />}</AdminGate>;

export default ProjectEditor;
