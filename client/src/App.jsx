import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/public/Login/Login';
import Registro from './pages/public/registro/Registro';
import Landing from './pages/public/LandingPage/Landing';

import MisMascotas from './pages/tutor/MisMascotas/MisMascotas';
import Turnos from './pages/tutor/Turnos/Turnos';
import Foro from './pages/tutor/Foro/Foro';

import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/home" element={<Landing />} />

        <Route path="/mascotas" element={<MisMascotas />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/foro" element={<Foro />} />

        <Route path="/veterinarias" element={<h1>Sección Veterinarias</h1>} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;