import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/home" element={<Landing />} />

        {/* --- RUTAS PRIVADAS / PRINCIPALES --- */}
        <Route path="/mascotas" element={<MisMascotas />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/foro" element={<Foro />} />
        
        {/* --- RUTAS DE SERVICIOS --- */}
        <Route path="/veterinarias" element={<h1>Sección Veterinarias</h1>} />

        {/* --- RUTA ADMINISTRATIVA --- */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* --- RUTAS COMODÍN --- */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;