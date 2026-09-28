import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, CircularProgress } from '@mui/material';
import { auth } from '../../firebase';
import Login from './Login';

// Renders children(user) once signed in; shows the login form otherwise.
const AdminGate = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return children(user);
};

export default AdminGate;
