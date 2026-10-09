// src/App.tsx
import React from 'react';
import Home from '../app/page';
import { AuthProvider } from '@/lib/authContext';

export default function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}


