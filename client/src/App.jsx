import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import CitasAgendadas from './pages/veterinaria/CitasAgendadas/CitasAgendadas';

import Login from "./pages/public/Login/Login";
import Registro from "./pages/public/Registro/Registro";
import MisMascotas from "./pages/tutor/MisMascotas/MisMascotas";
import Turnos from "./pages/tutor/Turnos/Turnos";
import Foro from "./pages/tutor/Foro/Foro";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import NotFound from "./pages/NotFound/NotFound";
import Emergencias from "./pages/tutor/Emergencias/Emergencias";
import RegistroDeVeterinaria from './pages/veterinaria/RegistroDeVeterinaria/RegistroDeVeterinaria';
import AgendarTurnos from "./pages/tutor/Turnos/AgendarTurno";
import PerfilVeterinaria from "./pages/tutor/Turnos/PerfilVeterinaria";
import HomeTutor from "./pages/tutor/HomeTutor/HomeTutor";
import HomeVeterinaria from "./pages/veterinaria/HomeVeterinaria/HomeVeterinaria";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro-veterinaria" element={<PrivateRoute allowedRoles={["veterinaria"]}><RegistroDeVeterinaria /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/home" element={<PrivateRoute allowedRoles={["dueno"]}><HomeTutor /></PrivateRoute>} />
        <Route path="/home-veterinaria" element={<PrivateRoute allowedRoles={["veterinaria"]}><HomeVeterinaria /></PrivateRoute>} />
        <Route path="/mascotas" element={<PrivateRoute allowedRoles={["dueno"]}><MisMascotas /></PrivateRoute>} />
        <Route path="/turnos" element={<PrivateRoute allowedRoles={["dueno"]}><Turnos /></PrivateRoute>} />
        <Route
          path="/turnos/agendar/:veterinariaId"
          element={<PrivateRoute allowedRoles={["dueno"]}><AgendarTurnos /></PrivateRoute>}
        />
        <Route path="/tutor/veterinarias/:id" element={<PerfilVeterinaria />} />
        <Route path="/foro" element={<PrivateRoute allowedRoles={["dueno"]}><Foro /></PrivateRoute>} />
        <Route path="/veterinarias" element={<PrivateRoute allowedRoles={["dueno"]}><h1>Sección Veterinarias</h1></PrivateRoute>} />
        <Route path="/agenda" element={<PrivateRoute allowedRoles={["veterinaria"]}><CitasAgendadas /></PrivateRoute>} />
        <Route path="/urgencias" element={<PrivateRoute allowedRoles={["dueno"]}><Emergencias /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />

        {/* "/" sin usar por ahora: lo primero que ve cualquiera que entra
            a la app es el login. Luego debria ser el landing */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;