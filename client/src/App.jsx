import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/public/Login/Login";
import Registro from "./pages/public/Registro/Registro";

import MisMascotas from "./pages/tutor/MisMascotas/MisMascotas";
import Turnos from "./pages/tutor/Turnos/Turnos";
import Foro from "./pages/tutor/Foro/Foro";
import Emergencias from "./pages/tutor/Emergencias/Emergencias";

import CitasAgendadas from "./pages/veterinaria/CitasAgendadas/CitasAgendadas";
import RegistroDeVeterinaria from "./pages/veterinaria/RegistroDeVeterinaria/RegistroDeVeterinaria";
import RegistrarConsulta from "./pages/veterinaria/HistorialClinico/RegistrarConsulta";

import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import NotFound from "./pages/NotFound/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/register" element={<Registro />} />

        {/* Rutas del tutor */}
        <Route
          path="/home"
          element={
            <PrivateRoute allowedRoles={["dueno"]}>
              <Navigate to="/mascotas" replace />
            </PrivateRoute>
          }
        />

        <Route
          path="/mascotas"
          element={
            <PrivateRoute allowedRoles={["dueno"]}>
              <MisMascotas />
            </PrivateRoute>
          }
        />

        <Route
          path="/turnos"
          element={
            <PrivateRoute allowedRoles={["dueno"]}>
              <Turnos />
            </PrivateRoute>
          }
        />

        <Route
          path="/foro"
          element={
            <PrivateRoute allowedRoles={["dueno"]}>
              <Foro />
            </PrivateRoute>
          }
        />

        <Route
          path="/veterinarias"
          element={
            <PrivateRoute allowedRoles={["dueno"]}>
              <h1>Sección Veterinarias</h1>
            </PrivateRoute>
          }
        />

        <Route
          path="/urgencias"
          element={
            <PrivateRoute allowedRoles={["dueno"]}>
              <Emergencias />
            </PrivateRoute>
          }
        />

        {/* Rutas de veterinaria */}
        <Route
          path="/registro-veterinaria"
          element={
            <PrivateRoute allowedRoles={["veterinaria"]}>
              <RegistroDeVeterinaria />
            </PrivateRoute>
          }
        />

        <Route
          path="/home-veterinaria"
          element={
            <PrivateRoute allowedRoles={["veterinaria"]}>
              <Navigate to="/agenda" replace />
            </PrivateRoute>
          }
        />

        <Route
          path="/agenda"
          element={
            <PrivateRoute allowedRoles={["veterinaria"]}>
              <CitasAgendadas />
            </PrivateRoute>
          }
        />

        <Route
          path="/historial/registrar/:turnoId"
          element={
            <PrivateRoute allowedRoles={["veterinaria"]}>
              <RegistrarConsulta />
            </PrivateRoute>
          }
        />

        {/* Rutas del administrador */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["administrador"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={["administrador"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;