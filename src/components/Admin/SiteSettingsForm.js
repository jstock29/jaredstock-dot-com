import React, { useEffect, useState } from 'react';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, FormControlLabel, Snackbar, Switch,
  TextField, Typography,
} from '@mui/material';
import { db } from '../../firebase';
import { DEFAULT_SETTINGS, SECTION_KEYS, getSettings, mergeSettings } from '../../data/settings';
import MediaField from './MediaField';

const SECTION_HELP = {
  about: 'The photo and intro under the hero.',
  work: 'The experience timeline, skills and the resume link.',
  projects: 'Project cards, each linking to its own page.',
  publications: 'Writing and talks.',
};

function Section({ title, help, children }) {
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
          {help && <Typography variant="body2" color="text.secondary">{help}</Typography>}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

const Field = (props) => <TextField size="small" fullWidth {...props} value={props.value ?? ''} />;

// Everything on the home page that isn't a list: name, links, about, resume, section
// titles and visibility, and the footer. Saved to the single settings/site doc.
export default function SiteSettingsForm() {
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState(null);

  useEffect(() => {
    getDocFromServer(doc(db, 'settings', 'site'))
      .then((snap) => setForm(mergeSettings(snap.exists() ? snap.data() : {})))
      .catch((err) => {
        setForm(DEFAULT_SETTINGS);
        setSnack({ severity: 'error', message: `Couldn't load saved settings, showing the defaults: ${err.message}` });
      });
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!form) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // set('about', 'heading')(value) updates form.about.heading.
  const set = (group, key) => (value) => {
    setForm((f) => (key ? { ...f, [group]: { ...f[group], [key]: value } } : { ...f, [group]: value }));
    setDirty(true);
  };
  const onText = (group, key) => (e) => set(group, key)(e.target.value);
  const setSection = (key, patch) => {
    setForm((f) => ({ ...f, sections: { ...f.sections, [key]: { ...f.sections[key], ...patch } } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'settings', 'site'), data);
      const check = await getDocFromServer(doc(db, 'settings', 'site'));
      if (!check.exists() || check.data().updatedAt !== data.updatedAt) {
        throw new Error("the database didn't confirm the change. Try again.");
      }
      getSettings({ fresh: true });
      setDirty(false);
      setSnack({ severity: 'success', message: "Saved. It's on the site now." });
    } catch (err) {
      setSnack({ severity: 'error', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Box
        sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2,
          position: 'sticky', top: 8, zIndex: 2, py: 1, px: 2, mx: -2, borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(8px)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Site</Typography>
        <Button variant="contained" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>

      <Section title="Header" help="The big name over the orbits, and the icons under it. Clear a link to hide its icon.">
        <Field label="Name" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        <Field label="GitHub URL" value={form.links.github} onChange={onText('links', 'github')} />
        <Field label="LinkedIn URL" value={form.links.linkedin} onChange={onText('links', 'linkedin')} />
        <Field label="Email" value={form.links.email} onChange={onText('links', 'email')} />
      </Section>

      <Section title="About">
        <Field label="Heading" value={form.about.heading} onChange={onText('about', 'heading')} />
        <Field
          label="Body"
          multiline
          minRows={4}
          value={form.about.body}
          onChange={onText('about', 'body')}
          helperText="Markdown: [link text](https://…), **bold**, *italic*. A blank line starts a new paragraph."
        />
        <MediaField
          label="Photo"
          value={form.about.photo}
          onChange={set('about', 'photo')}
          folder="site"
          accept="image/*"
          helperText="Paste a URL or upload. Leave empty for no photo."
        />
      </Section>

      <Section title="Resume" help="Linked from the experience section. Leave empty to hide the link.">
        <MediaField
          label="Resume (PDF)"
          value={form.resumeUrl}
          onChange={set('resumeUrl')}
          folder="site"
          accept="application/pdf"
        />
      </Section>

      <Section title="Home page sections" help="Rename a section or hide it. The menu follows along.">
        {SECTION_KEYS.map((key) => (
          <Box key={key} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Field
              label={`${key[0].toUpperCase()}${key.slice(1)} title`}
              value={form.sections[key].title}
              onChange={(e) => setSection(key, { title: e.target.value })}
              helperText={SECTION_HELP[key]}
            />
            <FormControlLabel
              sx={{ flexShrink: 0, mb: 2.5 }}
              control={<Switch checked={form.sections[key].show} onChange={(e) => setSection(key, { show: e.target.checked })} />}
              label="Show"
            />
          </Box>
        ))}
      </Section>

      <Section title="Blog" help="The name and description at the top of /blog, in its link previews and in the RSS feed.">
        <Field label="Blog name" value={form.blog.title} onChange={onText('blog', 'title')} />
        <Field
          label="Description"
          multiline
          minRows={2}
          value={form.blog.description}
          onChange={onText('blog', 'description')}
          helperText="Optional. Share previews update with the next deploy."
        />
      </Section>

      <Section title="Footer" help="Click the name in the footer to make it snow.">
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Field label="Name" value={form.footer.name} onChange={onText('footer', 'name')} />
          <Field label="Location" value={form.footer.location} onChange={onText('footer', 'location')} />
        </Box>
      </Section>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={5000}
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
