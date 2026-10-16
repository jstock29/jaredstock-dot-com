import React from 'react';
import { Route, Routes, useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Box, Button, Container, Paper, Tab, Tabs, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { auth } from '../../firebase';
import AdminGate from './AdminGate';
import CollectionTab from './CollectionTab';
import EntryEditor from './EntryEditor';
import EntryList from './EntryList';
import SiteSettingsForm from './SiteSettingsForm';

const TABS = [
  { key: 'site', label: 'Site', render: () => <SiteSettingsForm /> },
  { key: 'projects', label: 'Projects', render: () => <EntryList type="projects" /> },
  { key: 'publications', label: 'Publications', render: () => <EntryList type="publications" /> },
  { key: 'pages', label: 'Pages', render: () => <EntryList type="pages" /> },
  { key: 'work', label: 'Experience', render: () => <CollectionTab collectionName="work" title="Experience" /> },
  { key: 'skills', label: 'Skills', render: () => <CollectionTab collectionName="skills" title="Skills" /> },
];

function AdminHome({ user }) {
  const [params, setParams] = useSearchParams();
  const current = TABS.find((t) => t.key === params.get('tab')) || TABS[0];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Site admin</Typography>
          <Typography variant="body2" color="text.secondary">Signed in as {user.email}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button component="a" href="/" target="_blank" rel="noreferrer" color="inherit">View site</Button>
          <Button variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={() => signOut(auth)}>
            Log out
          </Button>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={current.key}
          onChange={(_, key) => setParams({ tab: key })}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      {current.render()}
    </Container>
  );
}

export default function AdminApp() {
  return (
    <AdminGate>
      {(user) => (
        <Routes>
          <Route index element={<AdminHome user={user} />} />
          <Route path=":type/:id" element={<EntryEditor />} />
        </Routes>
      )}
    </AdminGate>
  );
}
