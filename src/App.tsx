// src/App.tsx
import React from 'react';
import HomePage from './pages/HomePage';
import { AuthProvider } from '@/lib/authContext';

export default function App() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}
